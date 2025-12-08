<!-- VideoRoom.vue -->
<template>
  <div class="video-room">
    <div id="tracks">
      <div id="displays"></div>
    </div>
    <div class="panel-controls">
      <button @click="connect">Connect</button>
      <button @click="disconnect">Disconnect</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, nextTick, watch } from 'vue'
import { createVideoRoomClient } from 'janus-simple-videoroom-client'
import { useSettingsStore } from '../stores/settings'

export default defineComponent({
  props: ['devices'], // Прием выбранных устройств из родительского компонента
  name: 'VideoRoom',
  setup(props) {
    const server = ref('wss://janus.conf.meetecho.com/ws')
    const roomId = ref(1234)
    const displayName = ref('John Doe')
    let session = ref(null)
    let room = ref(null)
    let publisher = ref(null)
    const subscribers = ref({})
    let myVideo: any
    let stream: any

    // Получаем доступ к хранилищу Pinia
    const settingsStore = useSettingsStore()

    // Читаем устройства из localStorage
    const savedCameraDevice = localStorage.getItem('cameraDevice')
    const savedMicrophoneDevice = localStorage.getItem('microphoneDevice')

    // Ограничения на устройства
    const constraints = {
      audio: savedMicrophoneDevice ? { deviceId: { exact: savedMicrophoneDevice } } : true,
      video: savedCameraDevice ? { deviceId: { exact: savedCameraDevice } } : true,
    }

    // Функция для соединения
    const connect = async () => {
      console.log('Connecting...')
      const client = await createVideoRoomClient({ debug: true })
      session.value = await client.createSession(server.value)
      room.value = await session.value.joinRoom(roomId.value)

      // Публикуем только аудиотрек
      const mediaOptions = {
        tracks: [
          { type: 'audio', capture: true },
          { type: 'video', capture: false }, // Включаем видеотрек
        ],
      }

      publisher.value = await room.value.publish({
        publishOptions: {
          display: displayName.value,
        },
        mediaOptions,
      })

      // Создаем дисплей для нашей собственной трансляции
      myVideo = makeDisplay(displayName.value, false)

      // Управляем потоком через библиотеку
      publisher.value.onTrackAdded((track) => {
        console.log('Новая дорожка:', track)
        myVideo.stream.addTrack(track)
        if (myVideo.stream.getVideoTracks().length > 0) {
          myVideo.stream.getVideoTracks()[0].enabled = false
          console.log('Камера выключена.')
        }
      })

      publisher.value.onTrackRemoved((track) => {
        console.log('Удалена дорожка:', track)
        myVideo.stream.removeTrack(track)
      })

      room.value.onPublisherAdded((publishers) =>
        publishers.forEach((subscriber) => subscribe(subscriber)),
      )

      room.value.onPublisherRemoved(unsubscribe)
    }

    // Создание дисплея для участников
    const makeDisplay = (displayName: string, showCamera: boolean) => {
      console.log('Making display...', showCamera)
      const container = document.createElement('div')
      container.classList.add('display')
      const nameDiv = document.createElement('div')
      nameDiv.classList.add('name')
      nameDiv.textContent = displayName
      console.log(stream + ' myVideo.stream')
      if (stream == undefined) {
        stream = new MediaStream() // Собственный поток для дальнейших манипуляций
      }

      if (showCamera) {
        const video = document.createElement('video')
        video.autoplay = true
        video.srcObject = stream

        container.append(video)
      } else {
        // Если камера отключена, выводим фотографию
        const img = document.createElement('img')
        img.src = '../../assets/profile/profile_exp.jpg' // Фото профиля
        img.alt = 'Photo Profile'
        container.append(img)
        // Привязываем поток к псевдоэлементу для поддержания звучания аудио
        const dummyAudio = document.createElement('audio')
        dummyAudio.srcObject = stream
        dummyAudio.autoplay = true
        container.append(dummyAudio)
      }
      container.prepend(nameDiv) // Всегда добавляем имя первым элементом
      document.querySelector('#displays')!.append(container)

      return {
        stream: stream, // Теперь stream объявлен заранее и доступен
        remove: () => container.remove(),
      }
    }

    // Подписка на нового публикатора
    const subscribe = async (publisher: any) => {
      console.log('Subscribing...')
      const sub = (subscribers.value[publisher.id] = await room.value.subscribe([
        { feed: publisher.id },
      ]))
      sub.video = makeDisplay(publisher.display, true) // Пока ставим true, чтобы всегда получать чужие видео
      sub.onTrackAdded((track) => sub.video.stream.addTrack(track)) // Добавляем дорожку в поток
      sub.onTrackRemoved((track) => sub.video.stream.removeTrack(track)) // Удаляем дорожку из потока
    }

    // Отмена подписки
    const unsubscribe = async (publisherId: string) => {
      console.log('Unsubscribing...')
      await subscribers.value[publisherId].unsubscribe()
      subscribers.value[publisherId].video.remove()
    }
    // Метод для включения видеотрека
    const addVideoTrack = async () => {
      // console.log(stream + ' myVideo.stream')

      myVideo = makeDisplay(displayName.value, true)
      const videoTrack = await navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => stream.getVideoTracks()[0])
      stream.addTrack(videoTrack) // Добавляем видеотрек в поток
      publisher.value.onTrackAdded(videoTrack)
      // Добавляем видеотрек в поток
      // const tracks = myVideo.stream.getTracks()
      // console.log(
      //   'Список треков:',
      //   tracks.map((track) => `${track.kind}: ${track.label}`),
      // )
      // Сообщаем, что камера включена
      console.log('Камера включена.')
    }

    // Метод для отключения видеотрека
    const removeVideoTrack = async () => {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.stop() // Останавливаем видеотрек
        publisher.value.onTrackRemoved(videoTrack)
        stream.removeTrack(videoTrack)
      }
      myVideo = makeDisplay(displayName.value, false)
      // Сообщаем, что камера отключена
      console.log('Камера отключена.')
    }
    // Включаем микрофон
    const enableMicrophone = async () => {
      const audioTrack = await navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => stream.getAudioTracks()[0])
      stream.addTrack(audioTrack)
      publisher.value.onTrackAdded(audioTrack)
    }

    // Выключаем микрофон
    const disableMicrophone = () => {
      const audioTrack = publisher.value.stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.stop()
        stream.removeTrack(audioTrack)
        publisher.value.onTrackRemoved(audioTrack)
      }
    }

    // Включаем аудиопоток
    const enableAudio = async () => {
      console.log('Включаем звук')
    }

    // Выключаем аудиопоток
    const disableAudio = async () => {
      console.log('Выключаем звук')
    }
    // Наблюдатель за состоянием камеры
    watch(
      () => settingsStore.videoEnabled,
      (newValue) => {
        if (newValue) {
          addVideoTrack()
        } else {
          removeVideoTrack()
        }
      },
    )

    // Наблюдатель за состоянием микрофона
    watch(
      () => settingsStore.microphoneEnabled,
      (newValue) => {
        if (newValue) {
          enableMicrophone()
        } else {
          disableMicrophone()
        }
      },
    )

    // Наблюдатель за состоянием аудиопотока
    watch(
      () => settingsStore.audioEnabled,
      (newValue) => {
        if (newValue) {
          enableAudio()
        } else {
          disableAudio()
        }
      },
    )

    return {
      connect,
      settingsStore,
    }
  },
})
</script>

<style scoped>
.display {
  display: inline-block;
  margin: 0 2em 2em 0;
}
.display .name {
  position: absolute;
  background-color: black;
  color: white;
}
.panel-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  margin-left: 1%;
  margin-bottom: 1%;
  text-align: center;
}
</style>
