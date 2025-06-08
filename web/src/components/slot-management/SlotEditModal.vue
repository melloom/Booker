<template>
  <div v-if="show" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isEditing ? 'Edit Time Slot' : 'Add Time Slot' }}</h2>
        <button class="close-button" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="date">Date</label>
          <input 
            type="date" 
            id="date" 
            v-model="formData.date"
            :min="minDate"
            required
          >
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

        <div class="form-group">
          <label for="status">Status</label>
          <select 
            id="status" 
            v-model="formData.status"
            required
          >
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div v-if="formData.status === 'booked'" class="form-group">
          <label for="bookedBy">Booked By</label>
          <input 
            type="text" 
            id="bookedBy" 
            v-model="formData.bookedBy"
            required
          >
        </div>

        <div v-if="formData.status === 'blocked'" class="form-group">
          <label for="blockReason">Block Reason</label>
          <textarea 
            id="blockReason" 
            v-model="formData.blockReason"
            required
          ></textarea>
        </div>

        <div class="error-message" v-if="error">
          {{ error }}
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ isEditing ? 'Update' : 'Add' }} Slot
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { format, parse, isValid } from 'date-fns';

const props = defineProps({
  show: Boolean,
  slot: {
    type: Object,
    default: () => ({})
  },
  regions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'submit']);

const loading = ref(false);
const error = ref('');

const isEditing = computed(() => !!props.slot.id);

const formData = ref({
  date: '',
  startTime: '',
  endTime: '',
  region: '',
  status: 'available',
  bookedBy: '',
  blockReason: ''
});

// Set minimum date to today
const minDate = computed(() => {
  return format(new Date(), 'yyyy-MM-dd');
});

// Watch for slot changes to populate form
watch(() => props.slot, (newSlot) => {
  if (newSlot.id) {
    formData.value = {
      date: format(new Date(newSlot.date), 'yyyy-MM-dd'),
      startTime: format(new Date(newSlot.startTime), 'HH:mm'),
      endTime: format(new Date(newSlot.endTime), 'HH:mm'),
      region: newSlot.region,
      status: newSlot.status,
      bookedBy: newSlot.bookedBy || '',
      blockReason: newSlot.blockReason || ''
    };
  } else {
    formData.value = {
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '',
      endTime: '',
      region: '',
      status: 'available',
      bookedBy: '',
      blockReason: ''
    };
  }
}, { immediate: true });

const validateForm = () => {
  error.value = '';

  if (!formData.value.date) {
    error.value = 'Date is required';
    return false;
  }

  if (!formData.value.startTime) {
    error.value = 'Start time is required';
    return false;
  }

  if (!formData.value.endTime) {
    error.value = 'End time is required';
    return false;
  }

  if (!formData.value.region) {
    error.value = 'Region is required';
    return false;
  }

  if (formData.value.status === 'booked' && !formData.value.bookedBy) {
    error.value = 'Booked by is required for booked slots';
    return false;
  }

  if (formData.value.status === 'blocked' && !formData.value.blockReason) {
    error.value = 'Block reason is required for blocked slots';
    return false;
  }

  const startTime = parse(formData.value.startTime, 'HH:mm', new Date());
  const endTime = parse(formData.value.endTime, 'HH:mm', new Date());

  if (startTime >= endTime) {
    error.value = 'End time must be after start time';
    return false;
  }

  return true;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;
  error.value = '';

  try {
    const slotData = {
      date: formData.value.date,
      startTime: formData.value.startTime,
      endTime: formData.value.endTime,
      region: formData.value.region,
      status: formData.value.status,
      ...(formData.value.status === 'booked' && { bookedBy: formData.value.bookedBy }),
      ...(formData.value.status === 'blocked' && { blockReason: formData.value.blockReason })
    };

    if (isEditing.value) {
      slotData.id = props.slot.id;
    }

    emit('submit', slotData);
  } catch (err) {
    error.value = err.message || 'Failed to save slot';
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
  max-width: 500px;
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
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
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