import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// with this NO stack overflow YES :D
const rooms = new Map()

// strip the secrets so these cheaters don't inspect element the answers
function getSafeRoom(room) {
  if (!room) return null
  return {
    code: room.code,
    quizTitle: room.quizTitle,
    hostSocketId: room.hostSocketId,
    started: room.started,
    phase: room.phase, // 'lobby', 'question', 'scoreboard', 'finished'
    currentQuestionIndex: room.currentQuestionIndex,
    timeLeft: room.timeLeft,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      score: p.score,
      answeredQuestions: p.answeredQuestions
    }))
  }
}

const updateRoomState = (code) => {
  const room = rooms.get(code)
  if (!room) return
  const safeData = getSafeRoom(room)
  io.to(code).emit('room-updated', safeData)
  io.to(code).emit('scoreboard-updated', safeData.players)
}

io.on('connection', socket => {
  console.log(`User connected: ${socket.id}`)

  socket.on('create-room', ({ code, quizTitle, quizData, hostName }, callback) => {
    socket.data.role = 'host'
    const newRoom = {
      code,
      quizTitle: quizTitle || 'Custom Quiz',
      quizData: quizData, // Storage of thy quizz
      hostSocketId: socket.id,
      started: false,
      phase: 'lobby',
      currentQuestionIndex: 0,
      timeLeft: 0,
      timer: null,
      players: [{
        id: socket.id,
        name: hostName || 'Host',
        isHost: true,
        score: 0,
        pendingPoints: 0,
        answeredQuestions: []
      }]
    }
    
    rooms.set(code, newRoom)
    socket.join(code)

    if (callback) {
      callback({ success: true, role: socket.data.role, room: getSafeRoom(newRoom) })
    }
  })

  socket.on('join-room', ({ code, playerName }, callback) => {
    const room = rooms.get(code)
    if (!room) {
      return callback({ success: false, message: 'Room not found. Did your friend give you a fake code?' })
    }
    
    socket.data.role = 'player'
    const newPlayer = {
      id: socket.id,
      name: playerName || 'Anonymous',
      isHost: false,
      score: 0,
      pendingPoints: 0,
      answeredQuestions: []
    }

    room.players.push(newPlayer)
    socket.join(code)
    updateRoomState(code)

    if (callback) {
      callback({ success: true, role: socket.data.role, room: getSafeRoom(room) })
    }
  })

  socket.on('get-room-state', (code, callback) => {
    const room = rooms.get(code)
    if (room && callback) callback(getSafeRoom(room))
  })

  socket.on('leave-room', code => handlePlayerLeave(code, socket.id))

  // Host Starts the Game 
  socket.on('start-game', code => {
    const room = rooms.get(code)
    if (room && room.hostSocketId === socket.id && !room.started) {
      room.started = true
      io.to(code).emit('game-started', room.quizData)
      startQuestion(code)
    }
  })

  // Times up
  function endQuestion(code) {
    const room = rooms.get(code)
    if (!room) return

    clearInterval(room.timer)
    room.timer = null
    room.phase = 'scoreboard'

    // Award pending points now that the round has officially ended
    room.players.forEach(p => {
      if (p.pendingPoints) {
        p.score += p.pendingPoints
        p.pendingPoints = 0
      }
    })

    // Update room state and scoreboard between questions so answers arent spoiled mid quiz :(
    updateRoomState(code)

    const questions = room.quizData.questions || []
    const currentQ = questions[room.currentQuestionIndex]
    const isGameOver = room.currentQuestionIndex >= questions.length - 1

    io.to(code).emit('show-scoreboard', {
      isGameOver,
      hostId: room.hostSocketId,
      correctIndex: currentQ ? currentQ.correctIndex : null,
      questionIndex: room.currentQuestionIndex
    })
  }

  // Server Timer Loop
  function startQuestion(code) {
    const room = rooms.get(code)
    if (!room || !room.quizData?.questions) return

    room.phase = 'question'
    const currentQ = room.quizData.questions[room.currentQuestionIndex]
    room.timeLeft = currentQ ? (currentQ.timeLimit || 15) : 15

    io.to(code).emit('new-question', {
      questionIndex: room.currentQuestionIndex,
      timeLeft: room.timeLeft
    })

    clearInterval(room.timer)
    room.timer = setInterval(() => {
      room.timeLeft--
      io.to(code).emit('timer-tick', room.timeLeft)

      if (room.timeLeft <= 0) {
        endQuestion(code)
      }
    }, 1000)
  }

  // Process Answers
  socket.on('submit-answer', ({ code, questionIndex, answerIndex }) => {
    const room = rooms.get(code)
    if (!room || room.phase !== 'question') return

    const player = room.players.find(p => p.id === socket.id)
    const questions = room.quizData?.questions
    if (!player || !Array.isArray(questions)) return

    if (questionIndex !== room.currentQuestionIndex) return
    if (player.answeredQuestions.includes(questionIndex)) return

    const question = questions[questionIndex]
    if (!question || answerIndex === undefined) return

    player.answeredQuestions.push(questionIndex)

    if (answerIndex === question.correctIndex) {
      const maxTime = question.timeLimit || 15
      const timeRatio = Math.max(0, room.timeLeft / maxTime)
      // Save earned score for the scoreboard phase (prevents giving away correct answers mid-quiz)
      player.pendingPoints = (player.pendingPoints || 0) + (Math.round(timeRatio * 500) + 500)
    }

    // Notice: We deliberately do NOT call updateRoomState here so nobody sees score jumps mid-question!

    // If all players (host included) locked in their answers, end the suspense early
    const allAnswered = room.players.length > 0 && 
      room.players.every(p => p.answeredQuestions.includes(room.currentQuestionIndex))

    if (allAnswered) {
      endQuestion(code)
    }
  })

  socket.on('next-question', code => {
    const room = rooms.get(code)
    if (room && room.hostSocketId === socket.id && room.phase === 'scoreboard') {
      const questionsCount = room.quizData?.questions?.length || 0
      if (room.currentQuestionIndex < questionsCount - 1) {
        room.currentQuestionIndex++
        startQuestion(code)
      }
    }
  })

  // Rip lol
  function handlePlayerLeave(code, socketId) {
    const room = rooms.get(code)
    if (!room) return

    const index = room.players.findIndex(p => p.id === socketId)
    if (index !== -1) {
      room.players.splice(index, 1)
      const userSocket = io.sockets.sockets.get(socketId)
      if (userSocket) {
        userSocket.leave(code)
      }

      if (socketId === room.hostSocketId) {
        clearInterval(room.timer)
        io.to(code).emit('room-closed', 'Host left the game.')
        rooms.delete(code)
      } else {
        updateRoomState(code)
      }
    }
  }

  socket.on('disconnect', () => {
    for (const [code, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        handlePlayerLeave(code, socket.id)
        break
      }
    }
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Socket.io server listening on port ${PORT} (pls dont crash during demo)`)
})