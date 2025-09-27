// stores/call.ts
import { defineStore } from "pinia";
import { ref, reactive, computed, watch } from "vue";
import { useAVStore } from "./app/av";
import { useSettingsStore } from "./settings";
import { useProfilesStore } from "./user/profiles";

type Participant = {
  id: string;
  display: string;
  hasVideo: boolean;
  hasScreen: boolean;
  hasAudio: boolean;
  stream: MediaStream;
  isSpeaking: boolean;
  speakingLevel: number;
  avatarUrl?: string;
};

const JANUS_SERVER = "ws://31.129.110.23:8188/janus";
const JANUS_ROOM = 1234;

// Meta → display
function encodeDisplay(name: string, avatarUrl?: string) {
  try {
    return JSON.stringify({ n: name, a: avatarUrl || "" });
  } catch {
    return name || "User";
  }
}
function decodeDisplay(s: string): { name: string; avatar?: string } {
  if (!s) return { name: "User" };
  try {
    const o = JSON.parse(s);
    return { name: o?.n || "User", avatar: o?.a || undefined };
  } catch {
    return { name: s };
  }
}

export const useCallStore = defineStore("call", () => {
  const callEnabled = ref(false);
  const activeVoiceChannelId = ref<string | null>(null);
  const focusParticipantId = ref<string | null>(null);

  // Janus objects
  const janusClient = ref<any | null>(null);
  const janusSession = ref<any | null>(null);
  const janusRoom = ref<any | null>(null);
  const publisher = ref<any | null>(null);

  // Local media
  const localStream = ref<MediaStream | null>(import.meta.client ? new MediaStream() : null);
  const localVideoKind = ref<"none" | "camera" | "screenshare">("none");

  // Devices
  const selectedMicId = ref<string | null>(import.meta.client ? localStorage.getItem("microphoneDevice") : null);
  const selectedCamId = ref<string | null>(import.meta.client ? localStorage.getItem("cameraDevice") : null);
  const selectedOutputId = ref<string | null>(import.meta.client ? localStorage.getItem("audioOutputDevice") : null);

  // Screenshare constraints preset (пока не используем глубоко, но сохраняем на будущее)
  const shareConstraints = ref<{ width?: number; height?: number; frameRate?: number } | null>(null);

  // Participants and subscriptions
  const participants = reactive<Map<string, Participant>>(new Map());
  const subscriptions = new Map<string, any>();

  // Для каждого подписчика храним набор подписанных mid
  const subMidsMap = new Map<string, Set<any>>();

  // Состояние ensure/retry по подписчикам и таймеры гашения видео
  const subState = new Map<string, { ensureTimer?: number; retryTimer?: number; retries: number }>();
  const videoHideTimers = new Map<string, number>();

  function clearSubTimers(pid: string) {
    const st = subState.get(pid);
    if (!st) return;
    if (st.ensureTimer) clearTimeout(st.ensureTimer);
    if (st.retryTimer) clearTimeout(st.retryTimer);
    subState.set(pid, { retries: st.retries || 0 });
  }
  function clearAllSubTimers() {
    for (const pid of subState.keys()) clearSubTimers(pid);
    for (const tm of videoHideTimers.values()) clearTimeout(tm);
    subState.clear();
    videoHideTimers.clear();
  }
  function hasRemoteVideo(pid: string) {
    const p = participants.get(pid);
    return !!p && p.stream.getVideoTracks().length > 0;
  }

  // Audio analysers
  const analyserMap = new Map<
    string,
    { ctx: AudioContext; analyser: AnalyserNode; src: MediaStreamAudioSourceNode }
  >();
  let localAnalyser:
    | { ctx: AudioContext; analyser: AnalyserNode; src: MediaStreamAudioSourceNode }
    | null = null;
  let speakingRaf = 0;

  const settings = useSettingsStore();
  const av = useAVStore();
  const profiles = useProfilesStore();

  const participantList = computed(() => Array.from(participants.values()));
  const focusedParticipant = computed(() =>
    focusParticipantId.value ? participants.get(focusParticipantId.value) || null : null
  );

  function persistDevices() {
    if (!import.meta.client) return;
    if (selectedMicId.value) localStorage.setItem("microphoneDevice", selectedMicId.value);
    if (selectedCamId.value) localStorage.setItem("cameraDevice", selectedCamId.value);
    if (selectedOutputId.value) localStorage.setItem("audioOutputDevice", selectedOutputId.value);
  }

  // Инициализация клиента: импортируем janus-simple-videoroom-client явно
  let clientReady: Promise<any> | null = null;
  async function ensureJanus() {
    if (!import.meta.client) return;

    if (!janusClient.value) {
      if (!clientReady) {
        const mod = await import("janus-simple-videoroom-client");
        clientReady = mod.createVideoRoomClient({
          debug: true,
          rtcConfig: {
            iceServers: [
              { urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
              // Добавьте свой TURN здесь для продакшена
              // { urls: "turns:turn.example.com:5349", username: "", credential: "" }
            ],
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require",
          },
        });
      }
      janusClient.value = await clientReady;
    }
    if (!janusSession.value) {
      janusSession.value = await janusClient.value.createSession(JANUS_SERVER);
    }
    if (!janusRoom.value) {
      janusRoom.value = await janusSession.value.joinRoom(JANUS_ROOM);

      // Доп. слушатель «сырых» событий комнаты: ловим обновления streams
      attachRoomMessageListener(janusRoom.value);
    }
  }

  function attachRoomMessageListener(room: any) {
    // События видеокомнаты от плагина
    room.pluginHandle?.eventTarget?.addEventListener("message", (ev: CustomEvent) => {
      const msg = ev.detail?.message;
      if (!msg || msg.videoroom !== "event") return;

      if (Array.isArray(msg.streams)) {
        // Группируем по feed
        const grouped = new Map<number, any[]>();
        for (const s of msg.streams) {
          const feed = Number(s.feed);
          if (!grouped.has(feed)) grouped.set(feed, []);
          grouped.get(feed)!.push(s);
        }

        grouped.forEach(async (items, feed) => {
          const pid = String(feed);
          const sub = subscriptions.get(pid);
          if (!sub) return;

          const known = subMidsMap.get(pid) || new Set<any>();
          // Стремимся быстрее добрать видео mID
          const toAdd = items
            .filter(
              (s) =>
                s.mid != null &&
                (s.type === "video" || s.mtype === "video") &&
                !known.has(s.mid)
            )
            .map((s) => ({ feed, mid: s.mid }));

          if (toAdd.length) {
            try {
              await sub.addStreams(toAdd);
            } catch (e) {
              console.warn("message.streams addStreams error", e);
            }
          }

          // Обычная синхронизация (поддержка removed/disabled и т.п.)
          const toRemove: any[] = [];
          items.forEach((s) => {
            const mid = s.mid;
            const removed =
              s.removed === true ||
              s.send === false ||
              s.active === false ||
              s.disabled === true;
            if (removed && mid != null && known.has(mid)) {
              toRemove.push({ feed, mid });
            }
          });
          try {
            if (toRemove.length) await sub.removeStreams(toRemove);
          } catch (e) {
            console.warn("message.streams removeStreams error", e);
          }

          // Страховка: запустим ensure-цикл с известным набором streams
          const p = participants.get(pid);
          if (p) {
            const pubShim = { id: feed, streams: items };
            scheduleEnsureCycle(pid, pubShim);
          }
        });
      }
    });
  }

  function clearAnalysers() {
    if (localAnalyser) {
      localAnalyser.ctx.close().catch(() => {});
      localAnalyser = null;
    }
    analyserMap.forEach(({ ctx }) => ctx.close().catch(() => {}));
    analyserMap.clear();
    if (import.meta.client) cancelAnimationFrame(speakingRaf);
    speakingRaf = 0;
  }

  function startSpeakingLoop() {
    if (!import.meta.client) return;
    cancelAnimationFrame(speakingRaf);
    const loop = () => {
      if (localAnalyser) {
        const arr = new Uint8Array(localAnalyser.analyser.frequencyBinCount);
        localAnalyser.analyser.getByteFrequencyData(arr);
        const avg = arr.reduce((a, b) => a + b, 0) / (arr.length || 1) / 255;
        av.lastMicLevel = avg;
      }
      participants.forEach((p, id) => {
        const node = analyserMap.get(id);
        if (!node) return;
        const arr = new Uint8Array(node.analyser.frequencyBinCount);
        node.analyser.getByteFrequencyData(arr);
        const avg = arr.reduce((a, b) => a + b, 0) / (arr.length || 1) / 255;
        p.speakingLevel = avg;
        p.isSpeaking = avg > 0.08;
      });
      speakingRaf = requestAnimationFrame(loop);
    };
    speakingRaf = requestAnimationFrame(loop);
  }

  function attachAnalyserForStream(publisherId: string, stream: MediaStream, isLocal = false) {
    if (!import.meta.client) return;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(new MediaStream([audioTracks[0]]));
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    if (isLocal) {
      localAnalyser = { ctx, analyser, src };
    } else {
      analyserMap.set(publisherId, { ctx, analyser, src });
    }
    if (!speakingRaf) startSpeakingLoop();
  }

  async function joinVoiceChannel(channelId: string, displayName?: string) {
    if (!import.meta.client) return;
    if (callEnabled.value && activeVoiceChannelId.value === channelId) return;

    await ensureJanus();
    if (callEnabled.value) await leaveCall(false);

    clearAnalysers();
    clearAllSubTimers();

    localStream.value?.getTracks().forEach((t) => t.stop());
    localStream.value = new MediaStream();

    localVideoKind.value = settings.videoEnabled ? "camera" : "none";

    const profileName = displayName?.trim() || profiles.name?.trim() || "Без имени";
    const profileAvatar = profiles.avatar || "";

    participants.set("local", {
      id: "local",
      display: profileName,
      hasVideo: false,
      hasScreen: false,
      hasAudio: false,
      stream: localStream.value!,
      isSpeaking: false,
      speakingLevel: 0,
      avatarUrl: profileAvatar || undefined,
    });

    // Список паблишеров
    janusRoom.value.onPublisherAdded((pubs: any[]) => pubs.forEach(subscribe));
    janusRoom.value.onPublisherRemoved(unsubscribe);
    if (typeof janusRoom.value.onPublisherList === "function") {
      janusRoom.value.onPublisherList((pubs: any[]) => pubs.forEach(subscribe));
    }

    await publishWithCurrentSettings();

    callEnabled.value = true;
    activeVoiceChannelId.value = channelId;
    settings.toggleCall(true);
  }

  // Вспомогательные функции для ускорения/страховки подписки
  async function ensureMissingMids(pid: string, pub: any) {
    const sub = subscriptions.get(pid);
    if (!sub) return;

    const known = subMidsMap.get(pid) || new Set<any>();
    const streamList: any[] = Array.isArray(pub.streams) ? pub.streams : [];
    const videoMids = streamList
      .filter((s) => s.mid != null && (s.type === "video" || s.mtype === "video"))
      .map((s) => s.mid);

    const toAdd = videoMids
      .filter((mid) => !known.has(mid))
      .map((mid) => ({ feed: pub.id, mid }));

    if (toAdd.length) {
      try {
        await sub.addStreams(toAdd);
      } catch (e) {
        console.warn("ensureMissingMids addStreams failed", e);
      }
    }
  }

  async function forceResubscribe(pid: string, pub: any) {
    const oldSub = subscriptions.get(pid);
    if (!janusRoom.value) return;

    if (hasRemoteVideo(pid)) return;

    try {
      if (oldSub) {
        await oldSub.unsubscribe().catch(() => {});
      }
      const newSub = await janusRoom.value.subscribe([{ feed: pub.id }]);
      subscriptions.set(pid, newSub);
      subMidsMap.set(pid, new Set<any>());

      const p = participants.get(pid);
      if (!p) return;
      const stream = p.stream;

      attachSubHandlers(pid, newSub, p, stream);
    } catch (e) {
      console.warn("forceResubscribe error", e);
    }
  }

  function scheduleEnsureCycle(pid: string, pub: any) {
    // Если уже есть видео — не дёргаем
    if (hasRemoteVideo(pid)) {
      clearSubTimers(pid);
      subState.set(pid, { retries: 0 });
      return;
    }

    const st = subState.get(pid) || { retries: 0 };
    // Шаг 1: быстрый ensure после подписки (или обновления)
    st.ensureTimer = setTimeout(async () => {
      await ensureMissingMids(pid, pub);

      // Если всё ещё нет видео, планируем мягкий retry (resubscribe)
      if (!hasRemoteVideo(pid)) {
        st.retryTimer = setTimeout(async () => {
          const tries = (st.retries || 0) + 1;
          if (tries <= 2 && !hasRemoteVideo(pid)) {
            subState.set(pid, { retries: tries });
            await forceResubscribe(pid, pub);
          }
        }, 2000); // 2s после ensure
      }
    }, 700); // 700ms после начальной подписки/ивента

    subState.set(pid, st);
  }

  function attachSubHandlers(pid: string, sub: any, p: Participant, stream: MediaStream) {
    sub.onTrackAdded((track: MediaStreamTrack, mid: any) => {
      // Любой новый трек → сброс таймеров (видео появится — избавимся от ретраев)
      clearSubTimers(pid);

      if (track.kind === "video") {
        stream.addTrack(track);
        // Оставляем только последний видео-трек — чтобы не мигало
        stream.getVideoTracks().forEach((t) => {
          if (t !== track) stream.removeTrack(t);
        });
        p.hasVideo = true;
      } else if (track.kind === "audio") {
        stream.addTrack(track);
        p.hasAudio = true;
        attachAnalyserForStream(p.id, stream);
      }

      if (mid != null) {
        const set = subMidsMap.get(pid);
        if (set) set.add(mid);
      }
    });

    sub.onTrackRemoved((track: MediaStreamTrack, mid: any) => {
      stream.removeTrack(track);
      if (mid != null) {
        const set = subMidsMap.get(pid);
        if (set) set.delete(mid);
      }

      if (track.kind === "video") {
        // Гистерезис: не гасим «видео» мгновенно, ждём 400мс —
        // часто Janus даёт mute/remove/unmute при рестарте
        const oldTimer = videoHideTimers.get(pid);
        if (oldTimer) clearTimeout(oldTimer);
        const tm = setTimeout(() => {
          p.hasVideo = stream.getVideoTracks().length > 0;
          videoHideTimers.delete(pid);
        }, 400);
        videoHideTimers.set(pid, tm as unknown as number);
      } else if (track.kind === "audio") {
        p.hasAudio = stream.getAudioTracks().length > 0;
      }
    });
  }

  // Подписка/досабскрайб на обновления streams
  async function subscribe(pub: any) {
    if (!import.meta.client || !janusRoom.value) return;

    const pid = String(pub.id);
    const incomingMids = new Set<any>((pub.streams || []).map((s: any) => s.mid).filter((m: any) => m != null));

    // Уже подписаны → синхронизируем mid'ы (add/remove) и планируем ensure
    if (subscriptions.has(pid)) {
      const sub = subscriptions.get(pid);
      const known = subMidsMap.get(pid) || new Set<any>();

      const toAdd: any[] = [];
      const toRemove: any[] = [];

      incomingMids.forEach((mid) => {
        if (!known.has(mid)) toAdd.push({ feed: pub.id, mid });
      });
      known.forEach((mid) => {
        if (!incomingMids.has(mid)) toRemove.push({ feed: pub.id, mid });
      });

      try {
        if (toAdd.length) await sub.addStreams(toAdd);
        if (toRemove.length) await sub.removeStreams(toRemove);
      } catch (e) {
        console.warn("sub update error", e);
      }

      scheduleEnsureCycle(pid, pub);
      return;
    }

    // Первая подписка: подписываемся на весь feed
    const sub = await janusRoom.value.subscribe([{ feed: pub.id }]);
    subscriptions.set(pid, sub);
    subMidsMap.set(pid, new Set<any>());

    const stream = new MediaStream();
    const meta = decodeDisplay(pub.display || "");
    const p: Participant = {
      id: pid,
      display: meta.name || `User ${pub.id}`,
      hasVideo: false,
      hasScreen: false,
      hasAudio: false,
      stream,
      isSpeaking: false,
      speakingLevel: 0,
      avatarUrl: meta.avatar,
    };
    participants.set(p.id, p);

    attachSubHandlers(pid, sub, p, stream);

    // Планируем ensure/возможный точечный resubscribe, если видео не придёт
    scheduleEnsureCycle(pid, pub);
  }

  async function unsubscribe(publisherId: string) {
    const pid = String(publisherId);
    try {
      const sub = subscriptions.get(pid);
      if (sub) {
        await sub.unsubscribe().catch(() => {});
        subscriptions.delete(pid);
      }
    } catch {}
    subMidsMap.delete(pid);

    // Чистим таймеры
    clearSubTimers(pid);
    const vtm = videoHideTimers.get(pid);
    if (vtm) clearTimeout(vtm);
    videoHideTimers.delete(pid);

    const p = participants.get(pid);
    if (p) {
      p.stream.getTracks().forEach((t) => t.stop());
      participants.delete(pid);
    }
    const node = analyserMap.get(pid);
    if (node) {
      node.ctx.close().catch(() => {});
      analyserMap.delete(pid);
    }
  }

  async function leaveCall(resetChannel = true) {
    for (const [pid, sub] of subscriptions.entries()) {
      try {
        await sub.unsubscribe();
      } catch {}
    }
    subscriptions.clear();
    subMidsMap.clear();

    clearAllSubTimers();

    for (const p of participants.values()) {
      if (p.id !== "local") {
        p.stream.getTracks().forEach((t) => t.stop());
      }
    }
    participants.clear();

    clearAnalysers();

    localStream.value?.getTracks().forEach((t) => t.stop());
    localStream.value = import.meta.client ? new MediaStream() : null;
    localStream.value = new MediaStream();

    localVideoKind.value = "none";

    try {
      if (publisher.value) await publisher.value.unpublish();
    } catch {}
    publisher.value = null;

    try {
      if (janusRoom.value) await janusRoom.value.leave();
    } catch {}
    janusRoom.value = null;

    callEnabled.value = false;
    settings.toggleCall(false);
    if (resetChannel) activeVoiceChannelId.value = null;
    focusParticipantId.value = null;
    shareConstraints.value = null;
  }

  async function resumeAnalysers() {
    if (!import.meta.client) return;
    try {
      if (localAnalyser?.ctx && localAnalyser.ctx.state === "suspended") {
        await localAnalyser.ctx.resume();
      }
    } catch {}
    for (const { ctx } of analyserMap.values()) {
      try {
        if (ctx.state === "suspended") await ctx.resume();
      } catch {}
    }
  }

  async function toggleMic(on: boolean) {
    settings.toggleMicrophone(on);
    if (!callEnabled.value) return;
    await publishWithCurrentSettings();
    const me = participants.get("local");
    if (me) me.hasAudio = !!on;
  }

  async function toggleCamera(on: boolean) {
    settings.toggleVideo(on);
    if (!callEnabled.value) return;

    if (localVideoKind.value !== "screenshare") {
      localVideoKind.value = on ? "camera" : "none";
    }
    await publishWithCurrentSettings();
    const me = participants.get("local");
    if (me) me.hasVideo = !!on;
  }

  async function toggleScreenshare(
    on: boolean,
    opts?: { width?: number; height?: number; frameRate?: number }
  ) {
    if (!callEnabled.value) return;

    if (on) {
      localVideoKind.value = "screenshare";
      shareConstraints.value = opts || null;
    } else {
      localVideoKind.value = settings.videoEnabled ? "camera" : "none";
      shareConstraints.value = null;
    }

    await publishWithCurrentSettings();

    const me = participants.get("local");
    if (me) {
      me.hasScreen = on;
      me.hasVideo = on || settings.videoEnabled;
    }
  }

  function setMicDevice(id: string) {
    selectedMicId.value = id;
    persistDevices();
    if (callEnabled.value) {
      publishWithCurrentSettings(); // renegotiation
    }
  }

  function setCamDevice(id: string) {
    selectedCamId.value = id;
    persistDevices();
    if (callEnabled.value) {
      publishWithCurrentSettings();
    }
  }

  function setOutputDevice(id: string) {
    selectedOutputId.value = id;
    persistDevices();
  }

  // Сборка треков для текущих настроек (tracks API)
  function buildTracksForCurrent(): any[] {
    const tracks: any[] = [];

    // AUDIO
    if (settings.microphoneEnabled) {
      tracks.push({
        type: "audio",
        capture: selectedMicId.value ? { deviceId: { exact: selectedMicId.value } } : true,
      });
    }

    // VIDEO
    if (localVideoKind.value === "camera" && settings.videoEnabled) {
      tracks.push({
        type: "video",
        capture: selectedCamId.value ? { deviceId: { exact: selectedCamId.value } } : true,
      });
    } else if (localVideoKind.value === "screenshare") {
      tracks.push({
        type: "video",
        capture: "screen", // надёжнее флаг строки для screen
      });
      // Если нужно строго задавать fps/размер — потребуется расширение в клиенте / кастомная реализация
    }

    return tracks;
  }

  function buildInitialMediaOptions(): { tracks: any[] } {
    return { tracks: buildTracksForCurrent() };
  }

  async function publishWithCurrentSettings() {
    const displayPayload = encodeDisplay(
      profiles.name?.trim() || "Без имени",
      profiles.avatar || ""
    );

    const tracks = buildTracksForCurrent();
    const wantAnyMedia = tracks.length > 0;

    // Первый publish
    if (!publisher.value) {
      if (!wantAnyMedia) {
        return; // заходим без исходящих медиа
      }

      publisher.value = await janusRoom.value.publish({
        publishOptions: { display: displayPayload },
        mediaOptions: { tracks },
      });

      // Локальные треки: добавляем новый трек и только потом очищаем старые, чтобы не мигало
      publisher.value.onTrackAdded((track: MediaStreamTrack) => {
        if (!localStream.value) localStream.value = new MediaStream();

        if (track.kind === "video") {
          localStream.value.addTrack(track);
          localStream.value.getVideoTracks().forEach((t) => {
            if (t !== track) localStream.value!.removeTrack(t);
          });
        } else {
          localStream.value.addTrack(track);
        }

        const me = participants.get("local");
        if (me) {
          if (track.kind === "video") {
            me.hasVideo = true;
            me.hasScreen = localVideoKind.value === "screenshare";
          }
          if (track.kind === "audio") {
            me.hasAudio = true;
            attachAnalyserForStream("local", localStream.value, true);
          }
        }
      });

      publisher.value.onTrackRemoved((track: MediaStreamTrack) => {
        if (!localStream.value) return;
        localStream.value.removeTrack(track);
        const me = participants.get("local");
        if (me) {
          if (track.kind === "video") me.hasVideo = localStream.value.getVideoTracks().length > 0;
          if (track.kind === "audio") me.hasAudio = localStream.value.getAudioTracks().length > 0;
        }
      });

      return;
    }

    // Мягкий перезапуск: передаём актуальный набор tracks
    await publisher.value.restart({ tracks }, { display: displayPayload });
  }

  // Обновлять локальную карточку при изменении профиля
  watch(
    () => [profiles.name, profiles.avatar] as const,
    ([nm, av]) => {
      const me = participants.get("local");
      if (me) {
        if (nm) me.display = nm;
        me.avatarUrl = av || undefined;
      }
    }
  );

  function setFocusParticipant(id: string | null) {
    focusParticipantId.value = id;
  }

  return {
    callEnabled,
    activeVoiceChannelId,
    participants: participantList,
    focusParticipantId,
    focusedParticipant,
    selectedMicId,
    selectedCamId,
    selectedOutputId,
    localVideoKind,

    joinVoiceChannel,
    leaveCall,

    toggleMic,
    toggleCamera,
    toggleScreenshare,

    setMicDevice,
    setCamDevice,
    setOutputDevice,
    setFocusParticipant,

    resumeAnalysers,
  };
});