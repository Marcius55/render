<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { onBeforeUnmount, onMounted } from 'vue';
import ToastContainer from './components/ToastContainer.vue';
import { connectNotifications, disconnectNotifications } from './notifications.js';

onMounted(() => connectNotifications());
onBeforeUnmount(() => disconnectNotifications());
</script>

<template>
  <header class="site-header">
    <RouterLink to="/" class="brand">Campus Events</RouterLink>
    <nav>
      <RouterLink to="/">Events</RouterLink>
      <RouterLink to="/stats">Occupancy</RouterLink>
      <RouterLink to="/events/new" class="button button--small">New event</RouterLink>
    </nav>
  </header>
  <main class="page">
    <RouterView />
  </main>

  <ToastContainer />
</template>
