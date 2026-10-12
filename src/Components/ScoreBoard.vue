<!-- ScoreBoard.vue -->
<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const gameStore = useGameStore()

const sortedPlayers = computed(() => {
  const list = [...gameStore.players]
  return list.sort((a, b) => (b.score || 0) - (a.score || 0))
})

</script>

<template>
  <div class="scoreboard-container">
    <div class="scoreboard-card">
      <h2>Scoreboard</h2>

      <ul class="player-list">
        <li v-for="(player, index) in sortedPlayers" :key="player.id" class="player-item">
          <div class="player-info">
            <span class="rank">#{{ index + 1 }}</span>
            <span class="name">{{ player.name }}</span>
          </div>
          <span class="score">{{ player.score || 0 }} pts</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.scoreboard-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Space Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #f0f0f5;
  color: #1a1a1a;
  padding: 1.5rem;
  box-sizing: border-box;
}

.scoreboard-card {
  background: #ffffff;
  padding: 3rem 2.5rem;
  border: 3px solid #1a1a1a;
  box-shadow: 8px 8px 0px #1a1a1a;
  width: 100%;
  max-width: 500px;
  box-sizing: border-box;
}

h2 {
  font-size: 2.5rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -1px;
  margin-top: 0;
  margin-bottom: 2rem;
  color: #1a1a1a;
  text-shadow: 3px 3px 0px #00f0ff;
  text-align: center;
}

.player-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 3px solid #1a1a1a;
  padding: 15px 20px;
  font-weight: 800;
  font-size: 1.2rem;
  box-shadow: 4px 4px 0px #1a1a1a;
  transition: transform 0.1s ease;
}

.player-item:nth-child(1) {
  background-color: #ffd700;
  /* Gold for 1st place */
}

.player-item:nth-child(2) {
  background-color: #e0e0e0;
  /* Silver for 2nd place */
}

.player-item:nth-child(3) {
  background-color: #ffab91;
  /* Bronze-ish for 3rd place */
}

.player-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.rank {
  font-size: 1.1rem;
  opacity: 0.7;
}

.score {
  font-weight: 900;
  color: #1a1a1a;
}

@media (max-width: 500px) {
  .scoreboard-card {
    padding: 2rem 1.5rem;
  }

  h2 {
    font-size: 2rem;
  }

  .player-item {
    font-size: 1rem;
    padding: 12px 15px;
  }
}
</style>