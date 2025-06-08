import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSlotStore = defineStore('slot', () => {
  const slots = ref([]);
  const regions = ref([
    { id: 'MIDA', name: 'MIDA', subtitle: 'DC, Virginia, Maryland' },
    { id: 'SOPA', name: 'SOPA', subtitle: 'Southern Pennsylvania' },
    { id: 'SV', name: 'Southern Virginia', subtitle: 'Southern Virginia' },
    { id: 'FL', name: 'Florida', subtitle: '' },
    { id: 'NE', name: 'New England', subtitle: 'Massachusetts & Rhode Island' },
    { id: 'CT', name: 'Connecticut', subtitle: '' }
  ]);
  const loading = ref(false);
  const error = ref(null);

  // Generate mock time slots
  const generateMockSlots = () => {
    const mockSlots = [];
    const products = ['Bathrooms', 'Roofing'];
    
    // Generate slots for next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      // For each region and product
      regions.value.forEach(region => {
        products.forEach(product => {
          // Create 8 slots per day (9 AM to 5 PM)
          for (let hour = 9; hour < 17; hour++) {
            const startTime = new Date(date);
            startTime.setHours(hour, 0, 0, 0);
            
            const endTime = new Date(date);
            endTime.setHours(hour + 1, 0, 0, 0);
            
            mockSlots.push({
              id: `${region.id}-${product}-${date.toISOString()}-${hour}`,
              date: new Date(date),
              startTime: new Date(startTime),
              endTime: new Date(endTime),
              regionId: region.id,
              product: product,
              capacity: 5,
              status: 'available',
              createdAt: new Date()
            });
          }
        });
      });
    }
    
    return mockSlots;
  };

  const fetchSlots = async () => {
    loading.value = true;
    error.value = null;
    try {
      // Use mock data
      slots.value = generateMockSlots();
      console.log('Generated mock slots:', slots.value);
    } catch (err) {
      console.error('Error generating mock slots:', err);
      error.value = 'Failed to generate mock slots';
    } finally {
      loading.value = false;
    }
  };

  const fetchRegions = async () => {
    // Regions are already defined in the store
    return regions.value;
  };

  const addSlot = async (slotData) => {
    loading.value = true;
    error.value = null;
    try {
      const newSlot = {
        id: `slot-${Date.now()}`,
        ...slotData,
        createdAt: new Date()
      };
      slots.value.push(newSlot);
      return newSlot.id;
    } catch (err) {
      console.error('Error adding slot:', err);
      error.value = 'Failed to add slot';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateSlot = async (slotId, slotData) => {
    loading.value = true;
    error.value = null;
    try {
      const index = slots.value.findIndex(slot => slot.id === slotId);
      if (index !== -1) {
        slots.value[index] = {
          ...slots.value[index],
          ...slotData,
          updatedAt: new Date()
        };
      }
    } catch (err) {
      console.error('Error updating slot:', err);
      error.value = 'Failed to update slot';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteSlot = async (slotId) => {
    loading.value = true;
    error.value = null;
    try {
      slots.value = slots.value.filter(slot => slot.id !== slotId);
    } catch (err) {
      console.error('Error deleting slot:', err);
      error.value = 'Failed to delete slot';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const bulkAddSlots = async (slotsData) => {
    loading.value = true;
    error.value = null;
    try {
      const newSlots = slotsData.map(slot => ({
        id: `slot-${Date.now()}-${Math.random()}`,
        ...slot,
        createdAt: new Date()
      }));
      slots.value.push(...newSlots);
    } catch (err) {
      console.error('Error adding slots in bulk:', err);
      error.value = 'Failed to add slots in bulk';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const blockDate = async (date, regionId) => {
    loading.value = true;
    error.value = null;
    try {
      slots.value = slots.value.map(slot => {
        if (slot.date.toDateString() === date.toDateString() && slot.regionId === regionId) {
          return { ...slot, status: 'blocked' };
        }
        return slot;
      });
    } catch (err) {
      console.error('Error blocking date:', err);
      error.value = 'Failed to block date';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    slots,
    regions,
    loading,
    error,
    fetchSlots,
    fetchRegions,
    addSlot,
    updateSlot,
    deleteSlot,
    bulkAddSlots,
    blockDate
  };
}); 