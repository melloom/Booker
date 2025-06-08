<template>
  <div class="time-slot-management">
    <div class="page-header">
      <h1>Time Slot Management</h1>
      <p class="subtitle">Manage available time slots and bookings</p>
    </div>

    <div class="content">
      <TimeSlotManager />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import TimeSlotManager from '@/components/TimeSlotManager.vue'
import { useTimeSlotStore } from '@/stores/timeSlotStore'

const timeSlotStore = useTimeSlotStore()
let unsubscribe = null

onMounted(() => {
  unsubscribe = timeSlotStore.initializeListener()
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style scoped>
.time-slot-management {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2rem;
  color: #333;
  margin: 0;
}

.subtitle {
  color: #666;
  margin: 5px 0 0;
}

.content {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
}
</style> 