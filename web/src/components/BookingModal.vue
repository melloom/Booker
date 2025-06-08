<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Confirm Booking</h3>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-body">
        <div v-if="bookingDetails" class="booking-details">
          <div class="detail-row">
            <span class="label">Region:</span>
            <span class="value">{{ bookingDetails.region }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Product:</span>
            <span class="value">{{ bookingDetails.product }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Date:</span>
            <span class="value">{{ formatDate(bookingDetails.date) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Time:</span>
            <span class="value">{{ bookingDetails.time }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Duration:</span>
            <span class="value">{{ bookingDetails.duration }} minutes</span>
          </div>
          
          <div class="notes-section">
            <label for="notes">Additional Notes (optional):</label>
            <textarea 
              id="notes" 
              v-model="notes" 
              rows="3" 
              placeholder="Add any additional information..."
            ></textarea>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">Cancel</button>
        <button 
          class="confirm-button" 
          @click="confirmBooking"
          :disabled="loading"
        >
          {{ loading ? 'Confirming...' : 'Confirm Booking' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  bookingDetails: {
    type: Object,
    required: true,
    default: () => ({
      region: '',
      product: '',
      date: new Date(),
      time: '',
      duration: 0,
      slotId: '',
      availableSlots: 0
    })
  }
});

const emit = defineEmits(['close', 'confirm']);

const notes = ref('');
const loading = ref(false);

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const handleOverlayClick = (event) => {
  if (event.target === event.currentTarget) {
    emit('close');
  }
};

const confirmBooking = async () => {
  loading.value = true;
  try {
    await emit('confirm', {
      ...props.bookingDetails,
      notes: notes.value
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
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
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
}

.modal-body {
  padding: 1rem;
}

.booking-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-weight: 500;
  color: #4b5563;
}

.value {
  color: #1f2937;
}

.notes-section {
  margin-top: 1rem;
}

.notes-section label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4b5563;
}

textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  resize: vertical;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-button {
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-button {
  padding: 0.5rem 1rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.cancel-button:hover {
  background-color: #e5e7eb;
}

.confirm-button:hover:not(:disabled) {
  background-color: #357abd;
}
</style> 