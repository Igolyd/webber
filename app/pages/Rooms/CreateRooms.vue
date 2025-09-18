<!-- CreateRoom.vue -->
<template>
  <div class="container mt-5">
    <h2 class="mb-4">Создание канала</h2>
    <form @submit.prevent="createRoom">
      <div class="form-group mb-3">
        <label for="roomName">Название канала:</label>
        <input type="text" class="form-control" id="roomName" v-model="roomName" required />
      </div>
      <div class="form-group mb-3">
        <label for="roomSecret">Пароль канала (необязательно):</label>
        <input type="password" class="form-control" id="roomSecret" v-model="roomSecret" />
      </div>
      <div class="form-group mb-3">
        <label for="roomName">тип канала:</label>
        <input type="text" class="form-control" id="roomName" v-model="roomName" required />
      </div>
      <div class="form-group mb-3">
        <label for="roomName">временный канал?</label>
        <input type="text" class="form-control" id="roomName" v-model="roomName" required />
      </div>
      <button type="submit" class="btn btn-primary">Создать канал</button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
// Временное решение: назначаем any
// eslint-disable-next-line
//@ts-ignore
import Room from 'janus-room'

export default defineComponent({
  name: 'CreateRoom',
  data() {
    return {
      roomName: '' as string,
      roomSecret: '' as string,
    }
  },
  methods: {
    async createRoom() {
      if (this.roomName.trim() === '') {
        alert('Введите название комнаты.')
        return
      }
      try {
        var options = {
          server: 'ws://147.45.158.188:8188/janus', // required
        }

        let room = new Room(options)

        room.init().then(function () {
          setTimeout(function () {
            room.createRoom({ room: Math.floor(Math.random() * 1000000) })
            console.log('success')
          })
        })
      } catch (error) {
        alert('Ошибка при создании комнаты.')
        console.error('Ошибка:', error)
      }
    },
  },
})
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}
</style>
