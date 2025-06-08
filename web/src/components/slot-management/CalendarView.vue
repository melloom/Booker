<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <button @click="previousMonth" class="nav-btn">
        <i class="fas fa-chevron-left"></i>
      </button>
      <h2>{{ currentMonthYear }}</h2>
      <button @click="nextMonth" class="nav-btn">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <div class="weekdays">
      <div v-for="day in weekDays" :key="day" class="weekday">
        {{ day }}
      </div>
    </div>

    <div class="calendar-grid">
      <div
        v-for="day in calendarDays"
        :key="day.date"
        :class="[
          'calendar-day',
          { 'other-month': !day.isCurrentMonth },
          { 'today': day.isToday },
          { 'has-slots': day.slots.length > 0 }
        ]"
        @click="handleDayClick(day)"
      >
        <div class="day-number">{{ day.dayNumber }}</div>
        <div class="slot-indicators">
          <div 
            v-if="day.slots.length > 0"
            class="slot-dot"
            :class="getSlotStatusClass(day.slots)"
            :title="getSlotTooltip(day.slots)"
          ></div>
        </div>
        <div class="slot-counts" v-if="day.slots.length > 0">
          <span class="available-count">{{ getAvailableCount(day.slots) }}</span>
          <span class="booked-count">{{ getBookedCount(day.slots) }}</span>
        </div>
      </div>
    </div>

    <div v-if="selectedDay" class="day-details">
      <div class="day-details-header">
        <h3>{{ formatDate(selectedDay.date) }}</h3>
        <button @click="selectedDay = null" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="day-actions">
        <button @click="handleAddSlot" class="action-btn add">
          <i class="fas fa-plus"></i> Add Slot
        </button>
        <button @click="handleBlockDay" class="action-btn block">
          <i class="fas fa-ban"></i> Block Day
        </button>
      </div>

      <div class="slots-list">
        <div v-if="selectedDay.slots.length === 0" class="no-slots">
          No slots for this day
        </div>
        <div 
          v-for="slot in selectedDay.slots" 
          :key="slot.id"
          class="slot-item"
          :class="slot.status"
        >
          <div class="slot-time">
            {{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}
          </div>
          <div class="slot-region">
            {{ getRegionName(slot.region) }}
          </div>
          <div class="slot-status">
            {{ slot.status }}
          </div>
          <div class="slot-actions">
            <button @click="handleEditSlot(slot)" class="edit-btn">
              <i class="fas fa-edit"></i>
            </button>
            <button @click="handleDeleteSlot(slot)" class="delete-btn">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek, addDays, subDays, isBefore } from 'date-fns';
import { useSlotStore } from '@/stores/slotStore';

const props = defineProps({
  slots: {
    type: Array,
    required: true,
    default: () => []
  },
  regions: {
    type: Array,
    required: true,
    default: () => []
  }
});

const emit = defineEmits(['add-slot', 'edit-slot', 'delete-slot', 'block-day']);

const currentDate = ref(new Date());
const selectedDay = ref(null);
const slotStore = useSlotStore();

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const currentMonthYear = computed(() => {
  return format(currentDate.value, 'MMMM yyyy');
});

const calendarDays = computed(() => {
  const startDay = startOfMonth(currentDate.value);
  const endDay = endOfMonth(currentDate.value);
  const days = eachDayOfInterval({ start: startDay, end: endDay });

  // Add days from previous month
  const firstDayOfWeek = startDay.getDay();
  if (firstDayOfWeek > 0) {
    const prevMonthDays = eachDayOfInterval({
      start: subDays(startDay, firstDayOfWeek),
      end: subDays(startDay, 1)
    });
    days.unshift(...prevMonthDays);
  }

  // Add days from next month
  const lastDayOfWeek = endDay.getDay();
  if (lastDayOfWeek < 6) {
    const nextMonthDays = eachDayOfInterval({
      start: addDays(endDay, 1),
      end: addDays(endDay, 6 - lastDayOfWeek)
    });
    days.push(...nextMonthDays);
  }

  return days.map(date => {
    const daySlots = Array.isArray(props.slots) ? props.slots.filter(slot => {
      try {
        const slotDate = slot.date instanceof Date ? slot.date : new Date(slot.date);
        return !isNaN(slotDate.getTime()) && isSameDay(slotDate, date);
      } catch (error) {
        console.error('Error processing slot date:', error);
        return false;
      }
    }) : [];

    return {
      date,
      dayNumber: format(date, 'd'),
      isCurrentMonth: isSameMonth(date, currentDate.value),
      isToday: isToday(date),
      slots: daySlots
    };
  });
});

// Watch for changes in the slot store
watch(() => slotStore.slots, () => {
  // Force a re-render of the calendar when slots change
  currentDate.value = new Date(currentDate.value);
}, { deep: true });

onMounted(async () => {
  try {
    await slotStore.fetchSlots();
    // If no slots exist, add some sample slots
    if (slotStore.slots.length === 0) {
      await slotStore.addSampleSlots();
    }
  } catch (error) {
    console.error('Error initializing slots:', error);
  }
});

const previousMonth = () => {
  currentDate.value = subMonths(currentDate.value, 1);
};

const nextMonth = () => {
  currentDate.value = addMonths(currentDate.value, 1);
};

const handleDayClick = (day) => {
  selectedDay.value = day;
};

const handleAddSlot = () => {
  emit('add-slot', {
    date: format(selectedDay.value.date, 'yyyy-MM-dd')
  });
};

const handleEditSlot = (slot) => {
  emit('edit-slot', slot);
};

const handleDeleteSlot = async (slot) => {
  try {
    await slotStore.deleteSlot(slot.id);
    emit('delete-slot', slot);
  } catch (error) {
    console.error('Error deleting slot:', error);
  }
};

const handleBlockDay = () => {
  emit('block-day', {
    date: format(selectedDay.value.date, 'yyyy-MM-dd')
  });
};

const formatDate = (date) => {
  if (!date) return '';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date:', date);
      return '';
    }
    return format(dateObj, 'EEEE, MMMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

const formatTime = (time) => {
  if (!time) return '';
  try {
    // Handle both Date objects and timestamp strings
    const timeDate = time instanceof Date ? time : new Date(time);
    if (isNaN(timeDate.getTime())) {
      console.warn('Invalid date:', time);
      return '';
    }
    return format(timeDate, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

const getRegionName = (regionId) => {
  const region = props.regions.find(r => r.id === regionId);
  return region ? region.name : 'Unknown Region';
};

const getSlotStatusClass = (slots) => {
  if (slots.some(slot => slot.status === 'blocked')) return 'blocked';
  if (slots.some(slot => slot.status === 'booked')) return 'booked';
  return 'available';
};

const getSlotTooltip = (slots) => {
  const counts = {
    available: getAvailableCount(slots),
    booked: getBookedCount(slots),
    blocked: slots.filter(s => s.status === 'blocked').length
  };
  return `Available: ${counts.available}, Booked: ${counts.booked}, Blocked: ${counts.blocked}`;
};

const getAvailableCount = (slots) => {
  return slots.filter(s => s.status === 'available').length;
};

const getBookedCount = (slots) => {
  return slots.filter(s => s.status === 'booked').length;
};
</script>

<style scoped>
.calendar-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.calendar-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #2d3748;
}

.nav-btn {
  background: none;
  border: none;
  color: #4a5568;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.nav-btn:hover {
  background: #f7fafc;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0.5rem;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
}

.weekday {
  text-align: center;
  font-weight: 500;
  color: #4a5568;
  font-size: 0.875rem;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e2e8f0;
  padding: 1px;
  flex: 1;
}

.calendar-day {
  background: white;
  min-height: 100px;
  padding: 0.5rem;
  cursor: pointer;
  position: relative;
}

.calendar-day:hover {
  background: #f7fafc;
}

.calendar-day.other-month {
  background: #f7fafc;
  color: #a0aec0;
}

.calendar-day.today {
  background: #ebf8ff;
}

.calendar-day.has-slots {
  font-weight: 500;
}

.day-number {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.slot-indicators {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.slot-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.slot-dot.available {
  background: #48bb78;
}

.slot-dot.booked {
  background: #4299e1;
}

.slot-dot.blocked {
  background: #f56565;
}

.slot-counts {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.available-count {
  color: #48bb78;
}

.booked-count {
  color: #4299e1;
}

.day-details {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 1000;
}

.day-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.day-details-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #2d3748;
}

.close-btn {
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 0.5rem;
}

.day-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn.add {
  background: #4299e1;
  color: white;
}

.action-btn.block {
  background: #f56565;
  color: white;
}

.slots-list {
  padding: 1rem;
}

.no-slots {
  text-align: center;
  color: #718096;
  padding: 1rem;
}

.slot-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.slot-item.available {
  background: #f0fff4;
}

.slot-item.booked {
  background: #ebf8ff;
}

.slot-item.blocked {
  background: #fff5f5;
}

.slot-time {
  font-weight: 500;
  color: #2d3748;
}

.slot-region {
  color: #4a5568;
  font-size: 0.875rem;
}

.slot-status {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: #e2e8f0;
  color: #4a5568;
}

.slot-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn,
.delete-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  border-radius: 0.25rem;
}

.edit-btn {
  color: #4299e1;
}

.delete-btn {
  color: #f56565;
}

.edit-btn:hover {
  background: #ebf8ff;
}

.delete-btn:hover {
  background: #fff5f5;
}
</style> 