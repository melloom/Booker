<template>
  <div v-if="show" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Bulk Add Time Slots</h2>
        <button class="close-button" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="startDate">Start Date</label>
          <input 
            type="date" 
            id="startDate" 
            v-model="formData.startDate"
            :min="minDate"
            required
          >
        </div>

        <div class="form-group">
          <label for="endDate">End Date</label>
          <input 
            type="date" 
            id="endDate" 
            v-model="formData.endDate"
            :min="formData.startDate"
            required
          >
        </div>

        <div class="form-group">
          <label>Days of Week</label>
          <div class="weekdays-grid">
            <label 
              v-for="day in weekDays" 
              :key="day.value"
              class="weekday-checkbox"
            >
              <input 
                type="checkbox" 
                v-model="formData.selectedDays" 
                :value="day.value"
              >
              {{ day.label }}
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="startTime">Start Time</label>
          <input 
            type="time" 
            id="startTime" 
            v-model="formData.startTime"
            required
          >
        </div>

        <div class="form-group">
          <label for="endTime">End Time</label>
          <input 
            type="time" 
            id="endTime" 
            v-model="formData.endTime"
            required
          >
        </div>

        <div class="form-group">
          <label for="duration">Slot Duration (minutes)</label>
          <input 
            type="number" 
            id="duration" 
            v-model="formData.duration"
            min="15"
            step="15"
            required
          >
        </div>

        <div class="form-group">
          <label for="breakDuration">Break Between Slots (minutes)</label>
          <input 
            type="number" 
            id="breakDuration" 
            v-model="formData.breakDuration"
            min="0"
            step="5"
            required
          >
        </div>

        <div class="form-group">
          <label for="region">Region</label>
          <select 
            id="region" 
            v-model="formData.region"
            required
          >
            <option value="">Select a region</option>
            <option 
              v-for="region in regions" 
              :key="region.id" 
              :value="region.id"
            >
              {{ region.name }}
            </option>
          </select>
        </div>

        <div class="summary">
          <p>Total slots to be created: {{ totalSlots }}</p>
          <p>Date range: {{ formatDate(formData.startDate) }} to {{ formatDate(formData.endDate) }}</p>
          <p>Selected days: {{ selectedDaysLabel }}</p>
        </div>

        <div class="error-message" v-if="error">
          {{ error }}
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading || totalSlots === 0">
            Add {{ totalSlots }} Slots
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { format, parseISO, eachDayOfInterval, isSameDay } from 'date-fns';

const props = defineProps({
  show: Boolean,
  regions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'submit']);

const loading = ref(false);
const error = ref('');

const weekDays = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const formData = ref({
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: format(new Date(), 'yyyy-MM-dd'),
  selectedDays: [1, 2, 3, 4, 5], // Default to weekdays
  startTime: '09:00',
  endTime: '17:00',
  duration: 30,
  breakDuration: 0,
  region: ''
});

// Set minimum date to today
const minDate = computed(() => {
  return format(new Date(), 'yyyy-MM-dd');
});

const totalSlots = computed(() => {
  if (!formData.value.startDate || !formData.value.endDate) return 0;

  const start = parseISO(formData.value.startDate);
  const end = parseISO(formData.value.endDate);
  const days = eachDayOfInterval({ start, end });
  
  const validDays = days.filter(day => 
    formData.value.selectedDays.includes(day.getDay())
  );

  const startTime = parseISO(`${formData.value.startDate}T${formData.value.startTime}`);
  const endTime = parseISO(`${formData.value.startDate}T${formData.value.endTime}`);
  const totalMinutes = (endTime - startTime) / (1000 * 60);
  const slotsPerDay = Math.floor(totalMinutes / (formData.value.duration + formData.value.breakDuration));

  return validDays.length * slotsPerDay;
});

const selectedDaysLabel = computed(() => {
  if (formData.value.selectedDays.length === 7) return 'All days';
  if (formData.value.selectedDays.length === 0) return 'No days selected';
  
  return formData.value.selectedDays
    .map(day => weekDays.find(d => d.value === day)?.label)
    .join(', ');
});

const formatDate = (date) => {
  return format(parseISO(date), 'MMM d, yyyy');
};

const validateForm = () => {
  error.value = '';

  if (!formData.value.startDate || !formData.value.endDate) {
    error.value = 'Start and end dates are required';
    return false;
  }

  if (!formData.value.startTime || !formData.value.endTime) {
    error.value = 'Start and end times are required';
    return false;
  }

  if (!formData.value.region) {
    error.value = 'Region is required';
    return false;
  }

  if (formData.value.selectedDays.length === 0) {
    error.value = 'At least one day must be selected';
    return false;
  }

  const startTime = parseISO(`${formData.value.startDate}T${formData.value.startTime}`);
  const endTime = parseISO(`${formData.value.startDate}T${formData.value.endTime}`);

  if (startTime >= endTime) {
    error.value = 'End time must be after start time';
    return false;
  }

  if (formData.value.duration < 15) {
    error.value = 'Slot duration must be at least 15 minutes';
    return false;
  }

  return true;
};

const generateSlots = () => {
  const slots = [];
  const start = parseISO(formData.value.startDate);
  const end = parseISO(formData.value.endDate);
  const days = eachDayOfInterval({ start, end });

  days.forEach(day => {
    if (formData.value.selectedDays.includes(day.getDay())) {
      let currentTime = parseISO(`${format(day, 'yyyy-MM-dd')}T${formData.value.startTime}`);
      const endTime = parseISO(`${format(day, 'yyyy-MM-dd')}T${formData.value.endTime}`);

      while (currentTime < endTime) {
        const slotEndTime = new Date(currentTime.getTime() + formData.value.duration * 60000);
        if (slotEndTime > endTime) break;

        slots.push({
          date: format(day, 'yyyy-MM-dd'),
          startTime: format(currentTime, 'HH:mm'),
          endTime: format(slotEndTime, 'HH:mm'),
          region: formData.value.region,
          status: 'available'
        });

        currentTime = new Date(slotEndTime.getTime() + formData.value.breakDuration * 60000);
      }
    }
  });

  return slots;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;
  error.value = '';

  try {
    const slots = generateSlots();
    emit('submit', slots);
  } catch (err) {
    error.value = err.message || 'Failed to generate slots';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a202c;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #718096;
  cursor: pointer;
  padding: 0.5rem;
}

.modal-body {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 1rem;
}

.weekdays-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.weekday-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.summary {
  background: #f7fafc;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.summary p {
  margin: 0.5rem 0;
  color: #4a5568;
}

.error-message {
  color: #e53e3e;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4299e1;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #3182ce;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
  border: none;
}

.btn-secondary:hover {
  background: #cbd5e0;
}
</style> 