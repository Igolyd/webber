<template>
  <div class="auth-modal">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-body">
          <form @submit.prevent="submitForm">
            <div v-if="isRegistering">
              <h3>Создать учетную запись!</h3>
              <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" class="form-control" id="email" v-model="email" required />
              </div>
              <div class="form-group">
                <label for="name">Имя:</label>
                <input type="name" class="form-control" id="name" v-model="name" required />
              </div>
              <div class="form-group">
                <label for="password">Пароль:</label>
                <input
                  type="password"
                  class="form-control"
                  id="password"
                  v-model="password"
                  required
                />
              </div>
            </div>
            <div v-else>
              <h3>С возращением!</h3>
              <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" class="form-control" id="email" v-model="email" required />
              </div>
              <div class="form-group">
                <label for="password">Пароль:</label>
                <input
                  type="password"
                  class="form-control"
                  id="password"
                  v-model="password"
                  required
                />
              </div>
            </div>
            <button type="submit" class="btn btn-primary">
              {{ isRegistering ? 'Зарегистрироваться' : 'Войти' }}
            </button>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="toggleForm">
            {{ isRegistering ? 'Уже зарегистрированы?' : 'Еще не зарегистрированы?' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isRegistering: true,
      email: '',
      password: '',
      modalTitle: 'Авторизация',
    }
  },
  methods: {
    submitForm() {
      if (this.isRegistering) {
        // Handle registration logic here
      } else {
        // Handle authorization logic here
      }
    },
    toggleForm() {
      this.isRegistering = !this.isRegistering
      this.modalTitle = this.isRegistering ? 'Регистрация' : 'Авторизация'
    },
    closeModal() {
      // Close the modal window
    },
  },
}
</script>

<style scoped>
.auth-modal {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-dialog {
  margin: 0 auto;
  width: 30%;
  height: 30%;
  margin-bottom: 10%;
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.modal-header {
  border-bottom: 1px solid #ddd;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  border-top: 1px solid #ddd;
  padding: 10px;
}

.close {
  cursor: pointer;
}

label {
  display: block;
}

input[type='email'],
input[type='password'],
input[type='name'] {
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
}

button[type='submit'] {
  width: 100%;
  padding: 10px;
  background-color: #4caf50;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
