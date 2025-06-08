<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Block Dates</h2>
        <button class="close-btn" @click="$emit('close')">
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
            required
          >
        </div>

        <div class="form-group">
          <label for="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            v-model="formData.endDate"
            required
          >
        </div>

        <div class="form-group">
          <label>Days of Week</label>
          <div class="weekday-checkboxes">
            <label v-for="day in weekDays" :key="day.value" class="checkbox-label">
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
          <label for="reason">Reason (optional)</label>
          <textarea
            id="reason"
            v-model="formData.reason"
            rows="3"
            placeholder="Enter reason for blocking these dates..."
          ></textarea>
        </div>

        <div class="preview-section">
          <h3>Preview</h3>
          <div class="preview-info">
            <p>Date range: {{ formatDate(formData.startDate) }} - {{ formatDate(formData.endDate) }}</p>
            <p>Selected days: {{ selectedDaysLabel }}</p>
            <p v-if="formData.reason">Reason: {{ formData.reason }}</p>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="cancel-btn" @click="$emit('close')">
            Cancel
          </button>
          <button type="submit" class="submit-btn">
            Block Dates
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { format, parseISO } from 'date-fns';

export default {
  name: 'BlockDatesModal',
  emits: ['close', 'block-dates'],
  setup(props, { emit }) {
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
      selectedDays: [0, 1, 2, 3, 4, 5, 6], // Default to all days
      reason: ''
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

    const handleSubmit = () => {
      const dateRange = {
        start: parseISO(formData.value.startDate),
        end: parseISO(formData.value.endDate),
        selectedDays: formData.value.selectedDays,
        reason: formData.value.reason
      };
      emit('block-dates', dateRange);
    };

    return {
      formData,
      weekDays,
      selectedDaysLabel,
      formatDate,
      handleSubmit
    };
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4b5563;
  font-weight: 500;
}

input,
textarea,
select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 1rem;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.weekday-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

.preview-section {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  margin: 1.5rem 0;
}

.preview-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #4b5563;
}

.preview-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.preview-info p {
  margin: 0.25rem 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  color: #4b5563;
  cursor: pointer;
}

.submit-btn {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  border: none;
  border-radius: 0.375rem;
  color: white;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #f9fafb;
}

.submit-btn:hover {
  background: #2563eb;
}
</style> 