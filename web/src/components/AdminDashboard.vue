<template>
  <div class="admin-dashboard">
    <header class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <div class="header-actions">
        <button @click="goToScheduler" class="primary-btn">Go to Scheduler</button>
        <span class="user-email">{{ currentUser?.email }}</span>
        <button @click="handleLogout" class="secondary-btn">Logout</button>
      </div>
    </header>

    <div class="dashboard-content">
      <!-- Statistics Overview -->
      <div class="stats-overview">
        <div class="stat-card">
          <h3>Total Bookings</h3>
          <p class="stat-value">{{ totalBookings }}</p>
        </div>
        <div class="stat-card">
          <h3>Today's Bookings</h3>
          <p class="stat-value">{{ todayBookings }}</p>
        </div>
        <div class="stat-card">
          <h3>Available Slots</h3>
          <p class="stat-value">{{ availableSlots }}</p>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-navigation">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
        >
          {{ tab.name }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Time Slots Tab -->
        <div v-if="activeTab === 'timeSlots'" class="tab-pane">
          <SlotManagementDashboard />
        </div>

        <!-- Regions Tab -->
        <div v-if="activeTab === 'regions'" class="tab-pane">
          <section class="management-section">
            <h2>Regions Management</h2>
            <div class="section-content">
              <div class="add-region-form">
                <h3>Add New Region</h3>
                <div class="form-group">
                  <input type="text" v-model="newRegion.name" placeholder="Region name" />
                  <input type="text" v-model="newRegion.subtitle" placeholder="Region subtitle" />
                  <button @click="addRegion" class="primary-btn">Add Region</button>
                </div>
              </div>
              <div class="regions-list">
                <h3>Existing Regions</h3>
                <div v-for="region in regions" :key="region.id" class="region-item">
                  <div class="region-info">
                    <div v-if="editingRegion?.id === region.id" class="edit-form">
                      <input type="text" v-model="editingRegion.name" placeholder="Region name" />
                      <input type="text" v-model="editingRegion.subtitle" placeholder="Region subtitle" />
                      <div class="edit-actions">
                        <button @click="saveRegionEdit" class="primary-btn">Save</button>
                        <button @click="cancelEdit" class="secondary-btn">Cancel</button>
                      </div>
                    </div>
                    <div v-else class="region-details">
                      <div class="region-header">
                        <h4>{{ region.name }}</h4>
                        <p class="region-subtitle">{{ region.subtitle }}</p>
                      </div>
                      <div class="region-actions">
                        <button @click="startEdit(region)" class="edit-btn">Edit</button>
                        <button @click="deleteRegion(region.id)" class="danger-btn">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Users Tab -->
        <div v-if="activeTab === 'users'" class="tab-pane">
          <section class="management-section">
            <h2>User Management</h2>
            <div class="section-content">
              <div class="users-list">
                <div v-for="user in users" :key="user.uid" class="user-item">
                  <div class="user-info">
                    <span class="user-email">{{ user.email }}</span>
                    <span class="user-role">{{ user.role }}</span>
                  </div>
                  <div class="user-actions">
                    <select v-model="user.role" @change="handleUpdateUserRole(user)">
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button @click="handleDeleteUser(user.uid)" class="danger-btn">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Reports Tab -->
        <div v-if="activeTab === 'reports'" class="tab-pane">
          <section class="management-section">
            <h2>Reports</h2>
            <div class="section-content">
              <div class="reports-filters">
                <div class="form-group">
                  <label>Date Range:</label>
                  <input type="date" v-model="reportStartDate" />
                  <input type="date" v-model="reportEndDate" />
                </div>
                <div class="form-group">
                  <label>Region:</label>
                  <select v-model="selectedReportRegion">
                    <option value="all">All Regions</option>
                    <option v-for="region in regions" :key="region.id" :value="region.id">
                      {{ region.name }}
                    </option>
                  </select>
                </div>
                <button @click="generateReport" class="primary-btn">Generate Report</button>
              </div>
              <div class="report-results" v-if="reportData.length">
                <h3>Report Results</h3>
                <div class="report-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Region</th>
                        <th>Bookings</th>
                        <th>Available Slots</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in reportData" :key="row.date">
                        <td>{{ formatDate(row.date) }}</td>
                        <td>{{ getRegionName(row.region) }}</td>
                        <td>{{ row.bookings }}</td>
                        <td>{{ row.availableSlots }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="cancelTimeSlotEdit">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit Time Slot</h3>
          <button class="close-button" @click="cancelTimeSlotEdit">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Date:</label>
            <input type="date" v-model="editTimeSlotForm.date" required>
          </div>
          <div class="form-group">
            <label>Time:</label>
            <input type="time" v-model="editTimeSlotForm.time" required>
          </div>
          <div class="form-group">
            <label>Region:</label>
            <select v-model="editTimeSlotForm.region" required>
              <option value="">Select Region</option>
              <option v-for="region in regions" :key="region.id" :value="region.id">
                {{ region.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Status:</label>
            <select v-model="editTimeSlotForm.status">
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="saveTimeSlotEdit" class="btn btn-success">Save Changes</button>
          <button @click="cancelTimeSlotEdit" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy,
  limit,
  getDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { getUserRole, getAllUsers } from '../services/auth-service';
import { useRouter } from 'vue-router';
import SlotManagementDashboard from '../views/SlotManagementDashboard.vue';

const currentUser = ref(null);
const userRole = ref(null);
const totalBookings = ref(0);
const todayBookings = ref(0);
const availableSlots = ref(0);
const totalRevenue = ref(0);
const recentBookings = ref([]);
const users = ref([]);
const regions = ref([]);
const timeSlots = ref([]);
const newRegion = ref({ 
  name: '',
  subtitle: ''
});

// Modal states
const showAddSlotsModal = ref(false);
const showManageUsersModal = ref(false);
const showReportsModal = ref(false);
const showSettingsModal = ref(false);

// Filter states
const bookingFilter = ref('all');
const searchQuery = ref('');

// Report states
const reportType = ref('bookings');
const reportStartDate = ref('');
const reportEndDate = ref('');
const reportData = ref({
  totalBookings: 0,
  completedBookings: 0,
  cancelledBookings: 0,
  totalRevenue: 0,
  averageBookingValue: 0,
  totalUsers: 0,
  activeUsers: 0
});

// Settings
const settings = ref({
  slotDuration: 30,
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
  emailNotifications: true,
  smsNotifications: false
});

const newTimeSlot = ref({
  date: '',
  time: '',
  region: '',
  status: 'available'
});

// Tabs
const tabs = [
  { id: 'timeSlots', name: 'Time Slots' },
  { id: 'regions', name: 'Regions' },
  { id: 'users', name: 'Users' },
  { id: 'reports', name: 'Reports' }
];
const activeTab = ref('timeSlots');

// Add new refs for filters
const timeSlotFilters = ref({
  category: 'All',
  searchText: '',
  startDate: '',
  endDate: '',
  region: '',
  time: '',
  status: ''
});

// Add predefined time slots
const availableTimeSlots = [
  { value: '10:00', label: '10:00 AM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '18:00', label: '6:00 PM' }
];

// Add formatTime function in the script section, before the template
const formatTime = (time) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Add new refs for simplified time slot management
const selectedDate = ref('');
const dailyTimeSlots = ref({
  '10:00': { available: true, count: 1 },
  '14:00': { available: true, count: 1 },
  '18:00': { available: true, count: 1 }
});

// Add function to load time slots for a specific day
const loadDailyTimeSlots = async (date) => {
  if (!date) return;
  
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const q = query(
      collection(db, 'time_slots'),
      where('date', '>=', startOfDay),
      where('date', '<=', endOfDay)
    );
    
    const querySnapshot = await getDocs(q);
    const slots = {};
    
    // Initialize all time slots
    ['10:00', '14:00', '18:00'].forEach(time => {
      slots[time] = { available: true, count: 0 };
    });
    
    // Update with existing slots
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const time = data.time;
      if (slots[time]) {
        slots[time] = {
          available: data.status === 'available',
          count: (slots[time].count || 0) + 1
        };
      }
    });
    
    dailyTimeSlots.value = slots;
  } catch (error) {
    console.error('Error loading daily time slots:', error);
    alert('Error loading time slots for selected date');
  }
};

// Add function to save time slot changes
const saveTimeSlotChanges = async (time) => {
  if (!selectedDate.value) return;
  
  try {
    const date = new Date(selectedDate.value);
    const slotData = {
      date: Timestamp.fromDate(date),
      time: time,
      status: dailyTimeSlots.value[time].available ? 'available' : 'unavailable',
      createdAt: Timestamp.now()
    };
    
    await addDoc(collection(db, 'time_slots'), slotData);
    await loadDailyTimeSlots(selectedDate.value);
  } catch (error) {
    console.error('Error saving time slot:', error);
    alert('Error saving time slot changes');
  }
};

// Update the filteredTimeSlots computed property
const filteredTimeSlots = computed(() => {
  let filtered = timeSlots.value;
  
  // Apply filters
  if (timeSlotFilters.value.searchText) {
    const searchLower = timeSlotFilters.value.searchText.toLowerCase();
    filtered = filtered.filter(slot => 
      getRegionName(slot.region).toLowerCase().includes(searchLower)
    );
  }
  
  if (timeSlotFilters.value.region) {
    filtered = filtered.filter(slot => slot.region === timeSlotFilters.value.region);
  }
  
  if (timeSlotFilters.value.time) {
    filtered = filtered.filter(slot => {
      const slotTime = slot.time || slot.startTime;
      return slotTime === timeSlotFilters.value.time;
    });
  }
  
  if (timeSlotFilters.value.date) {
    const filterDate = new Date(timeSlotFilters.value.date);
    filterDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    filtered = filtered.filter(slot => {
      const slotDate = slot.date instanceof Timestamp ? slot.date.toDate() : new Date(slot.date);
      return slotDate >= filterDate && slotDate < nextDay;
    });
  }
  
  if (timeSlotFilters.value.status) {
    filtered = filtered.filter(slot => slot.status === timeSlotFilters.value.status);
  }
  
  // Group slots by date and time
  const groupedSlots = {};
  
  filtered.forEach(slot => {
    const date = slot.date instanceof Timestamp ? slot.date.toDate() : new Date(slot.date);
    const dateStr = date.toISOString().split('T')[0];
    const time = slot.time || slot.startTime;
    const key = `${dateStr}_${time}`;
    
    if (!groupedSlots[key]) {
      groupedSlots[key] = {
        id: slot.id,
        date: slot.date,
        time: time,
        status: slot.status || 'available',
        region: slot.region,
        count: 1,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
        capacity: slot.capacity,
        bookedCount: slot.bookedCount
      };
    } else {
      groupedSlots[key].count++;
    }
  });
  
  return Object.values(groupedSlots);
});

// Add date handling function
const handleDateChange = () => {
  if (timeSlotFilters.value.date) {
    const selectedDate = new Date(timeSlotFilters.value.date);
    console.log('Selected date:', selectedDate.toISOString());
    
    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      alert('Please select a future date');
      timeSlotFilters.value.date = '';
    }
  }
};

// Update the clearTimeSlotFilters function
const clearTimeSlotFilters = () => {
  timeSlotFilters.value = {
    category: 'All',
    searchText: '',
    startDate: '',
    endDate: '',
    region: '',
    time: '',
    status: ''
  };
  console.log('Filters cleared');
};

// Add helper function for date formatting
const formatDate = (date) => {
  if (!date) return '';
  try {
    const d = date.toDate();
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const checkUserPermissions = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('No user logged in');
    window.location.href = '/';
    return false;
  }

  try {
    const role = await getUserRole(user.uid);
    userRole.value = role;
    currentUser.value = user;
    
    if (role !== 'admin' && role !== 'manager') {
      console.log('User does not have admin/manager permissions');
      window.location.href = '/';
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error checking user permissions:', err);
    return false;
  }
};

onMounted(async () => {
  if (await checkUserPermissions()) {
    await Promise.all([
      loadDashboardData(),
      loadUsers(),
      loadRegions(),
      loadTimeSlots()
    ]);
    await loadSettings();
  }
});

const loadDashboardData = async () => {
  if (!await checkUserPermissions()) return;
  
  try {
    // Get total bookings
    const bookingsQuery = query(collection(db, 'bookings'));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    totalBookings.value = bookingsSnapshot.size;

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayQuery = query(
      collection(db, 'bookings'),
      where('date', '>=', today),
      where('date', '<', tomorrow)
    );
    const todaySnapshot = await getDocs(todayQuery);
    todayBookings.value = todaySnapshot.size;

    // Get available slots
    const slotsQuery = query(
      collection(db, 'timeSlots'),
      where('available', '==', true)
    );
    const slotsSnapshot = await getDocs(slotsQuery);
    availableSlots.value = slotsSnapshot.size;

    // Load recent bookings
    const recentQuery = query(
      collection(db, 'bookings'),
      orderBy('date', 'desc'),
      limit(50)
    );
    const recentSnapshot = await getDocs(recentQuery);
    recentBookings.value = recentSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate total revenue
    totalRevenue.value = recentBookings.value.reduce((total, booking) => 
      total + (booking.price || 0), 0
    );
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
};

const loadUsers = async () => {
  try {
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    users.value = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error loading users:', error);
  }
};

const loadRegions = async () => {
  try {
    console.log('Loading regions...');
    const regionsQuery = query(collection(db, 'regions'));
    const snapshot = await getDocs(regionsQuery);
    regions.value = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Region data:', { id: doc.id, ...data });
      return {
        id: doc.id,
        ...data
      };
    });
    console.log('Loaded regions:', regions.value);
  } catch (err) {
    console.error('Error loading regions:', err);
  }
};

const loadTimeSlots = async () => {
  if (!await checkUserPermissions()) return;
  
  try {
    console.log('Loading time slots...');
    
    // Ensure regions are loaded first
    if (regions.value.length === 0) {
      await loadRegions();
    }
    
    const timeSlotsRef = collection(db, 'time_slots');
    const snapshot = await getDocs(timeSlotsRef);
    
    if (snapshot.empty) {
      console.log('No time slots found in the collection');
      timeSlots.value = [];
      return;
    }

    timeSlots.value = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Handle different possible date field names and formats
      let date;
      if (data.date) {
        date = data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date));
      } else if (data.startTime) {
        date = data.startTime instanceof Timestamp ? data.startTime : Timestamp.fromDate(new Date(data.startTime));
      } else if (data.slotDate) {
        date = data.slotDate instanceof Timestamp ? data.slotDate : Timestamp.fromDate(new Date(data.slotDate));
      }

      // Get the region ID from either region or regionId field
      const regionId = data.region || data.regionId;
      
      return {
        id: doc.id,
        ...data,
        date: date || Timestamp.now(),
        time: data.time || data.startTime || '00:00',
        region: regionId,
        status: data.status || 'available',
        capacity: data.capacity || 1,
        bookedCount: data.bookedCount || 0,
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || Timestamp.now()
      };
    });
    
    console.log('Processed time slots:', timeSlots.value);
  } catch (err) {
    console.error('Error loading time slots:', err);
    console.error('Error details:', {
      code: err.code,
      message: err.message,
      stack: err.stack
    });
  }
};

const loadSettings = async () => {
  if (!await checkUserPermissions()) return;
  
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
    if (settingsDoc.exists()) {
      settings.value = settingsDoc.data();
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
};

const addTimeSlot = async () => {
  try {
    if (!newTimeSlot.value.date || !newTimeSlot.value.time || !newTimeSlot.value.region) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate time is one of the available slots
    const isValidTime = availableTimeSlots.some(slot => slot.value === newTimeSlot.value.time);
    if (!isValidTime) {
      alert('Please select a valid time slot (10:00 AM, 2:00 PM, or 6:00 PM)');
      return;
    }

    const timeSlotData = {
      date: Timestamp.fromDate(new Date(newTimeSlot.value.date)),
      time: newTimeSlot.value.time,
      region: newTimeSlot.value.region,
      status: newTimeSlot.value.status,
      createdAt: Timestamp.now()
    };

    await addDoc(collection(db, 'time_slots'), timeSlotData);
    newTimeSlot.value = {
      date: '',
      time: '',
      region: '',
      status: 'available'
    };
    await loadTimeSlots();
  } catch (error) {
    console.error('Error adding time slot:', error);
    alert('Error adding time slot');
  }
};

const deleteTimeSlot = async (slotId) => {
  if (!confirm('Are you sure you want to delete this time slot?')) return;
  
  try {
    await deleteDoc(doc(db, 'time_slots', slotId));
    timeSlots.value = timeSlots.value.filter(slot => slot.id !== slotId);
  } catch (err) {
    console.error('Error deleting time slot:', err);
  }
};

const editingRegion = ref(null);

const startEdit = (region) => {
  editingRegion.value = { ...region };
};

const cancelEdit = () => {
  editingRegion.value = null;
};

const saveRegionEdit = async () => {
  if (!editingRegion.value?.id) return;
  
  try {
    await updateDoc(doc(db, 'regions', editingRegion.value.id), {
      name: editingRegion.value.name,
      subtitle: editingRegion.value.subtitle
    });
    
    // Update local state
    const index = regions.value.findIndex(r => r.id === editingRegion.value.id);
    if (index !== -1) {
      regions.value[index] = { ...editingRegion.value };
    }
    
    editingRegion.value = null;
  } catch (err) {
    console.error('Error updating region:', err);
  }
};

const addRegion = async () => {
  if (!newRegion.value.name) return;
  try {
    const docRef = await addDoc(collection(db, 'regions'), {
      name: newRegion.value.name,
      subtitle: newRegion.value.subtitle || ''
    });
    regions.value.push({
      id: docRef.id,
      name: newRegion.value.name,
      subtitle: newRegion.value.subtitle || ''
    });
    newRegion.value = { name: '', subtitle: '' };
  } catch (err) {
    console.error('Error adding region:', err);
  }
};

const deleteRegion = async (regionId) => {
  if (!confirm('Are you sure you want to delete this region?')) return;
  try {
    await deleteDoc(doc(db, 'regions', regionId));
    regions.value = regions.value.filter(r => r.id !== regionId);
  } catch (err) {
    console.error('Error deleting region:', err);
  }
};

const handleUpdateUserRole = async (user) => {
  try {
    await updateDoc(doc(db, 'users', user.uid), {
      role: user.role
    });
    await loadUsers();
  } catch (err) {
    console.error('Error updating user role:', err);
  }
};

const handleDeleteUser = async (userId) => {
  if (!confirm('Are you sure you want to delete this user?')) return;
  
  try {
    await deleteDoc(doc(db, 'users', userId));
    await loadUsers();
  } catch (err) {
    console.error('Error deleting user:', err);
  }
};

const viewBookingDetails = (booking) => {
  // Implement booking details view
  console.log('View booking details:', booking);
};

const editBooking = (booking) => {
  // Implement booking edit
  console.log('Edit booking:', booking);
};

const cancelBooking = async (booking) => {
  if (confirm('Are you sure you want to cancel this booking?')) {
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'cancelled',
        cancelledAt: new Date()
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Error canceling booking:', error);
    }
  }
};

const saveSettings = async () => {
  try {
    await updateDoc(doc(db, 'settings', 'general'), settings.value);
    showSettingsModal.value = false;
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

const exportReport = async () => {
  try {
    // Implement report export logic
    console.log('Exporting report:', {
      type: reportType.value,
      startDate: reportStartDate.value,
      endDate: reportEndDate.value,
      data: reportData.value
    });
  } catch (error) {
    console.error('Error exporting report:', error);
  }
};

const regionMap = computed(() => {
  const map = {};
  regions.value.forEach(region => {
    // Map both the ID and the name as keys to handle both cases
    map[region.id] = region.name;
    map[region.name] = region.name; // Also map the name to itself
  });
  console.log('Region map:', map);
  return map;
});

const getRegionName = (regionId) => {
  if (!regionId) return 'Unknown Region';
  // First try to get the name directly
  const name = regionMap.value[regionId];
  if (name) return name;
  
  // If not found, try to find a region that contains this ID as part of its name
  const region = regions.value.find(r => 
    r.name.toLowerCase().includes(regionId.toLowerCase()) ||
    r.id.toLowerCase().includes(regionId.toLowerCase())
  );
  
  return region ? region.name : regionId; // Return the ID if no match found
};

const handleLogout = async () => {
  try {
    await signOut(auth);
    window.location.href = '/';
  } catch (err) {
    console.error('Error signing out:', err);
  }
};

const router = useRouter();

const goToScheduler = () => {
  console.log('Navigating to scheduler...');
  router.push({ name: 'Scheduler' });
};

const generateReport = async () => {
  try {
    const startDate = new Date(reportStartDate.value);
    const endDate = new Date(reportEndDate.value);
    endDate.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'timeSlots'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(q);
    const slots = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Process data for report
    const report = {};
    slots.forEach(slot => {
      const date = formatDate(slot.date);
      if (!report[date]) {
        report[date] = {
          date: slot.date,
          bookings: 0,
          availableSlots: 0
        };
      }
      if (slot.available) {
        report[date].availableSlots++;
      } else {
        report[date].bookings++;
      }
    });

    reportData.value = Object.values(report);
  } catch (err) {
    console.error('Error generating report:', err);
  }
};

// Add new refs for editing
const editingTimeSlot = ref(null);
const editTimeSlotForm = ref({
  date: '',
  time: '',
  region: '',
  status: 'available'
});

// Add new ref for modal
const showEditModal = ref(false);

// Update the edit function
const editTimeSlot = (slot) => {
  editingTimeSlot.value = slot;
  editTimeSlotForm.value = {
    date: slot.date.toDate().toISOString().split('T')[0],
    time: slot.time,
    region: slot.region,
    status: slot.status || 'available'
  };
  showEditModal.value = true;
};

// Update the cancel function
const cancelTimeSlotEdit = () => {
  showEditModal.value = false;
  editingTimeSlot.value = null;
};

// Update the save function
const saveTimeSlotEdit = async () => {
  if (!editingTimeSlot.value) return;
  
  try {
    const timeSlotRef = doc(db, 'time_slots', editingTimeSlot.value.id);
    const updateData = {
      date: Timestamp.fromDate(new Date(editTimeSlotForm.value.date)),
      time: editTimeSlotForm.value.time,
      region: editTimeSlotForm.value.region,
      status: editTimeSlotForm.value.status,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(timeSlotRef, updateData);
    await loadTimeSlots();
    showEditModal.value = false;
    editingTimeSlot.value = null;
  } catch (err) {
    console.error('Error updating time slot:', err);
    alert('Error updating time slot. Please try again.');
  }
};

const expandedSlots = ref([]);

const toggleSlotExpand = (slot) => {
  const index = expandedSlots.value.indexOf(slot.id);
  if (index === -1) {
    expandedSlots.value.push(slot.id);
  } else {
    expandedSlots.value.splice(index, 1);
  }
};

const setCategoryFilter = (category) => {
  timeSlotFilters.value.category = category;
  
  // Reset other filters based on category
  switch(category) {
    case 'Today':
      const today = new Date();
      timeSlotFilters.value.startDate = today.toISOString().split('T')[0];
      timeSlotFilters.value.endDate = today.toISOString().split('T')[0];
      break;
    case 'This Week':
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      timeSlotFilters.value.startDate = startOfWeek.toISOString().split('T')[0];
      timeSlotFilters.value.endDate = endOfWeek.toISOString().split('T')[0];
      break;
    case 'Available':
      timeSlotFilters.value.status = 'available';
      break;
    case 'Booked':
      timeSlotFilters.value.status = 'booked';
      break;
    case 'Cancelled':
      timeSlotFilters.value.status = 'cancelled';
      break;
    default:
      clearTimeSlotFilters();
  }
};

const getCategoryIcon = (category) => {
  const icons = {
    'All': 'fa-calendar',
    'Today': 'fa-calendar-day',
    'This Week': 'fa-calendar-week',
    'Available': 'fa-check-circle',
    'Booked': 'fa-user-check',
    'Cancelled': 'fa-times-circle'
  }
  return `fas ${icons[category]}`
}
</script>

<style scoped>
.admin-dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-email {
  color: #666;
  margin: 0 1rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-card h3 {
  margin: 0;
  color: #666;
  font-size: 1rem;
}

.stat-value {
  margin: 0.5rem 0 0;
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.tabs-navigation {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 1rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: #f8f9fa;
}

.tab-btn.active {
  color: #4a90e2;
  border-bottom: 2px solid #4a90e2;
  margin-bottom: -1rem;
}

.tab-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-pane {
  padding: 1.5rem;
}

.management-sections {
  display: grid;
  gap: 2rem;
}

.management-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-content {
  margin-top: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.slots-list,
.regions-list,
.users-list {
  margin-top: 1rem;
}

.slot-item,
.region-item,
.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.user-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.reports-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.report-table {
  margin-top: 1rem;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
}

.primary-btn,
.secondary-btn,
.danger-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.primary-btn {
  background: #4a90e2;
  color: white;
}

.secondary-btn {
  background: #f8f9fa;
  color: #666;
}

.danger-btn {
  background: #ef4444;
  color: white;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }

  .booking-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-controls {
    flex-direction: column;
  }

  .modal-content {
    margin: 1rem;
    padding: 1rem;
  }
}

.region-item {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.region-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.region-header {
  flex: 1;
}

.region-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.region-subtitle {
  margin: 0.5rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

.region-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.edit-form input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.edit-btn {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.edit-btn:hover {
  background-color: #357abd;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.slot-item {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slot-info {
  flex: 1;
}

.slot-date {
  font-weight: bold;
  color: #2c3e50;
}

.slot-time {
  color: #666;
  margin: 0.25rem 0;
}

.slot-region {
  color: #4a90e2;
  font-size: 0.9rem;
}

.slot-status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  background: #e8f5e9;
  color: #2e7d32;
}

.slot-status.booked {
  background: #ffebee;
  color: #c62828;
}

.slot-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.no-slots {
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}

.time-slots-container {
  margin-top: 20px;
}

.region-groups {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.region-group {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.region-header {
  background: #f8f9fa;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.region-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.slot-count {
  background: #e9ecef;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #495057;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  padding: 20px;
}

.slot-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.2s ease;
}

.slot-card:hover {
  transform: translateY(-2px);
}

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.slot-time {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.available {
  background: #e3fcef;
  color: #00a854;
}

.status-badge.booked {
  background: #fff7e6;
  color: #fa8c16;
}

.status-badge.cancelled {
  background: #fff1f0;
  color: #f5222d;
}

.slot-details {
  margin: 10px 0;
  color: #666;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 5px 0;
}

.slot-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.9rem;
}

.view-options {
  display: flex;
  gap: 10px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .slots-grid {
    grid-template-columns: 1fr;
  }
  
  .region-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}

.time-slots-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1.5rem;
}

.category-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #4a5568;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-btn:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.category-btn.active {
  background: #4a90e2;
  color: white;
  border-color: #4a90e2;
}

.category-btn i {
  font-size: 1rem;
}

.advanced-filters {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.filter-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-row:last-child {
  margin-bottom: 0;
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
  font-size: 0.9rem;
}

.slots-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.time-slot-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.time-slot-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.slot-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #e2e8f0;
}

.slot-main-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slot-details {
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a5568;
  font-size: 0.9rem;
}

.detail-item i {
  color: #4a90e2;
  width: 1rem;
}

.slot-footer {
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: center;
}

.btn-link {
  background: none;
  border: none;
  color: #4a90e2;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-link:hover {
  color: #2b6cb0;
}

.expanded-details {
  background: #f8fafc;
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
  }
  
  .date-range {
    flex-direction: column;
    align-items: stretch;
  }
  
  .slots-container {
    grid-template-columns: 1fr;
  }
}

.time-slots-list {
  margin-top: 1.5rem;
}

.slots-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-slot-item {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e2e8f0;
}

.slot-info {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.time {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  min-width: 100px;
}

.region {
  color: #4a5568;
  min-width: 120px;
}

.slots-count {
  color: #4a5568;
  min-width: 80px;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.available {
  background-color: #c6f6d5;
  color: #2f855a;
}

.status-badge.booked {
  background-color: #e9d8fd;
  color: #553c9a;
}

.status-badge.cancelled {
  background-color: #fed7d7;
  color: #c53030;
}

.slot-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  background: #f7fafc;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: #edf2f7;
  color: #2d3748;
}

.btn-icon.danger:hover {
  background: #fed7d7;
  color: #c53030;
}

@media (max-width: 768px) {
  .slot-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .time-slot-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .slot-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style> 