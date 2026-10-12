<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { socket } from '../socket.js'
import { useGameStore } from '../stores/game'

const route = useRoute()
const router = useRouter()

const gameStore = useGameStore()

const roomCode = ref(route.params.code || '')
const players = ref([])
const quizTitle = ref('Quiz Lobby')
const errorMessage = ref('')

const currentSocketId = computed(() => socket.id)

// PlayerList Array
const playerList = computed(() => {
  return players.value || []
})

// Host Definition
const isHost = computed(() => {
  const me = players.value.find((p) => p.id === socket.id)
  return me ? me.isHost : false
})
// Start Game Function
const startGame = () => {
  socket.emit('start-game', roomCode.value)
}

const kickPlayer = (playerId) => {
  socket.emit('kick-player', { code: roomCode.value, playerId })
}

onMounted(() => {
  if (!roomCode.value) {
    errorMessage.value = 'NO ROOM CODE PROVIDED.'
    return
  }
  socket.emit('get-room-state', roomCode.value, (roomData) => {
    if (roomData) {
      players.value = roomData.players || []
      quizTitle.value = roomData.quizTitle || 'Quiz Lobby'
    }
  })

  socket.on('room-updated', (roomData) => {
    players.value = roomData?.players || []
    quizTitle.value = roomData?.quizTitle || 'Quiz Lobby'
  })

  socket.on('player-kicked', () => {
    alert('You have been kicked from the lobby.')
    router.push('/')
  })

  socket.on('room-closed', (reason) => {
    alert('The host has left! Returning to the lobby.')
    router.push('/')
  })

  socket.on('game-started', (quizData) => {
    gameStore.setQuizData(quizData)
    gameStore.setPlayers(players.value, socket.id)

    router.push({ name: 'GameView', params: { code: roomCode.value } })
  })
})

onUnmounted(() => {
  socket.off('room-updated')
  socket.off('player-kicked')
  socket.off('room-closed')
  socket.off('game-started')
})

// Disconnect Function
function disconnect() {
  socket.emit('leave-room', roomCode.value)
  console.log(
    'Disconnected from room:',
    roomCode.value,
    'because the host left or the room was closed.',
  )
  router.push('/')
}
</script>

<template>
  <div class="gameroom-container">
    <h1>ROOM: {{ roomCode }}</h1>

    <div v-if="errorMessage" class="error">
      <p>{{ errorMessage }}</p>
    </div>
    <!--Playerlist grid-->
    <div v-else>
      <div class="player-count">
        PLAYERS JOINED: <span>{{ playerList.length }}</span>
      </div>

      <div v-if="playerList.length === 0" class="empty-state">
        Waiting for players to enter code <strong>{{ roomCode }}</strong>...
      </div>
      <div v-else class="players-grid">
        <div v-for="player in playerList" :key="player.id" class="player-card">
          <div class="avatar-box">{{ player.name.charAt(0).toUpperCase() }}</div>
          <span class="player-name">
            {{ player.name }}
            <span v-if="player.id === currentSocketId" class="you-tag">(YOU)</span>
          </span>
          <span v-if="player.isHost" class="host-tag">HOST</span>
          <button
            v-if="isHost && !player.isHost"
            class="kick-btn"
            title="Kick player"
            @click="kickPlayer(player.id)"
          >
            ✕
          </button>
        </div>
      </div>
      <!--Buttons-->
      <div class="action-bar">
        <button class="btn danger-btn" @click="disconnect">LEAVE LOBBY</button>
        <button v-if="isHost" class="btn primary-btn" @click="startGame">START GAME</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gameroom-container {
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

.header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -1px;
  margin: 0 0 1rem 0;
  text-shadow: 3px 3px 0px #ffd700;
}

.code-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background-color: #ffd700;
  border: 3px solid #1a1a1a;
  box-shadow: 4px 4px 0px #1a1a1a;
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.code-badge:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px #1a1a1a;
}

.code-label {
  font-weight: 800;
  font-size: 1rem;
}

.code-value {
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 4px;
}

.hint {
  font-size: 0.85rem;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  margin-top: 0.5rem;
}

.gameroom-card {
  background: #ffffff;
  padding: 2.5rem;
  border: 3px solid #1a1a1a;
  box-shadow: 8px 8px 0px #1a1a1a;
  width: 100%;
  max-width: 600px;
  box-sizing: border-box;
}

.quiz-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px dashed #1a1a1a;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.quiz-info h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
}

.player-count {
  font-weight: 800;
  font-size: 0.9rem;
  background: #00e5ff;
  border: 2px solid #1a1a1a;
  padding: 6px 12px;
}

.players-section h3 {
  font-size: 1.2rem;
  font-weight: 900;
  margin-bottom: 1rem;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  border: 2px dashed #ccc;
  color: #666;
  font-weight: 600;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.player-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8f8f8;
  border: 3px solid #1a1a1a;
  box-shadow: 3px 3px 0px #1a1a1a;
  padding: 1rem 0.5rem;
  position: relative;
}

.avatar-box {
  width: 44px;
  height: 44px;
  background-color: #b026ff;
  color: #fff;
  border: 2px solid #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
}

.player-name {
  font-weight: 800;
  font-size: 0.95rem;
  text-align: center;
  word-break: break-word;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.you-tag {
  font-size: 0.7rem;
  color: #b026ff;
  font-weight: 900;
}

.host-tag {
  font-size: 0.65rem;
  font-weight: 900;
  background-color: #ffd700;
  border: 1px solid #1a1a1a;
  padding: 2px 4px;
  margin-top: 4px;
}

.kick-btn {
  margin-top: 6px;
  background-color: #ff4747;
  color: #ffffff;
  border: 2px solid #1a1a1a;
  box-shadow: 2px 2px 0px #1a1a1a;
  font-weight: 900;
  font-size: 0.75rem;
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: transform 0.1s ease;
}

.kick-btn:hover {
  background-color: #ff6666;
  transform: translate(-1px, -1px);
}

.action-bar {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-top: 1.5rem;
}

.btn {
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 800;
  border: 3px solid #1a1a1a;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.15s ease;
}

.primary-btn {
  background-color: #b026ff;
  color: #ffffff;
  flex: 2;
}

.primary-btn:hover:not(:disabled) {
  background-color: #c754ff;
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0px #1a1a1a;
}

.danger-btn {
  background-color: #ff4747;
  color: #ffffff;
  flex: 1;
}

.danger-btn:hover {
  background-color: #ff6666;
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0px #1a1a1a;
}

.error-container {
  text-align: center;
}

.error-container h2 {
  color: #ff4747;
}

@media (max-width: 550px) {
  .gameroom-container {
    padding: 1rem 0.75rem;
    min-height: auto;
    padding-top: 2rem;
    padding-bottom: 2rem;
  }

  .header h1 {
    font-size: 1.8rem;
    margin-bottom: 0.8rem;
  }

  .code-badge {
    padding: 8px 16px;
  }

  .code-value {
    font-size: 1.5rem;
  }

  .gameroom-card {
    padding: 1.5rem 1rem;
    box-shadow: 4px 4px 0px #1a1a1a;
  }

  .players-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.6rem;
  }

  .action-bar {
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn {
    width: 100%;
    padding: 14px 16px;
  }
}
</style>
