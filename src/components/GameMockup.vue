<script setup>

import { ref } from 'vue';

//reactive state variables (update on the page automatically when changed)
const score = ref(0);
const hasAnswered = ref(false);
const feedBack = ref('');


//mock question data
const question = ref({
  prompt: 'What is the capital of France?',
  options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
  answer: 'Paris'
});


//method to handle the answer selection

function selectAnswer(index) {
  if (hasAnswered.value) return; // prevent multiple answers
  hasAnswered.value = true;

  if (question.value.options[index] === question.value.answer) {
    score.value += 100;
    feedBack.value = 'Correct!';
  } else {
    feedBack.value = 'Incorrect! The right answer was "' + question.value.answer + '".';
  }
}

</script>

<template>
<div class="game-board">

    <header>
        <h2>Project Huh!?</h2>
        <p>Score: {{ score }}</p>
    </header>

    <h1 class="prompt">{{ question.prompt }}</h1>

    <!-- v-if is a directive in vue that only renders the element if the condition is true. -->
    <div v-if="hasAnswered" class="feedback-banner"> 
        <h2>{{ feedBack }}</h2>

        <!-- "In Vue.js, @click is a shorthand syntax for the v-on:click directive" -->
        <button @click="hasAnswered = false;">Next Question (placeholder)</button>
    </div>

    <div class="buzzer-grid">
        <!-- 
        "The v-for directive in Vue.js is a built-in template attribute used to 
        render a list of items by iterating over an array, an object, or a range of numbers."
        -->
        <button v-for="(option, index) in question.options" 
        :key="index" 
        @click="selectAnswer(index)">
        {{ option }}
        </button>
    </div>
</div>
</template>

<style lang="css" scoped>
/* Left empty for now, but here goes component-specific styling. */
</style>