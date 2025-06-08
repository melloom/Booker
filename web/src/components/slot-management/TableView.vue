<template>
  <div class="table-view">
    <div class="table-header">
      <div class="filters">
        <div class="filter-row">
          <div class="date-range">
            <input 
              type="date" 
              v-model="startDate"
              :max="endDate"
              class="date-input"
            >
            <span>to</span>
            <input 
              type="date" 
              v-model="endDate"
              :min="startDate"
              class="date-input"
            >
          </div>

          <select v-model="statusFilter" class="filter-select">
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="blocked">Blocked</option>
          </select>

          <button @click="clearFilters" class="btn btn-secondary">
            <i class="fas fa-times"></i> Clear Filters
          </button>
        </div>
      </div>
      <button class="add-slot-btn" @click="handleAddSlot">
        <i class="fas fa-plus"></i> Add Slot
      </button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th @click="handleSort('date')" class="sortable">
              Date
              <i :class="getSortIcon('date')"></i>
            </th>
            <th @click="handleSort('startTime')" class="sortable">
              Start Time
              <i :class="getSortIcon('startTime')"></i>
            </th>
            <th @click="handleSort('endTime')" class="sortable">
              End Time
              <i :class="getSortIcon('endTime')"></i>
            </th>
            <th @click="handleSort('region')" class="sortable">
              Region
              <i :class="getSortIcon('region')"></i>
            </th>
            <th @click="handleSort('status')" class="sortable">
              Status
              <i :class="getSortIcon('status')"></i>
            </th>
            <th>Booked By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slot in paginatedSlots" :key="slot.id" :class="slot.status">
            <td>{{ formatDate(slot.date) }}</td>
            <td>{{ formatTime(slot.startTime) }}</td>
            <td>{{ formatTime(slot.endTime) }}</td>
            <td>{{ getRegionName(slot.region) }}</td>
            <td>
              <span class="status-badge" :class="slot.status">
                {{ slot.status }}
              </span>
            </td>
            <td>{{ slot.bookedBy || '-' }}</td>
            <td class="actions">
              <button @click="$emit('edit', slot)" class="btn-icon" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="$emit('delete', slot.id)" class="btn-icon danger" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
          <tr v-if="filteredSlots.length === 0">
            <td colspan="7" class="no-data">
              No slots found matching your filters
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="table-footer">
      <div class="pagination">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="btn btn-secondary"
        >
          Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="btn btn-secondary"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useSlotStore } from '@/stores/slotStore';

const props = defineProps({
  regions: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['edit', 'delete']);

const slotStore = useSlotStore();

const startDate = ref('');
const endDate = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const sortBy = ref('date');
const sortDirection = ref('asc');

const filteredSlots = computed(() => {
  let slots = [...slotStore.slots];

  // Apply date filter
  if (startDate.value && endDate.value) {
    const start = startOfDay(parseISO(startDate.value));
    const end = endOfDay(parseISO(endDate.value));
    slots = slots.filter(slot => 
      isWithinInterval(parseISO(slot.date), { start, end })
    );
  }

  // Apply status filter
  if (statusFilter.value) {
    slots = slots.filter(slot => slot.status === statusFilter.value);
  }

  // Apply sorting
  slots.sort((a, b) => {
    let comparison = 0;
    if (sortBy.value === 'date') {
      comparison = parseISO(a.date) - parseISO(b.date);
    } else if (sortBy.value === 'startTime') {
      comparison = parseISO(a.startTime) - parseISO(b.startTime);
    } else if (sortBy.value === 'endTime') {
      comparison = parseISO(a.endTime) - parseISO(b.endTime);
    } else if (sortBy.value === 'region') {
      comparison = getRegionName(a.region).localeCompare(getRegionName(b.region));
    } else if (sortBy.value === 'status') {
      comparison = a.status.localeCompare(b.status);
    }
    return sortDirection.value === 'asc' ? comparison : -comparison;
  });

  return slots;
});

const totalPages = computed(() => {
  return Math.ceil(filteredSlots.value.length / itemsPerPage.value);
});

const paginatedSlots = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredSlots.value.slice(start, end);
});

const clearFilters = () => {
  startDate.value = '';
  endDate.value = '';
  statusFilter.value = '';
  currentPage.value = 1;
};

const getSortIcon = (column) => {
  if (sortBy.value !== column) return 'fas fa-sort';
  return sortDirection.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
};

const handleSort = (column) => {
  if (sortBy.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = column;
    sortDirection.value = 'asc';
  }
};

const formatDate = (date) => {
  if (!date) return '-';
  return format(parseISO(date), 'MMM d, yyyy');
};

const formatTime = (time) => {
  if (!time) return '-';
  return format(parseISO(time), 'h:mm a');
};

const getRegionName = (regionId) => {
  const region = props.regions.find(r => r.id === regionId);
  return region ? region.name : 'Unknown Region';
};

const handleAddSlot = () => {
  emit('edit', { action: 'add' });
};

// Watch for changes in filters
watch([startDate, endDate, statusFilter], () => {
  currentPage.value = 1;
});

// Initialize
onMounted(async () => {
  try {
    await slotStore.fetchSlots();
  } catch (error) {
    console.error('Error fetching slots:', error);
  }
});
</script>

<style scoped>
.table-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-input {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
  min-width: 150px;
}

.add-slot-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  background: #f8fafc;
  font-weight: 600;
  color: #4a5568;
}

th.sortable {
  cursor: pointer;
  user-select: none;
}

th.sortable:hover {
  background: #edf2f7;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.available {
  background: #c6f6d5;
  color: #2f855a;
}

.status-badge.booked {
  background: #bee3f8;
  color: #2c5282;
}

.status-badge.blocked {
  background: #fed7d7;
  color: #c53030;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  color: #4a5568;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #edf2f7;
}

.btn-icon.danger {
  color: #e53e3e;
}

.btn-icon.danger:hover {
  background: #fed7d7;
}

.no-data {
  text-align: center;
  color: #718096;
  padding: 2rem;
}

.table-footer {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-info {
  color: #4a5568;
  font-size: 0.875rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
  border: none;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style> 