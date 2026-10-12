<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { socket } from '../socket'
import { useGameStore } from '../stores/game'
import ScoreBoard from './ScoreBoard.vue'
import clockTickingFile from '../media/sfx/clock-ticking.mp3'
import alarmClockFile from '../media/sfx/alarm-clock.mp3'

const router = useRouter()
const route = useRoute()

const gameStore = useGameStore()
const isGameOver = ref(false)
const selectedOptionIndex = ref(null)
const revealedCorrectIndex = ref(null)
const isTransitioning = ref(false)

const tickingAudio = new Audio(clockTickingFile)
tickingAudio.loop = true
tickingAudio.volume = 0.04

const alarmAudio = new Audio(alarmClockFile)
alarmAudio.volume = 0.05

const stopAudio = (audio) => {
  if (audio) {
    audio.pause()
    audio.currentTime = 0
  }
}

const handleScoresUpdated = (players) => {
  console.log('Scoreboard received:', players)
  gameStore.setPlayers(players, socket.id)
}

const handleTimerTick = (time) => {
  gameStore.timeLeft = time
  const maxTime = gameStore.currentQuestion?.timeLimit || 15
  const elapsedRatio = Math.max(0, Math.min(1, (maxTime - time) / maxTime))
  if (typeof window.setGameIntensity === 'function') {
    window.setGameIntensity(elapsedRatio)
  }

  // Play ticking sound when the timer turns red (<= 5s) during the question
  if (time <= 5 && gameStore.phase === 'question' && tickingAudio.paused) {
    tickingAudio.play().catch(() => { })
  }
}

const handleNewQuestion = ({ questionIndex, timeLeft }) => {
  stopAudio(tickingAudio)
  gameStore.currentQuestionIndex = questionIndex
  gameStore.timeLeft = timeLeft
  gameStore.phase = 'question'
  selectedOptionIndex.value = null
  revealedCorrectIndex.value = null
  isTransitioning.value = false
  if (typeof window.setGameIntensity === 'function') {
    window.setGameIntensity(0)
  }
}

const handleShowScoreboard = ({ isGameOver: gameOver, correctIndex }) => {
  stopAudio(tickingAudio)
  // Alarm clock sound when swapping to scoreboard
  alarmAudio.currentTime = 0
  alarmAudio.play().catch(() => { })

  revealedCorrectIndex.value = correctIndex
  isGameOver.value = gameOver
  gameStore.phase = 'scoreboard'
  if (typeof window.setGameIntensity === 'function') {
    window.setGameIntensity(0)
  }
}

onMounted(() => {
  socket.on('room-closed', () => {
    alert('The host ended the game early! Returning to the lobby.')
    router.push('/')
  })

  socket.on('scoreboard-updated', handleScoresUpdated)
  socket.on('timer-tick', handleTimerTick)
  socket.on('new-question', handleNewQuestion)
  socket.on('show-scoreboard', handleShowScoreboard)

  socket.emit('get-room-state', route.params.code, (room) => {
    if (room) {
      handleScoresUpdated(room.players)
      if (typeof room.currentQuestionIndex === 'number') {
        gameStore.currentQuestionIndex = room.currentQuestionIndex
      }
      if (typeof room.timeLeft === 'number') {
        gameStore.timeLeft = room.timeLeft
      }
      if (room.phase) {
        gameStore.phase = room.phase
      }
    }
  })
})

onUnmounted(() => {
  stopAudio(tickingAudio)
  stopAudio(alarmAudio)
  socket.off('room-closed')
  socket.off('scoreboard-updated', handleScoresUpdated)
  socket.off('timer-tick', handleTimerTick)
  socket.off('new-question', handleNewQuestion)
  socket.off('show-scoreboard', handleShowScoreboard)
  if (typeof window.setGameIntensity === 'function') {
    window.setGameIntensity(0)
  }
})

// Lock in answer choice and send to server 
const handleOptionClick = (index) => {
  if (isTransitioning.value || gameStore.phase !== 'question') return

  isTransitioning.value = true
  selectedOptionIndex.value = index

  socket.emit('submit-answer', {
    code: route.params.code,
    questionIndex: gameStore.currentQuestionIndex,
    answerIndex: index
  })
}

// Host clicked advance 
const advanceNextQuestion = () => {
  socket.emit('next-question', route.params.code)
}

// Determine if answer is correct or wrong and return cool animations for buttons
const getOptionClass = (index) => {
  if (gameStore.phase === 'scoreboard') {
    if (index === revealedCorrectIndex.value) return 'correct-anim'
    if (index === selectedOptionIndex.value && selectedOptionIndex.value !== revealedCorrectIndex.value) {
      return 'wrong-anim'
    }
    return 'fade-anim'
  }

  if (selectedOptionIndex.value === null) return ''
  if (selectedOptionIndex.value === index) return 'selected-anim'
  return 'fade-anim'
}

const returnToLobby = () => {
  stopAudio(tickingAudio)
  stopAudio(alarmAudio)
  socket.emit('leave-room', route.params.code)
  router.push('/')
}

const leaveGame = () => {
  stopAudio(tickingAudio)
  stopAudio(alarmAudio)
  socket.emit('leave-room', route.params.code)
  router.push('/')
}
</script>

<template>
  <div class="game-container">
    <div class="header">
      <h1>{{ gameStore.quizData.title }}</h1>
    </div>

    <div class="game-card" v-if="gameStore.currentQuestion">
      <button class="close-btn" @click="leaveGame" title="Leave Game">✖</button>

      <!-- Active Question Phase -->
      <div v-if="gameStore.phase === 'question'" class="question-section">
        <div class="progress-bar">
          <span>Question {{ gameStore.currentQuestionIndex + 1 }} of {{ gameStore.quizData.questions.length }}</span>
          <div class="timer-badge" :class="{ 'timer-urgent': gameStore.timeLeft <= 5 }">
            ⏱ {{ gameStore.timeLeft }}s
          </div>
          <span>Score: {{ gameStore.score }}</span>
        </div>

        <h2 class="question-text">{{ gameStore.currentQuestion.question }}</h2>

        <div class="options-grid">
          <button v-for="(option, index) in gameStore.currentQuestion.options" :key="index" class="btn option-btn"
            :class="getOptionClass(index)" :disabled="isTransitioning" @click="handleOptionClick(index)">
            {{ option }}
          </button>
        </div>

        <div v-if="isTransitioning" class="status-banner">
          Answer submitted! Waiting for time or other players...
        </div>
      </div>

      <!-- Mid-Game Scoreboard Phase -->
      <div v-else-if="gameStore.phase === 'scoreboard' && !isGameOver" class="scoreboard-section">
        <div class="round-summary">
          <h2 class="round-title">Round Results</h2>
          <p class="answer-reveal">
            Correct Answer:
            <strong>{{ gameStore.currentQuestion.options[revealedCorrectIndex] }}</strong>
          </p>
        </div>

        <ScoreBoard />

        <div class="host-controls">
          <button v-if="gameStore.isHost" class="btn primary-btn next-btn" @click="advanceNextQuestion">
            NEXT QUESTION ➔
          </button>
          <div v-else class="waiting-box">
            Waiting for host to continue...
          </div>
        </div>
      </div>

      <!-- Final Results Phase -->
      <div v-else-if="isGameOver" class="results-section">
        <h2>Quiz Complete!</h2>
        <ScoreBoard />
        <div class="score-display">
          Your Score: {{ gameStore.score }} Points
        </div>
        <button class="btn primary-btn" @click="returnToLobby">BACK TO MAIN MENU</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: 'Space Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #f0f0f5;
  color: #1a1a1a;
  padding: 1.5rem;
  box-sizing: border-box;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  background-color: #ff4747;
  color: #ffffff;
  border: 3px solid #1a1a1a;
  font-size: 1.2rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.15s ease;
  z-index: 10;
}

.close-btn:hover {
  background-color: #ff6666;
  transform: translate(-3px, -3px);
  box-shadow: 4px 4px 0px #1a1a1a;
}

.close-btn:active {
  transform: translate(0, 0);
  box-shadow: 0px 0px 0px #1a1a1a;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -1px;
  margin-bottom: 2rem;
  color: #1a1a1a;
  text-shadow: 3px 3px 0px #ffd700;
  text-align: center;
}

.game-card {
  position: relative;
  background: #ffffff;
  padding: 3rem 2.5rem;
  border: 3px solid #1a1a1a;
  box-shadow: 8px 8px 0px #1a1a1a;
  width: 100%;
  max-width: 600px;
  border-radius: 0;
  box-sizing: border-box;
}

.progress-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 800;
  font-size: 1.1rem;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 3px solid #1a1a1a;
}

.timer-badge {
  background: #ffd700;
  border: 2px solid #1a1a1a;
  padding: 4px 12px;
  font-weight: 900;
  box-shadow: 2px 2px 0px #1a1a1a;
}

.timer-urgent {
  background: #ff1744;
  color: #ffffff;
  animation: pulse 0.6s infinite alternate;
}

@keyframes pulse {
  from {
    transform: scale(1);
  }

  to {
    transform: scale(1.08);
  }
}

.question-text {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 2rem;
  line-height: 1.3;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.btn {
  padding: 20px;
  font-size: 1.2rem;
  font-weight: 800;
  border: 3px solid #1a1a1a;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.option-btn {
  background-color: #ffffff;
  color: #1a1a1a;
  box-shadow: 4px 4px 0px #1a1a1a;
}

.option-btn:hover:not(:disabled) {
  background-color: #f8f8f8;
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px #1a1a1a;
}

.option-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #1a1a1a;
}

.selected-anim {
  background-color: #ffd700 !important;
  color: #1a1a1a !important;
  border-color: #1a1a1a !important;
  box-shadow: 2px 2px 0px #1a1a1a !important;
}

.correct-anim {
  background-color: #00e676 !important;
  color: #1a1a1a !important;
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #1a1a1a !important;
}

.wrong-anim {
  background-color: #ff1744 !important;
  color: #ffffff !important;
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #1a1a1a !important;
}

.fade-anim {
  opacity: 0.5;
  background-color: #e0e0e0 !important;
}

.status-banner {
  margin-top: 1.5rem;
  padding: 10px;
  background: #eef2ff;
  border: 2px dashed #1a1a1a;
  text-align: center;
  font-weight: 700;
}

.scoreboard-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.round-summary {
  text-align: center;
}

.round-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 900;
  text-transform: uppercase;
}

.answer-reveal {
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.answer-reveal strong {
  color: #00a854;
}

.host-controls {
  margin-top: 1rem;
  text-align: center;
}

.next-btn {
  width: 100%;
}

.waiting-box {
  padding: 12px;
  background: #f0f0f5;
  border: 2px dashed #1a1a1a;
  font-weight: 800;
  text-transform: uppercase;
  color: #555;
}

.results-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.results-section h2 {
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0;
}

.score-display {
  font-size: 4rem;
  font-weight: 900;
  color: #ff5722;
  text-shadow: 4px 4px 0px #1a1a1a;
  margin: 1rem 0;
}

.primary-btn {
  background-color: #ff5722;
  color: #ffffff;
  text-transform: uppercase;
  padding: 16px 32px;
}

.primary-btn:hover {
  background-color: #ff7043;
  transform: translate(-4px, -4px);
  box-shadow: 6px 6px 0px #1a1a1a;
}

@media (max-width: 600px) {
  .options-grid {
    grid-template-columns: 1fr;
  }

  .header h1 {
    font-size: 2rem;
  }

  .question-text {
    font-size: 1.4rem;
  }

  .btn {
    padding: 15px;
    font-size: 1.1rem;
  }
}
</style>
