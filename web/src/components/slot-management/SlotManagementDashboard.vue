<template>
  <div class="slot-management-dashboard">
    <div class="view-toggle">
      <button 
        :class="{ active: currentView === 'calendar' }"
        @click="currentView = 'calendar'"
      >
        Calendar View
      </button>
      <button 
        :class="{ active: currentView === 'table' }"
        @click="currentView = 'table'"
      >
        Table View
      </button>
    </div>

    <div class="view-container">
      <CalendarView
        v-if="currentView === 'calendar'"
        :slots="slotStore.slots"
        :regions="slotStore.regions"
        @add-slot="showAddModal"
        @edit-slot="showEditModal"
        @delete-slot="handleDeleteSlot"
        @block-day="showBlockDateModal"
      />
      <TableView
        v-else
        :slots="slotStore.slots"
        :regions="slotStore.regions"
        @edit-slot="showEditModal"
        @delete-slot="handleDeleteSlot"
      />
    </div>

    <SlotEditModal
      v-if="showEditModal"
      :slot="selectedSlot"
      :regions="slotStore.regions"
      @close="showEditModal = false"
      @save="handleSaveSlot"
    />

    <BulkAddModal
      v-if="showBulkAddModal"
      :regions="slotStore.regions"
      @close="showBulkAddModal = false"
      @save="handleBulkAdd"
    />

    <BlockDatesModal
      v-if="showBlockDateModal"
      :date="selectedDate"
      @close="showBlockDateModal = false"
      @save="handleBlockDate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSlotStore } from '../../stores/slotStore';
import CalendarView from './CalendarView.vue';
import TableView from './TableView.vue';
import SlotEditModal from './SlotEditModal.vue';
import BulkAddModal from './BulkAddModal.vue';
import BlockDatesModal from './BlockDatesModal.vue';

const slotStore = useSlotStore();
const currentView = ref('calendar');
const showAddModal = ref(false);
const showEditModal = ref(false);
const showBulkAddModal = ref(false);
const showBlockDateModal = ref(false);
const selectedSlot = ref(null);
const selectedDate = ref(null);

onMounted(async () => {
  try {
    await slotStore.fetchRegions();
    await slotStore.fetchSlots();
  } catch (error) {
    console.error('Error loading data:', error);
  }
});

const handleSaveSlot = async (slotData) => {
  try {
    if (slotData.id) {
      await slotStore.updateSlot(slotData.id, slotData);
    } else {
      await slotStore.addSlot(slotData);
    }
    showEditModal.value = false;
  } catch (error) {
    console.error('Error saving slot:', error);
  }
};

const handleBulkAdd = async (slotsData) => {
  try {
    await slotStore.bulkAddSlots(slotsData);
    showBulkAddModal.value = false;
  } catch (error) {
    console.error('Error adding slots:', error);
  }
};

const handleDeleteSlot = async (slot) => {
  try {
    await slotStore.deleteSlot(slot.id);
  } catch (error) {
    console.error('Error deleting slot:', error);
  }
};

const handleBlockDate = async (dateData) => {
  try {
    await slotStore.blockDate(dateData.date, dateData.reason);
    showBlockDateModal.value = false;
  } catch (error) {
    console.error('Error blocking date:', error);
  }
};
</script>

<style scoped>
.slot-management-dashboard {
  padding: 1rem;
}

.view-toggle {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.view-toggle button {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
}

.view-toggle button.active {
  background: #4299e1;
  color: white;
  border-color: #4299e1;
}

.view-container {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
</style> 