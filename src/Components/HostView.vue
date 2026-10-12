<!-- src/Components/HostView.vue -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { socket } from '../socket.js'
import { useGameStore } from '../stores/game'

const router = useRouter()
const gameStore = useGameStore()

const hostName = ref('')
const aiPrompt = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const progress = ref(0)
const progressMessage = ref('Preparing generator...')
let progressInterval = null

const progressStages = [
  { threshold: 25, message: 'Parsing topic & prompt...' },
  { threshold: 55, message: 'Drafting trivia questions...' },
  { threshold: 80, message: 'Validating answer options & timers...' },
  { threshold: 92, message: 'Finalizing quiz data & room...' },
]

function startProgressSimulation() {
  progress.value = 5
  progressMessage.value = 'Contacting Ollama...'
  clearInterval(progressInterval)
  progressInterval = setInterval(() => {
    if (progress.value < 92) {
      const increment = Math.max(0.5, (95 - progress.value) / 18)
      progress.value = Math.min(92, Math.round(progress.value + increment))
      const stage = progressStages.find((s) => progress.value <= s.threshold)
      if (stage) {
        progressMessage.value = stage.message
      }
    }
  }, 250)
}

function completeProgress(message = 'Room ready!') {
  clearInterval(progressInterval)
  progress.value = 100
  progressMessage.value = message
}

function resetProgress() {
  clearInterval(progressInterval)
  progress.value = 0
  progressMessage.value = ''
}

async function handleGenerateQuizAndLobby() {
  if (!aiPrompt.value.trim() || !hostName.value.trim()) return

  isLoading.value = true
  errorMessage.value = ''
  startProgressSimulation()

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1:8b',
        prompt: `Create a trivia quiz based on the following request: "${aiPrompt.value}". 
        INSTRUCTIONS: 
        1. If the request specifies a number of questions, you MUST generate exactly that many. 
        2. If NOT specified, default to exactly 10 questions.
        3. Every single question MUST have exactly 4 answer options or alternatively a TRUE OR FALSE statement.
        4. Each question MUST have a time limit in seconds, which should be an integer strictly between 10 and 30 (inclusive).`,
        stream: false,
        format: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  options: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 2,
                    maxItems: 4,
                  },
                  correctIndex: { type: 'integer' },
                  timeLimit: {
                    type: 'integer',
                    minimum: 10,
                    maximum: 30,
                  },
                },
                required: ['question', 'options', 'correctIndex', 'timeLimit'],
              },
            },
          },
          required: ['title', 'questions'],
        },
      }),
    })

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const data = await response.json()
    const cleanText = data.response.replace(/```json/gi, '').replace(/```/g, '').trim()
    const quizObject = JSON.parse(cleanText)

    gameStore.setQuizData(quizObject)

    const plainQuizData = JSON.parse(JSON.stringify(quizObject))
    const code = Math.floor(1000 + Math.random() * 9000).toString()

    socket.emit(
      'create-room',
      {
        code,
        quizTitle: plainQuizData.title,
        quizData: plainQuizData,
        hostName: hostName.value.trim(),
      },
      (res) => {
        if (res.success) {
          completeProgress('Entering lobby...')
          setTimeout(() => {
            router.push({ name: 'GameRoom', params: { code: code } })
          }, 200)
        } else {
          errorMessage.value = res.message
          resetProgress()
          isLoading.value = false
        }
      },
    )
  } catch (error) {
    console.error('Failed to create quiz:', error)
    errorMessage.value = 'Failed to generate quiz. Make sure Ollama is running with llama3.1:8b.'
    resetProgress()
    isLoading.value = false
  }
}
</script>

<template>
  <div class="quiz-creator-container">
    <div class="header">
      <h1>HOST A QUIZ</h1>
    </div>

    <div class="creator-card">
      <div class="section">
        <h2>AI Quiz Builder</h2>

        <div class="input-group">
          <label class="input-label">Host Display Name</label>
          <input
            v-model="hostName"
            type="text"
            class="prompt-input name-input"
            placeholder="Enter your name..."
            maxlength="15"
          />
        </div>

        <div class="input-group">
          <label class="input-label">Quiz Topic</label>
          <textarea
            v-model="aiPrompt"
            class="prompt-input"
            placeholder="e.g. Make a 10-question trivia quiz about 1990s hip hop..."
            rows="4"
          ></textarea>
        </div>

        <!-- Progress bar -->
        <div v-if="isLoading" class="progress-box">
          <div class="progress-header">
            <span class="progress-status">{{ progressMessage }}</span>
            <span class="progress-value">{{ progress }}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>

        <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

        <div class="button-container">
          <button
            class="btn primary-btn"
            :disabled="!aiPrompt.trim() || !hostName.trim() || isLoading"
            @click="handleGenerateQuizAndLobby"
          >
            {{ isLoading ? 'GENERATING ROOM...' : 'GENERATE QUIZ & CREATE LOBBY' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-creator-container {
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

.creator-card {
  background: #ffffff;
  padding: 3rem 2.5rem;
  border: 3px solid #1a1a1a;
  box-shadow: 8px 8px 0px #1a1a1a;
  width: 100%;
  max-width: 500px;
  border-radius: 0;
  box-sizing: border-box;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: #1a1a1a;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-weight: 800;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.prompt-input {
  width: 100%;
  padding: 16px;
  font-size: 1.1rem;
  font-family: inherit;
  background-color: #ffffff;
  color: #1a1a1a;
  border: 3px solid #1a1a1a;
  outline: none;
  font-weight: 600;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.name-input {
  min-height: auto;
}

textarea.prompt-input {
  resize: vertical;
  min-height: 100px;
  line-height: 1.5;
}

.prompt-input:focus {
  background-color: #f8f8f8;
  box-shadow: 4px 4px 0px #1a1a1a;
  transform: translate(-2px, -2px);
}

.progress-box {
  margin: 0.5rem 0 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 800;
  text-transform: uppercase;
}

.progress-track {
  width: 100%;
  height: 20px;
  background-color: #f0f0f5;
  border: 3px solid #1a1a1a;
  box-shadow: 3px 3px 0px #1a1a1a;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #00f0ff;
  border-right: 3px solid #1a1a1a;
  transition: width 0.25s ease-out;
}

.error-banner {
  color: #ff2a2a;
  background: #ffe6e6;
  border: 2px solid #ff2a2a;
  padding: 8px 12px;
  font-weight: 700;
  font-size: 0.9rem;
  margin: 0;
}

.button-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn {
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 800;
  border: 3px solid #1a1a1a;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.15s ease;
  width: 100%;
}

.btn:disabled {
  background-color: #cccccc;
  color: #666666;
  cursor: not-allowed;
  border-color: #999;
}

.primary-btn {
  background-color: #b026ff;
  color: #ffffff;
}

.primary-btn:hover:not(:disabled) {
  background-color: #c754ff;
  transform: translate(-4px, -4px);
  box-shadow: 6px 6px 0px #1a1a1a;
}
</style>