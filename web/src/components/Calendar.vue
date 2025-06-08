<template>
  <div class="calendar-container">
    <FullCalendar
      ref="calendar"
      :options="calendarOptions"
      class="calendar"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { format } from 'date-fns'

const props = defineProps({
  modelValue: {
    type: Date,
    required: true
  },
  events: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'day-click'])

const calendar = ref(null)

// Watch for changes in the selected date
watch(() => props.modelValue, (newDate) => {
  if (calendar.value && newDate) {
    calendar.value.getApi().gotoDate(newDate)
  }
}, { immediate: true })

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  initialDate: props.modelValue,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  events: props.events.map(event => ({
    ...event,
    display: 'block',
    backgroundColor: getEventColor(event.status),
    borderColor: getEventColor(event.status)
  })),
  dateClick: (info) => {
    emit('update:modelValue', info.date)
    emit('day-click', info.date)
  },
  eventClick: (info) => {
    // Handle event click if needed
    console.log('Event clicked:', info.event)
  },
  height: 'auto',
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  nowIndicator: true,
  slotMinTime: '08:00:00',
  slotMaxTime: '20:00:00',
  allDaySlot: false,
  slotDuration: '00:30:00',
  snapDuration: '00:15:00',
  slotLabelInterval: '01:00:00',
  slotLabelFormat: {
    hour: 'numeric',
    minute: '2-digit',
    omitZeroMinute: false,
    meridiem: 'short'
  }
}))

function getEventColor(status) {
  switch (status) {
    case 'available':
      return '#4caf50'
    case 'blocked':
      return '#f44336'
    case 'booked':
      return '#ff9800'
    default:
      return '#1976d2'
  }
}
</script>

<style>
.calendar-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
}

.calendar {
  height: 600px;
}

/* FullCalendar custom styles */
.fc {
  font-family: inherit;
}

.fc .fc-toolbar-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.fc .fc-button {
  background-color: #1976d2;
  border-color: #1976d2;
  font-weight: 500;
  text-transform: capitalize;
}

.fc .fc-button:hover {
  background-color: #1565c0;
  border-color: #1565c0;
}

.fc .fc-button-primary:not(:disabled).fc-button-active,
.fc .fc-button-primary:not(:disabled):active {
  background-color: #1565c0;
  border-color: #1565c0;
}

.fc .fc-daygrid-day.fc-day-today {
  background-color: #e3f2fd;
}

.fc .fc-daygrid-day-number {
  color: #333;
  text-decoration: none;
}

.fc .fc-event {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
}

.fc .fc-event-title {
  font-weight: 500;
}

.fc .fc-timegrid-slot {
  height: 40px;
}

.fc .fc-timegrid-slot-label {
  font-size: 0.875rem;
}

.fc .fc-timegrid-now-indicator-line {
  border-color: #f44336;
}

.fc .fc-timegrid-now-indicator-arrow {
  border-color: #f44336;
}
</style> 