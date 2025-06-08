<template>
  <div class="time-slot-manager">
    <div class="manager-header">
      <h2>Time Slot Management</h2>
      <div class="action-buttons">
        <button @click="openAddSlotModal" class="btn btn-primary">
          <i class="fas fa-plus"></i> Add Slot
        </button>
        <button @click="openBulkEditModal" class="btn btn-secondary">
          <i class="fas fa-edit"></i> Bulk Edit
        </button>
        <button @click="openBlockTimeModal" class="btn btn-warning">
          <i class="fas fa-ban"></i> Block Time
        </button>
        <button @click="exportSlots" class="btn btn-info">
          <i class="fas fa-download"></i> Export
        </button>
      </div>
    </div>

    <div class="manager-content">
      <div class="calendar-section">
        <Calendar
          v-model="selectedDate"
          :slots="slots"
          :regions="regions"
          @day-click="handleDayClick"
          @add-slot="handleAddSlot"
          @edit-slot="handleEditSlot"
          @delete-slot="handleDeleteSlot"
          @block-day="handleBlockDay"
        />
      </div>
      <div class="slots-section">
        <h3>Slots for {{ formatDate(selectedDate) }}</h3>
        <div class="slots-list">
          <div v-for="slot in daySlots" :key="slot.id" class="slot-item">
            <div class="slot-time">{{ formatTime(slot.startTime) }}</div>
            <div class="slot-details">
              <span :class="['status-badge', slot.status]">{{ slot.status }}</span>
              <span v-if="slot.bookedBy">Booked by: {{ slot.bookedBy }}</span>
            </div>
            <div class="slot-actions">
              <button @click="editSlot(slot)" class="btn btn-sm btn-edit">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="deleteSlot(slot)" class="btn btn-sm btn-delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <button @click="openAddSlotModal" class="btn btn-add-slot">
            <i class="fas fa-plus"></i> Add New Slot
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Slot Modal -->
    <Modal v-if="showSlotModal" @close="closeSlotModal">
      <template #header>
        <h3>{{ isEditing ? 'Edit Slot' : 'Add New Slot' }}</h3>
      </template>
      <template #default>
        <form @submit.prevent="saveSlot" class="slot-form">
          <div class="form-group">
            <label>Date</label>
            <input type="date" v-model="slotForm.date" required>
          </div>
          <div class="form-group">
            <label>Start Time</label>
            <input type="time" v-model="slotForm.startTime" required>
          </div>
          <div class="form-group">
            <label>End Time</label>
            <input type="time" v-model="slotForm.endTime" required>
          </div>
          <div class="form-group">
            <label>Capacity</label>
            <input type="number" v-model="slotForm.capacity" min="1" required>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="slotForm.status">
              <option value="available">Available</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Save</button>
            <button type="button" @click="closeSlotModal" class="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </template>
    </Modal>

    <!-- Bulk Edit Modal -->
    <Modal v-if="showBulkEditModal" @close="closeBulkEditModal">
      <template #header>
        <h3>Bulk Edit Slots</h3>
      </template>
      <template #default>
        <form @submit.prevent="saveBulkEdit" class="bulk-edit-form">
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" v-model="bulkEditForm.startDate" required>
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="date" v-model="bulkEditForm.endDate" required>
          </div>
          <div class="form-group">
            <label>Time Range</label>
            <div class="time-range">
              <input type="time" v-model="bulkEditForm.startTime" required>
              <span>to</span>
              <input type="time" v-model="bulkEditForm.endTime" required>
            </div>
          </div>
          <div class="form-group">
            <label>Action</label>
            <select v-model="bulkEditForm.action">
              <option value="add">Add Slots</option>
              <option value="block">Block Time</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Apply</button>
            <button type="button" @click="closeBulkEditModal" class="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import { useTimeSlotStore } from '@/stores/timeSlotStore'
import Calendar from './Calendar.vue'
import Modal from './Modal.vue'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { useSlotStore } from '@/stores/slotStore'

const timeSlotStore = useTimeSlotStore()
const slotStore = useSlotStore()
const selectedDate = ref(new Date())
const showSlotModal = ref(false)
const showBulkEditModal = ref(false)
const isEditing = ref(false)
const slots = computed(() => slotStore.slots)
const regions = ref([])

const slotForm = ref({
  date: '',
  startTime: '',
  endTime: '',
  capacity: 1,
  status: 'available'
})

const bulkEditForm = ref({
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  action: 'add'
})

const daySlots = computed(() => {
  return timeSlotStore.getSlotsForDate(selectedDate.value)
})

const calendarEvents = computed(() => {
  return timeSlotStore.getAllSlots().map(slot => {
    const startDate = new Date(slot.date)
    const [startHours, startMinutes] = slot.startTime.split(':')
    const [endHours, endMinutes] = slot.endTime.split(':')
    
    startDate.setHours(parseInt(startHours), parseInt(startMinutes))
    const endDate = new Date(startDate)
    endDate.setHours(parseInt(endHours), parseInt(endMinutes))

    return {
      id: slot.id,
      title: `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      status: slot.status,
      extendedProps: {
        capacity: slot.capacity,
        bookedBy: slot.bookedBy
      }
    }
  })
})

function formatDate(date) {
  return format(date, 'MMMM d, yyyy')
}

function formatTime(time) {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  return format(date, 'h:mm a')
}

function handleDayClick(date) {
  selectedDate.value = date
}

function openAddSlotModal() {
  isEditing.value = false
  slotForm.value = {
    date: format(selectedDate.value, 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    capacity: 1,
    status: 'available'
  }
  showSlotModal.value = true
}

function editSlot(slot) {
  isEditing.value = true
  slotForm.value = { ...slot }
  showSlotModal.value = true
}

async function saveSlot() {
  try {
    if (isEditing.value) {
      await timeSlotStore.updateSlot(slotForm.value.id, slotForm.value)
      toast.success('Slot updated successfully')
    } else {
      await timeSlotStore.addSlot(slotForm.value)
      toast.success('Slot added successfully')
    }
    closeSlotModal()
  } catch (error) {
    console.error('Error saving slot:', error)
    toast.error('Error saving slot')
  }
}

async function deleteSlot(slot) {
  if (confirm('Are you sure you want to delete this slot?')) {
    try {
      await timeSlotStore.deleteSlot(slot.id)
      toast.success('Slot deleted successfully')
    } catch (error) {
      console.error('Error deleting slot:', error)
      toast.error('Error deleting slot')
    }
  }
}

function openBulkEditModal() {
  bulkEditForm.value = {
    startDate: format(selectedDate.value, 'yyyy-MM-dd'),
    endDate: format(selectedDate.value, 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    action: 'add'
  }
  showBulkEditModal.value = true
}

async function saveBulkEdit() {
  try {
    await timeSlotStore.bulkEditSlots(bulkEditForm.value)
    toast.success('Bulk edit applied successfully')
    closeBulkEditModal()
  } catch (error) {
    console.error('Error performing bulk edit:', error)
    toast.error('Error applying bulk edit')
  }
}

function closeSlotModal() {
  showSlotModal.value = false
  slotForm.value = {
    date: '',
    startTime: '',
    endTime: '',
    capacity: 1,
    status: 'available'
  }
}

function closeBulkEditModal() {
  showBulkEditModal.value = false
}

function exportSlots() {
  timeSlotStore.exportSlots()
  toast.success('Slots exported successfully')
}

// Initialize real-time updates
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
.time-slot-manager {
  padding: 20px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.manager-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.calendar-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.slots-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.slots-list {
  margin-top: 15px;
}

.slot-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.slot-time {
  width: 100px;
  font-weight: bold;
}

.slot-details {
  flex: 1;
  margin: 0 15px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  margin-right: 10px;
}

.status-badge.available {
  background: #e3f2fd;
  color: #1976d2;
}

.status-badge.blocked {
  background: #ffebee;
  color: #d32f2f;
}

.slot-actions {
  display: flex;
  gap: 5px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-secondary {
  background: #757575;
  color: white;
}

.btn-warning {
  background: #f57c00;
  color: white;
}

.btn-info {
  background: #0288d1;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 0.9em;
}

.btn-edit {
  background: #2196f3;
  color: white;
}

.btn-delete {
  background: #f44336;
  color: white;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .manager-content {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
  
  .btn {
    flex: 1;
    min-width: 120px;
  }
}
</style> 