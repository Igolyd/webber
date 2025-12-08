import { defineStore } from "pinia";
import { ref, reactive, computed, watch } from "vue";
import { useAVStore } from "./app/av";
import { useSettingsStore } from "./settings";
import { useProfilesStore } from "./user/profiles";
import { useChannelsStore } from "./channels";
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
const JANUS_SERVER = "wss://janus.shinegold.ru";
const STATIC_ROOM_ID = 1234;
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
  const isJoining = ref(false);
  const joinAttemptId = ref(0);
  const channelsStore = useChannelsStore();
  const janusClient = ref<any | null>(null);
  const janusSession = ref<any | null>(null);
  const janusRoom = ref<any | null>(null);
  const janusPlugin = ref<any | null>(null);
  const publisher = ref<any | null>(null);
  const localStream = ref<MediaStream | null>(
    import.meta.client ? new MediaStream() : null
  );
  const localVideoKind = ref<"none" | "camera" | "screenshare">("none");
  const currentScreenTrack = ref<MediaStreamTrack | null>(null);
  const selectedMicId = ref<string | null>(
    import.meta.client ? localStorage.getItem("microphoneDevice") : null
  );
  const selectedCamId = ref<string | null>(
    import.meta.client ? localStorage.getItem("cameraDevice") : null
  );
  const selectedOutputId = ref<string | null>(
    import.meta.client ? localStorage.getItem("audioOutputDevice") : null
  );
  const shareConstraints = ref<{
    width?: number;
    height?: number;
    frameRate?: number;
  } | null>(null);
  const participants = reactive<Map<string, Participant>>(new Map());
  const subscriptions = new Map<string, any>();
  const subMidsMap = new Map<string, Set<any>>();
  const subState = new Map<
    string,
    { ensureTimer?: number; retryTimer?: number; retries: number }
  >();
  const videoHideTimers = new Map<string, number>();
  function clearSubTimers(pid: string) {
    const st = subState.get(pid);
    if (!st) return;
    if (st.ensureTimer) clearTimeout(st.ensureTimer);
    if (st.retryTimer) clearTimeout(st.retryTimer);
    subState.set(pid, { retries: st.retries || 0 });
  }
  function cancelJoin() {
    joinAttemptId.value++;
    isJoining.value = false;
    if (callEnabled.value) {
      leaveCall().catch(() => {});
      return;
    }
    activeVoiceChannelId.value = null;
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
  const analyserMap = new Map<
    string,
    {
      ctx: AudioContext;
      analyser: AnalyserNode;
      src: MediaStreamAudioSourceNode;
    }
  >();
  let localAnalyser: {
    ctx: AudioContext;
    analyser: AnalyserNode;
    src: MediaStreamAudioSourceNode;
  } | null = null;

  let speakingRaf = 0;
  const settings = useSettingsStore();
  const av = useAVStore();
  const profiles = useProfilesStore();
  const participantList = computed(() => Array.from(participants.values()));
  const focusedParticipant = computed(() =>
    focusParticipantId.value
      ? participants.get(focusParticipantId.value) || null
      : null
  );
  function persistDevices() {
    if (!import.meta.client) return;
    if (selectedMicId.value)
      localStorage.setItem("microphoneDevice", selectedMicId.value);
    if (selectedCamId.value)
      localStorage.setItem("cameraDevice", selectedCamId.value);
    if (selectedOutputId.value)
      localStorage.setItem("audioOutputDevice", selectedOutputId.value);
  }
  function hasPublishedSender(kind: "audio" | "video"): boolean {
    try {
      const list = publisher.value?.pluginHandle?.getLocalTracks?.();
      if (Array.isArray(list)) {
        return !!list.find((t: any) => t?.type === kind);
      }
    } catch {}
    try {
      return !!localStream.value?.getTracks().some((t) => t.kind === kind);
    } catch {}
    return false;
  }
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
              {
                urls: "turn:185.198.152.131:3478",
                username: "ice",
                credential: "ShineGold#!",
              },
              {
                urls: "stun:185.198.152.131:3478",
              },
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
  }
  async function ensureVideoRoomPlugin() {
    await ensureJanus();
    if (janusPlugin.value) return janusPlugin.value;
    janusPlugin.value = await janusSession.value.attachToPlugin(
      "janus.plugin.videoroom"
    );
    return janusPlugin.value;
  }
  let soundboardCtx: AudioContext | null = null;
  // --- Микшер для микрофона + звуковой панели ---
  let mixerCtx: AudioContext | null = null;
  let mixerDestination: MediaStreamAudioDestinationNode | null = null;
  let micStream: MediaStream | null = null;
  let micTrack: MediaStreamTrack | null = null;
  let mixedAudioTrack: MediaStreamTrack | null = null;
  // Простой проигрыватель dataUrl — локально в динамики
  async function playSoundboardClip(clip: { dataUrl: string }) {
    if (!import.meta.client) return;
    try {
      // Если есть микшер — играем через него
      if (mixerCtx && mixerDestination) {
        const ctx = mixerCtx;

        const res = await fetch(clip.dataUrl);
        const buf = await res.arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(buf.slice(0));

        const src = ctx.createBufferSource();
        src.buffer = audioBuf;

        // Гейн на всякий случай (можно регулировать громкость soundboard)
        const gain = ctx.createGain();
        gain.gain.value = 1.0;

        src.connect(gain);
        // в общий микс (Janus)
        gain.connect(mixerDestination);
        // и в локальные динамики
        gain.connect(ctx.destination);

        src.start();
        return;
      }

      // Фолбэк: микшер ещё не инициализирован (например, микрофон выключен) —
      // просто играем звук локально, как раньше.
      const audio = new Audio(clip.dataUrl);
      audio.volume = 1;
      audio.play().catch(() => {});
    } catch (e) {
      console.warn("playSoundboardClip error", e);
    }
  }
  async function createJanusRoom(params?: {
    description?: string;
    pin?: string;
    permanent?: boolean;
    is_private?: boolean;
  }): Promise<number> {
    const plugin = await ensureVideoRoomPlugin();
    const req: any = {
      request: "create",
      permanent: params?.permanent ?? false,
      is_private: false,
    };
    if (params?.description) req.description = params.description;
    if (params?.pin) req.pin = params.pin;
    const res = await plugin.sendRequest(req);
    if (res?.videoroom === "created" && typeof res?.room === "number") {
      return res.room as number;
    }
    throw new Error("Janus room create failed: " + JSON.stringify(res));
  }
  async function destroyJanusRoom(
    roomId: number,
    permanent = false
  ): Promise<void> {
    const plugin = await ensureVideoRoomPlugin();
    const req: any = {
      request: "destroy",
      room: roomId,
      permanent,
    };
    const res = await plugin.sendRequest(req);
    if (res?.videoroom === "destroyed") return;
  }
  function attachRoomMessageListener(room: any) {
    room.pluginHandle?.eventTarget?.addEventListener(
      "message",
      (ev: CustomEvent) => {
        const msg = ev.detail?.message;
        if (!msg || msg.videoroom !== "event") return;
        if (Array.isArray(msg.streams)) {
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
            const p = participants.get(pid);
            if (p) {
              const pubShim = { id: feed, streams: items };
              scheduleEnsureCycle(pid, pubShim);
            }
          });
        }
      }
    );
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

    // --- очищаем микшер ---
    if (mixerCtx) {
      mixerCtx.close().catch(() => {});
      mixerCtx = null;
      mixerDestination = null;
      micStream = null;
      micTrack = null;
      mixedAudioTrack = null;
    }
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
  function attachAnalyserForStream(
    publisherId: string,
    stream: MediaStream,
    isLocal = false
  ) {
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
  async function ensureMicStream() {
    if (!import.meta.client) return null;
    // если уже есть живой трек — возвращаем его
    if (micStream && micTrack && micTrack.readyState === "live") {
      return micStream;
    }

    // Запрашиваем микрофон
    const constraints: MediaStreamConstraints = {
      audio: selectedMicId.value
        ? { deviceId: { exact: selectedMicId.value } }
        : true,
      video: false,
    };

    micStream = await navigator.mediaDevices.getUserMedia(constraints);
    micTrack = micStream.getAudioTracks()[0] || null;
    return micStream;
  }

  async function ensureMixedAudioTrack(): Promise<MediaStreamTrack | null> {
    if (!import.meta.client) return null;
    if (!settings.microphoneEnabled) {
      // Микшер сейчас включаем только когда микрофон включен.
      // (Если нужно — можно позже сделать отдельный режим "только soundboard")
      return null;
    }

    // Создаём / переиспользуем AudioContext + destination
    if (!mixerCtx || mixerCtx.state === "closed") {
      mixerCtx = new AudioContext();
      mixerDestination = mixerCtx.createMediaStreamDestination();
    }
    if (!mixerDestination) {
      mixerDestination = mixerCtx.createMediaStreamDestination();
    }

    // Обновляем микрофонный источник
    const stream = await ensureMicStream();
    if (!stream) return null;

    if (!micTrack || micTrack.readyState !== "live") {
      micTrack = stream.getAudioTracks()[0] || null;
    }
    if (!micTrack) return null;

    // Создаём источник микрофона и подключаем к destination
    const micSource = mixerCtx.createMediaStreamSource(
      new MediaStream([micTrack])
    );
    micSource.connect(mixerDestination);

    // При желании можно подключить и к mixerCtx.destination для локального мониторинга:
    // micSource.connect(mixerCtx.destination);

    // Получаем единый аудиотрек из destination.stream
    mixedAudioTrack = mixerDestination.stream.getAudioTracks()[0] || null;

    return mixedAudioTrack;
  }
  async function joinVoiceChannel(channelId: string, displayName?: string) {
    console.log(
      "[joinVoiceChannel] call, isJoining =",
      isJoining.value,
      "channelId =",
      channelId
    );
    if (!import.meta.client) return;
    if (isJoining.value) {
      console.log("[joinVoiceChannel] skipped: join already in progress");
      return;
    }
    const myAttemptId = ++joinAttemptId.value;
    isJoining.value = true;
    try {
      if (callEnabled.value && activeVoiceChannelId.value === channelId) {
        console.log(
          "[joinVoiceChannel] already in this channel, skipping join"
        );
        return;
      }
      await ensureJanus();
      if (myAttemptId !== joinAttemptId.value) {
        console.log("[joinVoiceChannel] aborted after ensureJanus");
        return;
      }
      const ch = channelsStore.getById(channelId);
      if (!ch) {
        console.warn("[joinVoiceChannel] channel not found", channelId);
        return;
      }
      if (ch.type !== "voice") {
        console.warn("joinVoiceChannel: not a voice channel");
        return;
      }
      let roomId = ch.janusRoomId ?? null;
      if (!roomId) {
        roomId = STATIC_ROOM_ID;
        channelsStore.updateChannel(ch.id, { janusRoomId: roomId });
      }
      if (callEnabled.value) {
        console.log("[joinVoiceChannel] leaving previous call");
        await leaveCall(false);
        if (myAttemptId !== joinAttemptId.value) {
          console.log("[joinVoiceChannel] aborted after leaveCall");
          return;
        }
      }
      clearAnalysers();
      clearAllSubTimers();
      localStream.value?.getTracks().forEach((t) => t.stop());
      localStream.value = new MediaStream();
      localVideoKind.value = settings.videoEnabled ? "camera" : "none";
      const profileName =
        displayName?.trim() || profiles.name?.trim() || "Без имени";
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
      if (myAttemptId !== joinAttemptId.value) {
        console.log("[joinVoiceChannel] aborted before joinRoom");
        return;
      }
      console.log("[joinVoiceChannel] joining Janus room", roomId);
      janusRoom.value = await janusSession.value.joinRoom(roomId);
      if (myAttemptId !== joinAttemptId.value) {
        console.log(
          "[joinVoiceChannel] aborted right after joinRoom → leaving room"
        );
        try {
          await janusRoom.value.leave();
        } catch {}
        janusRoom.value = null;
        return;
      }
      attachRoomMessageListener(janusRoom.value);
      setupVisibilityAwakening();
      janusRoom.value.onPublisherAdded((pubs: any[]) =>
        pubs.forEach(subscribe)
      );
      janusRoom.value.onPublisherRemoved(unsubscribe);
      if (typeof janusRoom.value.onPublisherList === "function") {
        janusRoom.value.onPublisherList((pubs: any[]) =>
          pubs.forEach(subscribe)
        );
      }
      await publishWithCurrentSettings();
      if (myAttemptId !== joinAttemptId.value) {
        console.log("[joinVoiceChannel] aborted after publish → leaving room");
        try {
          await leaveCall(false);
        } catch {}
        return;
      }
      callEnabled.value = true;
      activeVoiceChannelId.value = channelId;
      settings.toggleCall(true);
      console.log("[joinVoiceChannel] finished successfully");
    } catch (e) {
      console.error("[joinVoiceChannel] error", e);
    } finally {
      if (myAttemptId === joinAttemptId.value) {
        isJoining.value = false;
        console.log(
          "[joinVoiceChannel] finally, isJoining =",
          isJoining.value,
          "attemptId =",
          myAttemptId
        );
      } else {
        console.log(
          "[joinVoiceChannel] finally, but attempt already superseded",
          "myAttemptId =",
          myAttemptId,
          "current =",
          joinAttemptId.value
        );
      }
    }
  }
  async function ensureMissingMids(pid: string, pub: any) {
    const sub = subscriptions.get(pid);
    if (!sub) return;
    const known = subMidsMap.get(pid) || new Set<any>();
    const streamList: any[] = Array.isArray(pub.streams) ? pub.streams : [];
    const videoMids = streamList
      .filter(
        (s) => s.mid != null && (s.type === "video" || s.mtype === "video")
      )
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
    if (hasRemoteVideo(pid)) {
      clearSubTimers(pid);
      subState.set(pid, { retries: 0 });
      return;
    }
    clearSubTimers(pid);
    queueMicrotask(async () => {
      await ensureMissingMids(pid, pub);
      if (!hasRemoteVideo(pid)) {
        const tries = (subState.get(pid)?.retries || 0) + 1;
        subState.set(pid, { retries: tries });
        try {
          await forceResubscribe(pid, pub);
        } catch (e) {
          console.warn("ensure fallback resubscribe failed", e);
        }
      }
    });
  }
  let visibilityListenerAttached = false;
  function setupVisibilityAwakening() {
    if (visibilityListenerAttached || !import.meta.client) return;
    visibilityListenerAttached = true;
    document.addEventListener("visibilitychange", async () => {
      if (!document.hidden) {
        try {
          await resumeAnalysers();
        } catch {}
        for (const pid of participants.keys()) {
          if (pid === "local") continue;
          if (!hasRemoteVideo(pid)) {
            try {
              await forceResubscribe(pid, { id: Number(pid) });
            } catch {}
          }
        }
      }
    });
  }
  function attachSubHandlers(
    pid: string,
    sub: any,
    p: Participant,
    stream: MediaStream
  ) {
    sub.onTrackAdded((track: MediaStreamTrack, mid: any) => {
      clearSubTimers(pid);
      if (track.kind === "video") {
        stream.addTrack(track);
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
  async function subscribe(pub: any) {
    if (!import.meta.client || !janusRoom.value) return;
    const pid = String(pub.id);
    const incomingMids = new Set<any>(
      (pub.streams || []).map((s: any) => s.mid).filter((m: any) => m != null)
    );
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
    try {
      currentScreenTrack.value?.stop();
    } catch {}
    currentScreenTrack.value = null;
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
    callEnabled.value = false;
    isJoining.value = false;
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
  async function requestScreenTrack() {
    const sc = shareConstraints.value || {};
    const disp = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: sc.frameRate ?? 30,
        width: sc.width,
        height: sc.height,
        cursor: "always",
      },
      audio: false,
    });
    const track = disp.getVideoTracks()[0];
    if (!track) throw new Error("No video track from getDisplayMedia");
    track.addEventListener("ended", () => {
      toggleScreenshare(false);
    });
    return track;
  }
  async function toggleScreenshare(
    on: boolean,
    opts?: { width?: number; height?: number; frameRate?: number }
  ) {
    if (!callEnabled.value) return;
    if (on) {
      shareConstraints.value = opts || null;
      try {
        const track = await requestScreenTrack();
        currentScreenTrack.value = track;
        localVideoKind.value = "screenshare";
      } catch (e: any) {
        console.warn("Screenshare denied/cancelled", e?.name || e);
        shareConstraints.value = null;
        localVideoKind.value = settings.videoEnabled ? "camera" : "none";
        return;
      }
    } else {
      try {
        currentScreenTrack.value?.stop();
      } catch {}
      currentScreenTrack.value = null;
      shareConstraints.value = null;
      localVideoKind.value = settings.videoEnabled ? "camera" : "none";
    }
    await publishWithCurrentSettings();
    const me = participants.get("local");
    if (me) {
      me.hasScreen = on;
      me.hasVideo = settings.videoEnabled && localVideoKind.value === "camera";
    }
  }
  function setMicDevice(id: string) {
    selectedMicId.value = id;
    persistDevices();
    if (callEnabled.value) {
      publishWithCurrentSettings();
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
  async function buildTracksForCurrent(): Promise<any[]> {
    const tracks: any[] = [];
    const hasAudioSender = hasPublishedSender("audio");
    const hasVideoSender = hasPublishedSender("video");

    // --- АУДИО: единый микшированный трек микрофон+soundboard ---
    if (settings.microphoneEnabled) {
      const audioTrack = await ensureMixedAudioTrack();

      if (audioTrack) {
        const t: any = {
          type: "audio",
          capture: audioTrack as MediaStreamTrack,
        };
        if (hasAudioSender) t.replace = true;
        tracks.push(t);
      } else if (hasAudioSender) {
        // если не смогли получить трек — удаляем аудиосендер
        tracks.push({ type: "audio", remove: true });
      }
    } else if (hasAudioSender) {
      tracks.push({ type: "audio", remove: true });
    }

    // --- ВИДЕО как было ---
    if (localVideoKind.value == "screenshare") {
      if (currentScreenTrack.value) {
        const t: any = {
          type: "video",
          capture: currentScreenTrack.value as MediaStreamTrack,
        };
        if (hasVideoSender) t.replace = true;
        tracks.push(t);
      } else if (hasVideoSender) {
        tracks.push({ type: "video", remove: true });
      }
    } else if (localVideoKind.value == "camera" && settings.videoEnabled) {
      const t: any = {
        type: "video",
        capture: selectedCamId.value
          ? { deviceId: { exact: selectedCamId.value } }
          : true,
      };
      if (hasVideoSender) t.replace = true;
      tracks.push(t);
    } else if (hasVideoSender) {
      tracks.push({ type: "video", remove: true });
    }

    return tracks;
  }
  async function publishWithCurrentSettings() {
    const displayPayload = encodeDisplay(
      profiles.name?.trim() || "Без имени",
      profiles.avatar || ""
    );
    const tracks = await buildTracksForCurrent();
    const wantAnyAdd = tracks.some((t) => !t.remove);
    if (!publisher.value) {
      if (!wantAnyAdd) return;
      publisher.value = await janusRoom.value.publish({
        publishOptions: { display: displayPayload },
        mediaOptions: { tracks },
      });
      publisher.value.onTrackAdded((track: MediaStreamTrack) => {
        if (!localStream.value) localStream.value = new MediaStream();
        if (track.kind === "video") {
          localStream.value.addTrack(track);
          localStream.value.getVideoTracks().forEach((t) => {
            if (t !== track) localStream.value!.removeTrack(t);
          });
          if (localVideoKind.value === "screenshare") {
            currentScreenTrack.value = track;
          }
        } else if (track.kind === "audio") {
          localStream.value.addTrack(track);
        }
        const me = participants.get("local");
        if (me) {
          if (track.kind === "video") {
            if (localVideoKind.value === "screenshare") {
              me.hasScreen = true;
              me.hasVideo = false;
            } else if (localVideoKind.value === "camera") {
              me.hasVideo = true;
              me.hasScreen = false;
            } else {
              me.hasVideo = false;
              me.hasScreen = false;
            }
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
        if (track === currentScreenTrack.value) {
          try {
            track.stop();
          } catch {}
          currentScreenTrack.value = null;
        }
        const me = participants.get("local");
        if (me) {
          if (track.kind === "video") {
            const hasAnyVideo = localStream.value.getVideoTracks().length > 0;
            if (!hasAnyVideo) {
              me.hasVideo = false;
              me.hasScreen = false;
            } else {
              const hasScreen = !!currentScreenTrack.value;
              me.hasScreen = hasScreen;
              me.hasVideo = !hasScreen;
            }
          }
          if (track.kind === "audio") {
            me.hasAudio = localStream.value.getAudioTracks().length > 0;
          }
        }
      });
      return;
    }
    await publisher.value.restart({ tracks }, { display: displayPayload });
  }
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
  watch(
    () => settings.audioEnabled,
    (enabled) => {
      participants.forEach((p, id) => {
        if (id === "local") return;
        p.stream.getAudioTracks().forEach((t) => {
          t.enabled = enabled;
        });
      });
    },
    { immediate: true }
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
    isJoining,
    joinVoiceChannel,
    leaveCall,
    cancelJoin,
    toggleMic,
    toggleCamera,
    toggleScreenshare,
    setMicDevice,
    setCamDevice,
    setOutputDevice,
    setFocusParticipant,
    resumeAnalysers,
    createJanusRoom,
    destroyJanusRoom,
    playSoundboardClip,
  };
});
