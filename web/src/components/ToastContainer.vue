<script setup>
import { dismissToast, toasts } from '../notifications.js';
</script>

<template>
  <div class="toast-container" aria-live="polite">
    <div v-for="toast in toasts" :key="toast.id" class="toast" role="status">
      <span>{{ toast.message }}</span>
      <button type="button" aria-label="Dismiss notification" @click="dismissToast(toast.id)">×</button>
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 22rem;
}
.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: #1f2937;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
.toast button {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
}
</style>