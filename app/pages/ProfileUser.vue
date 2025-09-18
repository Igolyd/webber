<!-- ProfileUser.vue -->
<template>
  <div v-if="authenticated" class="container mt-5">
    <div class="card">
      <div class="card-body">
        <div class="card-panel-instrumental">
          <div class="panel-item-instrumental">
            <button class="nav-btn" @click="switchCategory">
              <img :src="categoryImage" :alt="activeCategory.name" class="img-thumbnail" />
            </button>
            <h6>Друзья</h6>
          </div>
          <div class="panel-item-instrumental">
            <button class="nav-btn" @click="createGroup">
              <img
                :src="currentIcon"
                :alt="currentAlt"
                :title="currentTitle"
                class="img-thumbnail"
                @click="categoryAction"
              />
            </button>
            <h6>Создать группу</h6>
          </div>
          <div class="panel-item-instrumental">
            <!-- Кнопка магазина -->
            <button class="nav-btn" @click="visitStore">
              <img src="../../../assets/ui/Cart.png" alt="Visit Store" class="img-thumbnail" />
            </button>
            <h6>Магазин</h6>
          </div>
          <div class="horizontal-line-tab-nav"></div>
        </div>

        <h5 class="card-title">{{ activeCategory.name }}:</h5>
        <ul class="list-group">
          <li
            v-for="item in filteredItems"
            :key="item.id"
            class="list-group-item d-flex justify-content-between align-items-center cursor-pointer"
            @click="handleClick(item)"
          >
            <img
              src="../../../assets/profile/group_example.jpg"
              alt=""
              class="mr-2 img-thumbnail"
            />
            <strong>{{ item.name }}</strong>
          </li>
        </ul>
      </div>
      <MyProfileTabNavigation
        pictureUrl="require('@/assets/profile-picture.jpg')"
        name="John Doe"
        description="Software Engineer"
      />
    </div>
    <ActivityUserTab />

    <InteractionPanel :avatarSrc="'../../../assets/profile/frd_exp.jpg'" :title="'Jonny'">
      <!-- Компонуемые кнопки -->
      <button class="interaction-btn">
        <img src="../../../assets/ui/search.png" alt="Search" />
      </button>
      <button class="interaction-btn">
        <img src="../../../assets/ui/Interaction.png" alt="Frendly_Group" />
      </button>
      <!-- <button class="interaction-btn">
        <img src="../../../assets/ui/Interaction.png" alt="Call_Audio" />
      </button>
      <button class="interaction-btn">
        <img src="../../../assets/ui/Interaction.png" alt="Call_Video" />
      </button>
      <button class="interaction-btn">
        <img src="../../../assets/ui/Interaction.png" alt="AddToFriend" />
      </button> -->
    </InteractionPanel>
    <div class="list-friends">
      <ul class="list-group">
        <li
          v-for="item in filteredItems"
          :key="item.id"
          class="OnMainTheme d-flex justify-content-between align-items-center cursor-pointer"
          @click="handleClick(item)"
        >
          <div class="OnMainTheme">
            <img
              src="../../../assets/profile/group_example.jpg"
              alt=""
              class="mr-2 img-thumbnail"
            />
            <strong>{{ item.name }}</strong>
          </div>
          <div class="horizontal-line"></div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import CreateGroup from '@/components/CreateGroup.vue'
import MyProfileTabNavigation from '@/model/MyProfileTabNavigation.vue'
import ActivityUserTab from '@/model/ActivityUserTab.vue'
import InteractionPanel from '@/model/InteractionPanel.vue'
import AddGroup from '../../../assets/ui/add_raindbow.png'
import Friend from '../../../assets/ui/PrivateMessage.png'
import Group from '../../../assets/ui/group.png'
import EmojiPicker from 'vue3-emoji-picker'

interface CategoryItem {
  id: number
  name: string
}

interface Item {
  id: number
  name: string
}

export default defineComponent({
  name: 'ProfileUser',
  components: {
    CreateGroup,
    MyProfileTabNavigation,
    ActivityUserTab,
    InteractionPanel,
    EmojiPicker,
  },
  data() {
    return {
      authenticated: true, // Изначально пользователь не авторизован
      userName: '' as string,
      email: '' as string,
      password: '' as string,
      regEmail: '' as string,
      regPassword: '' as string,
      groups: [
        { id: 1, name: 'Casinlio' },
        { id: 2, name: 'Maria' },
        { id: 3, name: 'Wooonder' },
      ],
      friends: [
        { id: 1, name: 'Friend 1' },
        { id: 2, name: 'Friend 2' },
        { id: 3, name: 'Friend 3' },
      ],
      categories: [
        { id: 1, name: 'Группы' },
        { id: 2, name: 'Личные сообщения' },
      ],
      activeCategory: { id: 1, name: 'Группы' } as CategoryItem, // Активная категория по умолчанию
      //Создание группы
      openCreateGroup: false,
    }
  },
  computed: {
    filteredItems(): Item[] {
      switch (this.activeCategory.id) {
        case 1:
          return this.groups
        case 2:
          return this.friends
        default:
          return []
      }
    },
    currentIcon() {
      switch (this.activeCategory.id) {
        case 1: // Группы
          return AddGroup
        case 2: // Личные сообщения
          return AddGroup
        default:
          return '../../../assets/ui/default.png'
      }
    },
    currentAlt() {
      switch (this.activeCategory.id) {
        case 1: // Группы
          return 'Создать группу'
        case 2: // Личные сообщения
          return 'Добавить друга'
        default:
          return 'Действия'
      }
    },
    currentTitle() {
      switch (this.activeCategory.id) {
        case 1: // Группы
          return 'Создать группу'
        case 2: // Личные сообщения
          return 'Найти друга'
        default:
          return 'Действия'
      }
    },
    categoryImage() {
      switch (this.activeCategory.id) {
        case 1: // Группы
          return Friend
        case 2: // Личные сообщения
          return Group
        default:
          return '../../../assets/ui/default.png'
      }
    },
  },
  methods: {
    login() {
      // Эмуляция авторизации
      this.authenticated = true
      this.userName = this.email.split('@')[0]
      alert(`Login successful! Welcome, ${this.userName}.`)
    },
    register() {
      // Эмуляция регистрации
      this.authenticated = true
      this.userName = this.regEmail.split('@')[0]
      alert(`Registration successful! Welcome, ${this.userName}.`)
    },
    joinRoom(roomId: number, roomName: string) {
      // Переход на страницу видеоконференции с передачей идентификатора комнаты
      this.$router.push(`/videoconference/${roomId}`)
    },
    joinChannel(groupId: number, roomName: string) {
      // Переход на страницу видеоконференции с передачей идентификатора комнаты
      this.$router.push(`/groups/${groupId}`)
    },
    createGroup() {
      // Переход на страницу видеоконференции с передачей идентификатора комнаты
      this.$router.push(`/CreateGroups`)
    },
    switchCategory() {
      // Переключение активных категорий
      const index = this.categories.findIndex((cat) => cat.id === this.activeCategory.id)
      const nextIndex = (index + 1) % this.categories.length
      this.activeCategory = this.categories[nextIndex]
    },
    categoryAction() {
      switch (this.activeCategory.id) {
        case 1: // Группы
          this.openCreateGroup = true
          break
        case 2: // Личные сообщения
          this.findFriend()
          break
      }
    },
    findFriend() {},
    watchStream() {},
    visitStore() {},
    handleClick(item: Item) {
      switch (this.activeCategory.id) {
        case 1: // Группы
          this.$router.push(`/groups/${item.id}`)
          break
        case 2: // Личные сообщения
          this.$router.push(`/FriendView?id=${item.id}&name=${item.name}`)
          break
      }
    },
    createConference() {
      alert('Начинаю создание конференции...')
      // Здесь можешь организовать создание новой конференции
    },
    openSettingProfile() {
      // Handle the openSettingProfile action here
    },
  },
})
</script>

<style scoped>
.card {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 30px;
  height: 100%; /* Full-height: remove this if you want "auto" height */
  width: 22%; /* Set the width of the sidebar */
  position: fixed; /* Fixed Sidebar (stay in place on scroll) */
  z-index: 2; /* Stay on top */
  top: 0; /* Stay at the top */
  left: 10;
  background-color: #111; /* Black */
  overflow-x: hidden; /* Disable horizontal scroll */
  border: 1px solid #ddd;
}
.list-group {
  list-style-type: none;
  padding-left: 0; /* Стандартный отступ Bootstrap */
  margin-left: 0; /* Лишняя маржа слева тоже возможна */
  text-align: left; /* Точно текст расположен слева */
  width: 100%;
}
.img-thumbnail {
  width: 40px; /* Размер изображения */
  height: 40px;
  object-fit: cover;
  border-radius: 50%; /* Круглая форма */
  margin-right: 5px; /* Отступ справа от картинки */
}
.list-group-item {
  display: flex;
  align-items: center;
  justify-content: start;
  padding: 10px;
  width: 100%;
}

.list-group-item span {
  display: flex;
  align-items: flex-start;
}
.list-group-item:hover {
  background-color: #3f3f3f;
  border-radius: 2%;
}

.action-icon {
  cursor: pointer; /* Курсор руки при наведении */
  padding: 1px; /* Небольшие отступы */
  width: 50px; /* Ширина иконки */
  height: 50px; /* Высота иконки */
  border-radius: 50%; /* Круглая форма */
  object-fit: contain; /* Пропорциональное масштабирование */
  transition: transform 0.2s; /* Анимация */
}

.action-icon:hover {
  transform: scale(1.1); /* Увеличение при наведении */
  opacity: 0.9; /* Легкое затенение */
}

.action-icon:focus {
  outline: none; /* Убираем стандартную рамку при фокусировке */
}
.list-unstyled {
  list-style-type: none;
  padding-left: 2px; /* Стандартный отступ Bootstrap */
  margin-left: 0; /* Лишняя маржа слева тоже возможна */
  text-align: left; /* Точно текст расположен слева */
}
.my-profile-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  margin-left: 5px;
  margin-bottom: 30px;
  text-align: center;
}

.interaction-btn {
  background-color: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.interaction-btn img {
  width: 20px;
  height: 20px;
}
.list-friends {
  position: absolute;
  width: 61%;
  justify-self: center;
  top: 70px; /* adjust the top position to be under the header and interaction div */
  height: 100%;
  left: 5%;
  bottom: 0;
  right: 0;
  background-color: #292929;
  z-index: 0;
}
.OnMainTheme {
  display: flex;
  align-items: center;
  justify-content: start;
  gap: 5px;
  padding: 10px;
  position: relative;
}
/* Горизонтальная линия поверх пункта списка */
.horizontal-line {
  position: absolute;
  bottom: 0; /* Линия внизу */
  left: 0; /* Центр линии относительно ширины */
  right: 0;
  justify-self: center;
  width: 90%; /* Ширину можно регулировать */
  height: 1px; /* Толщина линии */
  background-color: #aaa; /* Цвет линии */
}
.horizontal-line-tab-nav {
  position: absolute;
  left: 0; /* Центр линии относительно ширины */
  right: 0;
  bottom: 0;
  justify-self: center;
  margin-left: 0;
  margin-right: 5%;
  width: 95%; /* Ширину можно регулировать */
  height: 1px; /* Толщина линии */
  background-color: #aaa; /* Цвет линии */
}
.OnMainTheme:hover {
  background-color: #3f3f3f;
  border-radius: 2%;
}
.nav-btn {
  background-color: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}
.card-body {
  margin-top: 5%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
}
.card-title {
  align-self: center;
}
.card-panel-instrumental {
  margin-left: 2%;
  width: 100%;
  position: relative;
}
.panel-item-instrumental {
  display: flex;
  flex-direction: row;
}
.panel-item-instrumental:hover {
  background-color: #3f3f3f;
  border-radius: 2%;
}
</style>
