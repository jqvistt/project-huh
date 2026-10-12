<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { socket } from '../socket.js'

const router = useRouter()

const joinCode = ref('')
const playerName = ref('')
const errorMessage = ref('')

// Sanitize input to allow only digits
function sanitizeInput() {
  joinCode.value = joinCode.value.replace(/\D/g, '')
}
// Host navigation logic
function handleHostClick() {
  router.push('/host')
}

// Player room join logic
async function handleJoinClick() {
  errorMessage.value = ''

  if (!playerName.value.trim()) {
    errorMessage.value = 'PLEASE ENTER A NICKNAME.'
    return
  }

  if (joinCode.value.length !== 4) {
    errorMessage.value = 'PLEASE ENTER A 4-DIGIT CODE.'
    return
  }

  // Join attempt with socket emit
  socket.emit(
    'join-room',
    { code: joinCode.value, playerName: playerName.value.trim() },
    (response) => {
      if (response.success) {
        router.push({ name: 'GameRoom', params: { code: joinCode.value } })
      } else {
        errorMessage.value = response.message
      }
    },
  )
}
</script>

<template>
  <div class="lobby-container">
    <div class="header">
      <h1>PROJECT: HUH!?</h1>
    </div>
    <!-- Host Section -->
    <div class="lobby-card">
      <div class="section">
        <h2>Host a Game</h2>
        <p>Create a new room and invite players.</p>
        <button class="btn primary-btn" @click="handleHostClick">HOST A QUIZ</button>
      </div>

      <div class="divider">
        <span>OR</span>
      </div>

      <!-- Player Join Section -->
      <div class="section">
        <h2>Join a Game</h2>
        <p>Enter a nickname and 4-digit code to play.</p>

        <div class="join-controls">
          <div class="control-group">
            <input v-model="playerName" type="text" placeholder="NICKNAME" class="name-input" maxlength="15"
              @keyup.enter="handleJoinClick" />
          </div>
          <div class="code-row">
            <input v-model="joinCode" type="text" maxlength="4" placeholder="1234" class="code-input"
              @input="sanitizeInput" @keyup.enter="handleJoinClick" />
            <button class="btn secondary-btn" @click="handleJoinClick">JOIN QUIZ</button>
          </div>
        </div>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lobby-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: 'Space Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #1a1a1a;
  padding: 1.5rem;
  box-sizing: border-box;
}

.header h1 {
  font-size: 3rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -1px;
  margin-bottom: 2rem;
  color: #1a1a1a;
  text-shadow: 3px 3px 0px #ffd700;
  text-align: center;
}

.lobby-card {
  background: #ffffff;
  padding: 3rem 2.5rem;
  border: 3px solid #1a1a1a;
  box-shadow: 8px 8px 0px #1a1a1a;
  width: 100%;
  max-width: 480px;
  box-sizing: border-box;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.section h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: #1a1a1a;
}

.section p {
  margin: 0;
  color: #4a4a4a;
  font-size: 1rem;
  font-weight: 500;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 2rem 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 3px dashed #1a1a1a;
}

.divider span {
  padding: 0 1rem;
  font-weight: 900;
  font-size: 1.2rem;
  color: #1a1a1a;
}

.join-controls {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: 0.5rem;
}

.control-group {
  display: flex;
  flex-direction: column;
}

.code-row {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.name-input {
  width: 100%;
  padding: 14px;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 2px;
  text-align: center;
  background-color: #ffffff;
  color: #1a1a1a;
  border: 3px solid #1a1a1a;
  outline: none;
  box-sizing: border-box;
}

.name-input:focus {
  background-color: #fffde6;
  box-shadow: 3px 3px 0px #1a1a1a;
}

.code-input {
  width: 40%;
  padding: 14px;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 4px;
  text-align: center;
  font-family: inherit;
  background-color: #ffffff;
  color: #1a1a1a;
  border: 3px solid #1a1a1a;
  outline: none;
  box-sizing: border-box;
}

.code-input:focus {
  background-color: #fffde6;
  box-shadow: 3px 3px 0px #1a1a1a;
}

.btn {
  padding: 16px 24px;
  font-size: 1.1rem;
  font-weight: 800;
  border: 3px solid #1a1a1a;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.15s ease;
}

.primary-btn {
  background-color: #b026ff;
  color: #ffffff;
  width: 100%;
}

.primary-btn:hover {
  background-color: #c754ff;
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0px #1a1a1a;
}

.primary-btn:active {
  transform: translate(0, 0);
  box-shadow: 0px 0px 0px #1a1a1a;
}

.secondary-btn {
  background-color: #00e5ff;
  color: #1a1a1a;
  width: 60%;
}

.secondary-btn:hover {
  background-color: #33ebff;
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0px #1a1a1a;
}

.secondary-btn:active {
  transform: translate(0, 0);
  box-shadow: 0px 0px 0px #1a1a1a;
}

.error-msg {
  color: #ff2b2b;
  font-weight: 800;
  font-size: 0.9rem;
  margin: 0.5rem 0 0 0;
  text-transform: uppercase;
}

@media (max-width: 480px) {
  .code-row {
    flex-direction: column;
  }

  .code-input,
  .secondary-btn {
    width: 100%;
  }
}
</style>
