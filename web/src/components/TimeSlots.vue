<template>
  <div class="time-slots">
    <div class="regions-grid">
      <div v-for="region in regions" :key="region.name" class="region-card">
        <h3 class="region-title">{{ region.name }}</h3>
        <p class="region-subtitle">{{ region.subtitle }}</p>
        
        <div class="products-tabs">
          <button 
            v-for="product in products" 
            :key="product"
            :class="['product-tab', { active: selectedProduct === product }]"
            @click="selectedProduct = product"
          >
            {{ product }}
          </button>
        </div>

        <div class="slots-grid">
          <div 
            v-for="slot in timeSlots" 
            :key="slot.time"
            class="time-slot"
            :class="{ 
              'available': slot.availableSlots > 0,
              'unavailable': slot.availableSlots === 0
            }"
            @click="bookSlot(region, slot)"
          >
            <div class="slot-time">{{ slot.time }}</div>
            <div class="slot-info">
              <span class="slots-available">{{ slot.availableSlots }} slots left</span>
              <span class="slot-duration">{{ slot.duration }} min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const db = getFirestore();
const selectedProduct = ref('Bathrooms');
const regions = ref([
  { name: "MIDA", subtitle: "DC, Virginia, Maryland" },
  { name: "SOPA", subtitle: "Southern Pennsylvania" },
  { name: "Southern Virginia", subtitle: "Southern Virginia" },
  { name: "Florida", subtitle: "" },
  { name: "New England", subtitle: "Massachusetts & Rhode Island" },
  { name: "Connecticut", subtitle: "" }
]);
const products = ref(["Bathrooms", "Roofing"]);
const timeSlots = ref([]);

const loadTimeSlots = async (region, product) => {
  try {
    const q = query(
      collection(db, 'time_slots'),
      where('region', '==', region.name),
      where('product', '==', product),
      where('day', '==', new Date().toLocaleDateString('en-US', { weekday: 'long' }))
    );
    
    const querySnapshot = await getDocs(q);
    timeSlots.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error loading time slots:', error);
  }
};

const bookSlot = async (region, slot) => {
  if (slot.availableSlots === 0) return;
  
  try {
    const slotRef = doc(db, 'time_slots', slot.id);
    await updateDoc(slotRef, {
      availableSlots: slot.availableSlots - 1
    });
    
    // Reload slots after booking
    await loadTimeSlots(region, selectedProduct.value);
  } catch (error) {
    console.error('Error booking slot:', error);
  }
};

onMounted(() => {
  loadTimeSlots(regions.value[0], selectedProduct.value);
});
</script>

<style scoped>
.time-slots {
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
  border-radius: var(--border-radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.region-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.region-subtitle {
  color: var(--text-light);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.products-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.product-tab {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: var(--border-radius);
  background: white;
  color: var(--text-color);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.product-tab:hover {
  border-color: var(--primary-color);
}

.product-tab.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.time-slot {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: var(--border-radius);
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.time-slot:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.time-slot.available {
  border-color: var(--success-color);
}

.time-slot.unavailable {
  opacity: 0.5;
  cursor: not-allowed;
}

.slot-time {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.slot-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-light);
}

.slots-available {
  color: var(--success-color);
}
</style> 