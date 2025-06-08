<template>
  <div class="time-slots-section">
    <div v-if="loading" class="loading">
      Loading time slots...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else class="regions-grid">
      <div v-for="region in regions" :key="region.id" class="region-card">
        <h3 class="region-title">{{ region.name }}</h3>
        <p v-if="region.subtitle" class="region-subtitle">{{ region.subtitle }}</p>
        
        <div class="products-tabs">
          <button 
            v-for="product in products" 
            :key="product"
            :class="['product-tab', { active: getSelectedProduct(region.name) === product }]"
            @click="selectProduct(region.name, product)"
          >
            {{ product }}
          </button>
        </div>

        <div class="slots-grid">
          <div 
            v-for="slot in getTimeSlotsForRegion(region.name)" 
            :key="slot.id"
            class="time-slot"
            :class="{ 
              'available': slot.status === 'available',
              'unavailable': slot.status !== 'available'
            }"
            @click="openBookingModal(region, slot)"
          >
            <div class="slot-time">{{ formatTime(slot.startTime) }}</div>
            <div class="slot-info">
              <span class="slots-available">{{ slot.capacity }} slots left</span>
              <span class="slot-duration">{{ calculateDuration(slot.startTime, slot.endTime) }} min</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BookingModal
      v-if="showBookingModal"
      :booking-details="selectedBooking"
      @close="closeBookingModal"
      @confirm="confirmBooking"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useSlotStore } from '../stores/slotStore';
import BookingModal from './BookingModal.vue';

const props = defineProps({
  selectedDate: {
    type: Date,
    required: true
  }
});

// Create a map to store selected products for each region
const regionProducts = ref(new Map());
const showBookingModal = ref(false);
const selectedBooking = ref({
  region: '',
  product: '',
  date: new Date(),
  time: '',
  duration: 0,
  slotId: '',
  availableSlots: 0
});

const slotStore = useSlotStore();
const regions = ref(slotStore.regions);
const products = ref(['Bathrooms', 'Roofing']);
const timeSlots = ref([]);
const loading = ref(false);
const error = ref(null);

// Initialize default product selection for each region
onMounted(async () => {
  regions.value.forEach(region => {
    regionProducts.value.set(region.name, 'Bathrooms');
  });
  await fetchTimeSlots();
});

const fetchTimeSlots = async () => {
  if (!props.selectedDate) {
    console.warn('No selected date provided');
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    // Get slots from the store
    await slotStore.fetchSlots();

    // Filter slots for the selected date
    const startOfDay = new Date(props.selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(props.selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Filtering time slots for date:', {
      startOfDay,
      endOfDay,
      selectedDate: props.selectedDate
    });

    timeSlots.value = slotStore.slots.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate >= startOfDay && slotDate <= endOfDay;
    });

    console.log('Filtered time slots:', timeSlots.value);
  } catch (err) {
    console.error('Error fetching time slots:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Helper function to format time
const formatTime = (time) => {
  if (!time) return '';
  try {
    const date = time instanceof Date ? time : new Date(time);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', time);
      return '';
    }
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

// Helper function to calculate duration in minutes
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  try {
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime instanceof Date ? endTime : new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid date in duration calculation:', { startTime, endTime });
      return 0;
    }
    return Math.round((end - start) / (1000 * 60));
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
};

const getTimeSlotsForRegion = (regionName) => {
  const region = regions.value.find(r => r.name === regionName);
  if (!region) return [];
  
  return timeSlots.value.filter(slot => 
    slot.regionId === region.id && 
    slot.product === getSelectedProduct(regionName)
  );
};

const getSelectedProduct = (regionName) => {
  return regionProducts.value.get(regionName) || 'Bathrooms';
};

const selectProduct = (regionName, product) => {
  regionProducts.value.set(regionName, product);
};

const openBookingModal = (region, slot) => {
  if (slot.status !== 'available') return;
  
  selectedBooking.value = {
    region: region.name,
    product: getSelectedProduct(region.name),
    date: props.selectedDate,
    time: formatTime(slot.startTime),
    duration: calculateDuration(slot.startTime, slot.endTime),
    slotId: slot.id,
    availableSlots: slot.capacity
  };
  showBookingModal.value = true;
};

const closeBookingModal = () => {
  showBookingModal.value = false;
  selectedBooking.value = {
    region: '',
    product: '',
    date: new Date(),
    time: '',
    duration: 0,
    slotId: '',
    availableSlots: 0
  };
};

const confirmBooking = async (bookingDetails) => {
  try {
    await slotStore.updateSlot(bookingDetails.slotId, {
      capacity: bookingDetails.availableSlots - 1,
      status: bookingDetails.availableSlots - 1 === 0 ? 'booked' : 'available'
    });
    await fetchTimeSlots(); // Refresh the slots
    closeBookingModal();
  } catch (error) {
    console.error('Error confirming booking:', error);
    throw error;
  }
};

// Watch for changes in selected date
watch(() => props.selectedDate, () => {
  console.log('Selected date changed:', props.selectedDate);
  fetchTimeSlots();
});
</script>

<style scoped>
.time-slots-section {
  padding: 1rem;
}

.regions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.region-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.region-title {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
}

.region-subtitle {
  margin: 0 0 1rem 0;
  color: #64748b;
  font-size: 0.875rem;
}

.products-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.product-tab {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.product-tab:hover {
  border-color: #4299e1;
  color: #4299e1;
}

.product-tab.active {
  background: #4299e1;
  color: white;
  border-color: #4299e1;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.time-slot {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.time-slot.available:hover {
  background: #f8fafc;
  border-color: #4299e1;
  transform: translateY(-1px);
}

.time-slot.unavailable {
  opacity: 0.5;
  cursor: not-allowed;
}

.slot-time {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.slot-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #64748b;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.error {
  text-align: center;
  padding: 2rem;
  color: #ef4444;
}
</style> 