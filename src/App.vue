<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSound } from '@vueuse/sound'

import clickSfx from './media/sfx/button-clicked.mp3'
import crackleSfxFile from './media/sfx/crackle.mp3'
import themeMusicFile from './media/sfx/theme.mp3'

const route = useRoute()

/* Audio Functionality bs (profesores gemini) */
const { play: playClickSfx } = useSound(clickSfx, { volume: 0.3 })
const { play: playCrackle } = useSound(crackleSfxFile, { volume: 0.01 })

const bgmAudio = new Audio(themeMusicFile)
bgmAudio.loop = true
bgmAudio.volume = 0.02

let audioCtx = null
let filter = null
let isAudioInitialized = false

function applyRouteAcoustics(path) {
  if (!filter || !audioCtx) return

  const now = audioCtx.currentTime
  const currentPath = path.toLowerCase()

  filter.frequency.cancelScheduledValues(now)

  if (currentPath.includes('host')) {
    filter.frequency.setTargetAtTime(300, now, 0.5)
    bgmAudio.playbackRate = 0.85
  } else if (currentPath === '/') {
    filter.frequency.setTargetAtTime(1200, now, 0.5)
    bgmAudio.playbackRate = 1.0
  } else if (currentPath.includes('room')) {
    filter.frequency.setTargetAtTime(3000, now, 0.5)
    bgmAudio.playbackRate = 1.0
  } else {
    filter.frequency.setTargetAtTime(20000, now, 0.5)
    bgmAudio.playbackRate = 1.0
  }
}

window.setGameIntensity = (percentageComplete) => {
  if (bgmAudio) {
    const intensity = Math.min(1, Math.max(0, percentageComplete || 0))
    bgmAudio.playbackRate = 1.0 + intensity * 0.6
  }
}

function initWebAudio() {
  if (isAudioInitialized) return
  isAudioInitialized = true

  const AudioContext = window.AudioContext || window.webkitAudioContext
  audioCtx = new AudioContext()

  const source = audioCtx.createMediaElementSource(bgmAudio)
  filter = audioCtx.createBiquadFilter()

  filter.type = 'lowpass'
  filter.frequency.value = 1000

  source.connect(filter)
  filter.connect(audioCtx.destination)

  bgmAudio.play()

  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }

  applyRouteAcoustics(route.path)
}

watch(
  () => route.path,
  newPath => {
    if (isAudioInitialized) {
      playCrackle()
      applyRouteAcoustics(newPath)
    }
  }
)

function handleGlobalClick(event) {
  const isButton = event.target.closest('button')
  if (isButton) {
    playClickSfx()
  }

  if (!isAudioInitialized) {
    initWebAudio()
  }
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
  if (bgmAudio) bgmAudio.pause()
})
</script>

<template>
  <div class="app-container">
    <!---AI generated eye candy for the "kahoot" feeeling --->
    <div class="scrolling-bg">
      <div class="scrolling-track">
        <div v-for="sheet in 2" :key="sheet" class="bg-sheet">
          <svg class="bg-symbol s-1" viewBox="0 0 100 120">
            <path class="drawn-path" d="M25 40 C25 5, 75 5, 75 40 C75 70, 50 60, 50 85" />
            <rect class="filled fade-cycle" x="40" y="100" width="20" height="20" rx="10" />
          </svg>

          <svg class="bg-symbol s-2" viewBox="0 0 100 100">
            <circle class="drawn-path" cx="50" cy="50" r="45" />
            <polyline class="drawn-path" points="50,15 50,50 75,65" />
            <line class="drawn-path" x1="50" y1="5" x2="50" y2="15" />
            <line class="drawn-path" x1="95" y1="50" x2="85" y2="50" />
          </svg>

          <svg class="bg-symbol s-3" viewBox="0 0 100 100">
            <polyline class="drawn-path" points="10,50 40,80 90,20" />
            <line class="drawn-path" x1="60" y1="70" x2="90" y2="100" />
            <line class="drawn-path" x1="90" y1="70" x2="60" y2="100" />
          </svg>

          <svg class="bg-symbol s-4" viewBox="0 0 100 100">
            <circle class="drawn-path" cx="30" cy="30" r="20" />
            <circle class="drawn-path" cx="80" cy="45" r="15" />
            <circle class="drawn-path" cx="40" cy="80" r="10" />
            <polyline class="drawn-path" points="20,30 30,40 45,20" />
            <line class="drawn-path" x1="75" y1="40" x2="85" y2="50" />
            <line class="drawn-path" x1="85" y1="40" x2="75" y2="50" />
          </svg>

          <svg class="bg-symbol s-5" viewBox="0 0 100 120">
            <line class="drawn-path" x1="50" y1="5" x2="50" y2="80" stroke-width="12" />
            <rect class="filled fade-cycle" x="44" y="98" width="12" height="12" rx="6" />
          </svg>

          <svg class="bg-symbol s-6" viewBox="0 0 100 120">
            <path class="drawn-path" d="M30 80 C10 80, 10 30, 50 10 C90 30, 90 80, 70 80" />
            <line class="drawn-path" x1="30" y1="80" x2="70" y2="80" />
            <line class="drawn-path" x1="35" y1="90" x2="65" y2="90" />
            <line class="drawn-path" x1="40" y1="100" x2="60" y2="100" />
            <polyline class="drawn-path" points="45,80 45,50 55,50 55,80" />
          </svg>

          <svg class="bg-symbol s-7" viewBox="0 0 100 100">
            <rect class="drawn-path" x="15" y="15" width="70" height="70" rx="12" />
            <circle class="filled fade-cycle" cx="35" cy="35" r="6" />
            <circle class="filled fade-cycle" cx="65" cy="65" r="6" />
            <circle class="filled fade-cycle" cx="50" cy="50" r="6" />
          </svg>

          <svg class="bg-symbol s-8" viewBox="0 0 100 100">
            <path class="drawn-path"
              d="M10 50 C10 20, 90 20, 90 50 C90 80, 50 80, 30 80 L10 95 L20 75 C12 65, 10 60, 10 50 Z" />
            <line class="drawn-path" x1="30" y1="40" x2="70" y2="40" />
            <line class="drawn-path" x1="30" y1="60" x2="60" y2="60" />
          </svg>

          <svg class="bg-symbol s-9" viewBox="0 0 100 100">
            <circle class="drawn-path" cx="40" cy="40" r="25" />
            <line class="drawn-path" x1="58" y1="58" x2="85" y2="85" stroke-width="10" />
          </svg>

          <svg class="bg-symbol s-10" viewBox="0 0 100 100">
            <circle class="drawn-path" cx="50" cy="50" r="40" />
            <circle class="drawn-path" cx="50" cy="50" r="25" />
            <circle class="filled fade-cycle" cx="50" cy="50" r="10" />
          </svg>

          <svg class="bg-symbol s-11" viewBox="0 0 100 100">
            <path class="drawn-path"
              d="M50 20 C30 10, 10 30, 20 50 C10 70, 30 90, 50 80 C70 90, 90 70, 80 50 C90 30, 70 10, 50 20 Z" />
            <path class="drawn-path" d="M50 20 L50 80 M30 40 Q50 50 30 60 M70 40 Q50 50 70 60" />
          </svg>

          <svg class="bg-symbol s-12" viewBox="0 0 100 100">
            <path class="drawn-path" d="M10 80 L10 30 L30 50 L50 10 L70 50 L90 30 L90 80 Z" />
            <line class="drawn-path" x1="10" y1="90" x2="90" y2="90" stroke-width="10" />
          </svg>

          <svg class="bg-symbol s-13" viewBox="0 0 100 100">
            <polygon class="drawn-path" points="50,10 85,30 85,70 50,90 15,70 15,30" stroke-linejoin="round" />
            <line class="drawn-path" x1="50" y1="10" x2="50" y2="30" />
            <line class="drawn-path" x1="85" y1="70" x2="65" y2="60" />
            <line class="drawn-path" x1="15" y1="70" x2="35" y2="60" />
          </svg>

          <svg class="bg-symbol s-14" viewBox="0 0 100 100">
            <polygon class="drawn-path" points="20,10 80,10 50,50 80,90 20,90 50,50" stroke-linejoin="round" />
            <line class="drawn-path" x1="15" y1="10" x2="85" y2="10" stroke-width="8" />
            <line class="drawn-path" x1="15" y1="90" x2="85" y2="90" stroke-width="8" />
          </svg>

          <svg class="bg-symbol s-15" viewBox="0 0 100 100">
            <polygon class="drawn-path" points="50,10 61,35 88,35 66,54 75,85 50,65 25,85 34,54 12,35 39,35"
              stroke-linejoin="round" />
          </svg>
        </div>
      </div>
    </div>
    <!---Page swapping schenanigans--->
    <div class="content-wrapper">
      <router-view v-slot="{ Component, route }">
        <transition name="bounce-transition" mode="out-in">
          <component :is="Component" :key="route.path" class="route-component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>

<style scoped>
.app-container {
  overflow: hidden;
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.content-wrapper {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.route-component {
  width: 100%;
}

.scrolling-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.scrolling-track {
  display: flex;
  width: fit-content;
  animation: scrollSheet 55s linear infinite;
}

@keyframes scrollSheet {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

.bg-sheet {
  position: relative;
  width: 100vw;
  height: 100vh;
  flex-shrink: 0;
}

.bg-symbol {
  position: absolute;
  width: 100px;
  height: 100px;
  color: #e0e0e0;
  stroke: currentColor;
  stroke-width: 6;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.filled {
  fill: currentColor;
  stroke: none;
}

.drawn-path {
  stroke-dasharray: 450;
  stroke-dashoffset: 450;
  animation: sketchCycle 8s cubic-bezier(0.6, 0.1, 0.4, 1) infinite;
}

.fade-cycle {
  opacity: 0;
  animation: fillFadeCycle 8s cubic-bezier(0.6, 0.1, 0.4, 1) infinite;
}

@keyframes sketchCycle {

  0%,
  15% {
    stroke-dashoffset: 450;
    opacity: 0;
  }

  20% {
    opacity: 1;
  }

  45%,
  55% {
    stroke-dashoffset: 0;
    opacity: 1;
  }

  80% {
    opacity: 1;
  }

  85%,
  100% {
    stroke-dashoffset: -450;
    opacity: 0;
  }
}

@keyframes fillFadeCycle {

  0%,
  35% {
    opacity: 0;
  }

  45%,
  55% {
    opacity: 1;
  }

  75%,
  100% {
    opacity: 0;
  }
}

.s-1 {
  top: 8%;
  left: 4%;
  transform: rotate(-15deg);
}

.s-1 .drawn-path,
.s-1 .fade-cycle {
  animation-delay: 0.2s;
  animation-duration: 9s;
}

.s-2 {
  top: 55%;
  left: 10%;
  transform: rotate(10deg);
}

.s-2 .drawn-path,
.s-2 .fade-cycle {
  animation-delay: 1.5s;
  animation-duration: 7s;
}

.s-3 {
  top: 75%;
  left: 4%;
  transform: rotate(-5deg);
}

.s-3 .drawn-path,
.s-3 .fade-cycle {
  animation-delay: 3.1s;
  animation-duration: 8.5s;
}

.s-4 {
  top: 15%;
  left: 18%;
  transform: rotate(20deg);
}

.s-4 .drawn-path,
.s-4 .fade-cycle {
  animation-delay: 0.8s;
  animation-duration: 7.5s;
}

.s-5 {
  top: 85%;
  left: 22%;
  transform: rotate(-25deg);
}

.s-5 .drawn-path,
.s-5 .fade-cycle {
  animation-delay: 2.4s;
  animation-duration: 9.5s;
}

.s-6 {
  top: 40%;
  left: 28%;
  transform: rotate(5deg);
}

.s-6 .drawn-path,
.s-6 .fade-cycle {
  animation-delay: 4s;
  animation-duration: 8s;
}

.s-7 {
  top: 12%;
  left: 38%;
  transform: rotate(-10deg);
}

.s-7 .drawn-path,
.s-7 .fade-cycle {
  animation-delay: 1.1s;
  animation-duration: 7.8s;
}

.s-8 {
  top: 65%;
  left: 42%;
  transform: rotate(15deg);
}

.s-8 .drawn-path,
.s-8 .fade-cycle {
  animation-delay: 3.5s;
  animation-duration: 9.2s;
}

.s-9 {
  top: 80%;
  left: 55%;
  transform: rotate(-20deg);
}

.s-9 .drawn-path,
.s-9 .fade-cycle {
  animation-delay: 0.5s;
  animation-duration: 8.2s;
}

.s-10 {
  top: 25%;
  left: 58%;
  transform: rotate(8deg);
}

.s-10 .drawn-path,
.s-10 .fade-cycle {
  animation-delay: 2.8s;
  animation-duration: 7.3s;
}

.s-11 {
  top: 10%;
  left: 72%;
  transform: rotate(-12deg);
}

.s-11 .drawn-path,
.s-11 .fade-cycle {
  animation-delay: 4.5s;
  animation-duration: 8.8s;
}

.s-12 {
  top: 50%;
  left: 78%;
  transform: rotate(18deg);
}

.s-12 .drawn-path,
.s-12 .fade-cycle {
  animation-delay: 1.8s;
  animation-duration: 7.6s;
}

.s-13 {
  top: 85%;
  left: 82%;
  transform: rotate(-5deg);
}

.s-13 .drawn-path,
.s-13 .fade-cycle {
  animation-delay: 3.9s;
  animation-duration: 9.1s;
}

.s-14 {
  top: 20%;
  left: 90%;
  transform: rotate(12deg);
}

.s-14 .drawn-path,
.s-14 .fade-cycle {
  animation-delay: 0.1s;
  animation-duration: 8.5s;
}

.s-15 {
  top: 65%;
  left: 94%;
  transform: rotate(-18deg);
}

.s-15 .drawn-path,
.s-15 .fade-cycle {
  animation-delay: 2.2s;
  animation-duration: 7.9s;
}

.bounce-transition-enter-active {
  animation: bounceIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.bounce-transition-leave-active {
  position: absolute;
  animation: bounceOut 0.3s cubic-bezier(0.8, 0.2, 1, 0.2) forwards;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: translateY(-60px);
  }

  60% {
    opacity: 1;
    transform: translateY(15px);
  }

  80% {
    transform: translateY(-5px);
  }

  100% {
    transform: translateY(0);
  }
}

@keyframes bounceOut {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  30% {
    opacity: 1;
    transform: translateY(-20px) scale(1.02);
  }

  100% {
    opacity: 0;
    transform: translateY(100vh) scale(0.9);
  }
}

footer {
  margin-top: auto;
  text-align: center;
  padding: 1rem;
}
</style>
