<template>
  <div class="scheduler">
    <header class="scheduler-header">
      <h1>Scheduler</h1>
      <div class="header-actions">
        <span class="user-email">{{ currentUser?.email }}</span>
        <button @click="handleLogout" class="secondary-btn">Logout</button>
      </div>
    </header>

    <div class="scheduler-content">
      <div class="calendar-section">
        <Calendar 
          v-model="selectedDate"
          @day-click="handleDateSelected"
        />
      </div>
      <div class="time-slots-section">
        <TimeSlotsSection 
          :selected-date="selectedDate"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Calendar from './Calendar.vue';
import TimeSlotsSection from './TimeSlotsSection.vue';

const router = useRouter();
const currentUser = ref(null);
const selectedDate = ref(new Date());

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser.value = user;
    } else {
      router.push('/');
    }
  });
});

const handleDateSelected = (date) => {
  selectedDate.value = date;
};

const handleLogout = async () => {
  try {
    await signOut(auth);
    router.push('/');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
</script>

<style scoped>
.scheduler {
  min-height: 100vh;
  background-color: #f8fafc;
}

.scheduler-header {
  background-color: white;
  padding: 1rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.scheduler-header h1 {
  margin: 0;
  color: #1e293b;
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-email {
  color: #64748b;
}

.secondary-btn {
  padding: 0.5rem 1rem;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background-color: #e2e8f0;
}

.scheduler-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .scheduler-content {
    grid-template-columns: 1fr;
  }
}
</style> 