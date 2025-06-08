<template>
  <div class="slot-management-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <h1>Slot Management</h1>
      <div class="view-toggle">
        <button 
          :class="['btn', { active: view === 'calendar' }]"
          @click="view = 'calendar'"
        >
          <i class="fas fa-calendar-alt"></i> Calendar
        </button>
        <button 
          :class="['btn', { active: view === 'table' }]"
          @click="view = 'table'"
        >
          <i class="fas fa-table"></i> Table
        </button>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <button @click="showBulkAddModal = true" class="btn btn-primary">
        <i class="fas fa-plus"></i> Bulk Add Slots
      </button>
      <button @click="showBlockDatesModal = true" class="btn btn-secondary">
        <i class="fas fa-ban"></i> Block Dates
      </button>
    </div>

    <!-- Main Content -->
    <div class="dashboard-content">
      <CalendarView
        v-if="view === 'calendar'"
        :slots="slots"
        :regions="regions"
        @add="handleAddSlot"
        @edit="handleEditSlot"
        @delete="handleDeleteSlot"
        @block="handleBlockDates"
      />
      <TableView
        v-else
        :slots="slots"
        :regions="regions"
        @edit="handleEditSlot"
        @delete="handleDeleteSlot"
      />
    </div>

    <!-- Modals -->
    <SlotEditModal
      v-if="showEditModal"
      :show="showEditModal"
      :slot="selectedSlot"
      :regions="regions"
      @close="showEditModal = false"
      @submit="handleSlotSubmit"
    />

    <BulkAddModal
      v-if="showBulkAddModal"
      :show="showBulkAddModal"
      :regions="regions"
      @close="showBulkAddModal = false"
      @submit="handleBulkAdd"
    />

    <BlockDatesModal
      v-if="showBlockDatesModal"
      :show="showBlockDatesModal"
      :regions="regions"
      @close="showBlockDatesModal = false"
      @submit="handleBlockDatesSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSlotStore } from '@/stores/slotStore'
import CalendarView from '@/components/slot-management/CalendarView.vue'
import TableView from '@/components/slot-management/TableView.vue'
import SlotEditModal from '@/components/slot-management/SlotEditModal.vue'
import BulkAddModal from '@/components/slot-management/BulkAddModal.vue'
import BlockDatesModal from '@/components/slot-management/BlockDatesModal.vue'

// State
const view = ref('calendar')
const showEditModal = ref(false)
const showBulkAddModal = ref(false)
const showBlockDatesModal = ref(false)
const selectedSlot = ref(null)

// Store
const slotStore = useSlotStore()

// Computed
const slots = computed(() => slotStore.slots)
const regions = computed(() => slotStore.regions)

// Methods
const handleAddSlot = (date) => {
  selectedSlot.value = { date, action: 'add' }
  showEditModal.value = true
}

const handleEditSlot = (slot) => {
  selectedSlot.value = slot
  showEditModal.value = true
}

const handleDeleteSlot = async (slotId) => {
  if (confirm('Are you sure you want to delete this slot?')) {
    try {
      await slotStore.deleteSlot(slotId)
    } catch (error) {
      console.error('Error deleting slot:', error)
      alert('Failed to delete slot. Please try again.')
    }
  }
}

const handleSlotSubmit = async (slotData) => {
  try {
    if (slotData.id) {
      await slotStore.updateSlot(slotData)
    } else {
      await slotStore.addSlot(slotData)
    }
    showEditModal.value = false
  } catch (error) {
    console.error('Error saving slot:', error)
    alert('Failed to save slot. Please try again.')
  }
}

const handleBulkAdd = async (slotsData) => {
  try {
    await slotStore.bulkAddSlots(slotsData)
    showBulkAddModal.value = false
  } catch (error) {
    console.error('Error adding slots:', error)
    alert('Failed to add slots. Please try again.')
  }
}

const handleBlockDates = (date) => {
  selectedSlot.value = { date, action: 'block' }
  showBlockDatesModal.value = true
}

const handleBlockDatesSubmit = async (blockData) => {
  try {
    await slotStore.blockDates(blockData)
    showBlockDatesModal.value = false
  } catch (error) {
    console.error('Error blocking dates:', error)
    alert('Failed to block dates. Please try again.')
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      slotStore.fetchSlots(),
      slotStore.fetchRegions()
    ]);
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Failed to load data. Please refresh the page.');
  }
});
</script>

<style scoped>
.slot-management-dashboard {
  padding: 2rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-header h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: #2d3748;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

.view-toggle .btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #e2e8f0;
  color: #4a5568;
  border: none;
}

.view-toggle .btn.active {
  background: #4299e1;
  color: white;
}

.quick-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #4299e1;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #3182ce;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
  border: none;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.dashboard-content {
  flex: 1;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
</style> 