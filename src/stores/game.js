import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  const score = ref(0)
  const players = ref([])
  const timeLeft = ref(0)
  const phase = ref('lobby') // 'lobby', 'question', 'scoreboard', 'finished'
  const isHost = ref(false)  

  // Holds Quiz Data from Ollama JSON (professor AI cooking up questions)
  const quizData = ref({
    title: 'Waiting for Quiz...',
    questions: []
  })

  const currentQuestionIndex = ref(0)

  const currentQuestion = computed(() => {
    if (!quizData.value || !quizData.value.questions || quizData.value.questions.length === 0) {
      return null
    }
    return quizData.value.questions[currentQuestionIndex.value]
  })

  // Load quiz data from Ollama JSON into the store
  function setQuizData (data) {
    quizData.value = data
    currentQuestionIndex.value = 0
    score.value = 0
    phase.value = 'question'
  }

  // Receive scores update from server
  function setPlayers(updatedPlayers, socketId) {
    players.value = updatedPlayers || []
    const me = players.value.find(p => p.id === socketId)
    if (me) {
      score.value = me.score || 0
      isHost.value = me.isHost === true
    }
  }

  // Return statements for all the data that needs accessing outside of the store.

  return {
    score,
    players,
    timeLeft,
    phase,
    isHost,
    quizData,
    currentQuestionIndex,
    currentQuestion,
    setQuizData,
    setPlayers
  }
})
