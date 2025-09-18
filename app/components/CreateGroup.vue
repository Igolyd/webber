<!-- components/CreateGroup.vue -->
<template>
  <teleport to="body">
    <div v-if="visible" class="popup-container">
      <div class="popup-content">
        <slot></slot>
        <h1>Создать группу</h1>
        <transition name="fade">
          <div v-show="step === 1">
            <p>Выбор шаблона:</p>
            <small>Стандартные шаблоны:</small>
            <div class="StandartTemplate">
              <button>Пустой</button>
              <button>Игровой</button>
            </div>
            <small>Ваши шаблоны:</small>
            <div class="StandartTemplate">
              <small>нету(</small>
            </div>
            <small>Шаблоны из WebberMarket:</small>
            <div class="StandartTemplate">
              <button>Перейти в магазинц</button>
              <button>Хикан</button>
              <button>Макуто</button>
            </div>
            <button @click="close">Закрыть</button>
            <button @click="nextStep">Далее</button>
          </div>
        </transition>
        <transition name="fade">
          <div v-show="step === 2">
            <p>Введите имя группы:</p>
            <input type="text" v-model="groupName" placeholder="Имя группы..." />
            <br /><br />
            <p>Загрузите фото группы:</p>
            <input type="file" accept="image/*" @change="uploadPhoto" />
            <br /><br />
            <button @click="prevStep">Назад</button>
            <button @click="finishCreation">Завершить</button>
          </div>
        </transition>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'

export default defineComponent({
  props: ['modelValue'], // Передаем статус видимости окна извне
  emits: ['update:modelValue'], // Сообщаем об изменениях статуса
  setup(props, { emit }) {
    const step = ref(1) // Текущий шаг (1 — выбор шаблона, 2 — ввод имени и фото)
    const groupName = ref('')
    const photoFile = ref(null)

    const visible = computed({
      get() {
        return props.modelValue
      },
      set(value) {
        emit('update:modelValue', value)
      },
    })

    const uploadPhoto = (event: Event) => {
      const target = event.target as HTMLInputElement
      photoFile.value = target.files?.[0]
    }

    const nextStep = () => {
      step.value++
    }

    const prevStep = () => {
      step.value--
    }

    const finishCreation = () => {
      alert(`Группа "${groupName.value}" создана! Фото: ${photoFile.value?.name ?? '(без фото)'}`)
      visible.value = false
    }

    const close = () => {
      visible.value = false
    }

    return {
      visible,
      step,
      groupName,
      photoFile,
      nextStep,
      prevStep,
      finishCreation,
      close,
      uploadPhoto,
    }
  },
})
</script>

<style scoped>
.popup-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  text-align: center;
  width: 300px;
}

.StandartTemplate {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
