import { ref } from 'vue';

// The toasts currently on screen. `ref` makes Vue redraw whenever this changes.
export const toasts = ref([]);

let nextId = 1;
let source = null;

export function dismissToast(id) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
}

export function showToast(message, duration = 5000) {
  const id = nextId;
  nextId += 1;
  toasts.value.push({ id, message });
  setTimeout(() => dismissToast(id), duration);
}

function readData(messageEvent) {
  try {
    return JSON.parse(messageEvent.data);
  } catch {
    return null;
  }
}

export function connectNotifications(EventSourceClass = EventSource) {
  if (source) return; // already connected: never open a second line

  source = new EventSourceClass('/api/notifications/stream');

  source.addEventListener('event-created', (messageEvent) => {
    const data = readData(messageEvent);
    if (data) showToast(`New event: ${data.title}`);
  });

  source.addEventListener('registration-created', (messageEvent) => {
    const data = readData(messageEvent);
    if (data) showToast(`New registration for: ${data.title}`);
  });
}

export function disconnectNotifications() {
  if (source) source.close();
  source = null;
}