// Import Firebase functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    addDoc,
    setDoc,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAN7eGZ8KuVug7My2_-GPg7DC3pVPIWTo4",
    authDomain: "booking-b1567.firebaseapp.com",
    projectId: "booking-b1567",
    storageBucket: "booking-b1567.appspot.com",
    messagingSenderId: "1027148740103",
    appId: "1:1027148740103:web:2b580beab39f01a0b6dca2",
    measurementId: "G-X1BE24TK3Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Make Firebase functions available globally
window.db = db;
window.auth = auth;
window.collection = collection;
window.getDocs = getDocs;
window.doc = doc;
window.getDoc = getDoc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.query = query;
window.where = where;
window.orderBy = orderBy;
window.serverTimestamp = serverTimestamp;
window.addDoc = addDoc;
window.setDoc = setDoc;
window.onSnapshot = onSnapshot;

// Helper function for showing success messages
function showSuccess(message) {
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(successElement);

    // Add styles if they don't exist
    if (!document.getElementById('successStyles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'successStyles';
        styleSheet.textContent = `
            .success-message {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #10B981;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
            }

            .success-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .success-content i {
                font-size: 1.25rem;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    // Remove the message after 3 seconds
    setTimeout(() => {
        successElement.remove();
    }, 3000);
}

// Make showSuccess available globally
window.showSuccess = showSuccess;

// Constants
const COLLECTIONS = {
    USERS: 'users',
    BOOKINGS: 'bookings',
    CANCELLED_BOOKINGS: 'cancelledBookings',
    REGIONS: 'regions',
    TIME_SLOTS: 'timeSlots',
    MANAGERS: 'managers'
};

const cancellationReasons = [
    'Customer Request',
    'No Show',
    'Double Booking',
    'Technical Issue',
    'Other'
];

// Add these variables at the top of the file after the constants
let currentDayFilter = 'all';
let currentRegionFilter = 'all';

// Add these constants after the existing ones
const NOTIFICATION_TYPES = {
    WEEKLY_UPDATE: 'weekly_update',
    BOARD_UPDATE: 'board_update'
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Add these constants after the existing ones
const INTEGRATIONS = {
    GECKOBOARD: 'geckoboard',
    SALESFORCE: 'salesforce',
    CALL_TRACKING: 'call_tracking'
};

// Add these variables after the existing ones
let geckoboardIntegration = null;
let salesforceIntegration = null;
let callTrackingIntegration = null;

// Add these functions at the top of the file after the constants
function getNextDays(count = 14) {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < count; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        days.push(date);
    }
    
    return days;
}

function formatDate(date) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

// Region Management Functions
async function addRegion() {
    try {
    const name = document.getElementById('regionName').value;
    const subtitle = document.getElementById('regionSubtitle').value;

        // Add the region
        const regionRef = await db.collection(COLLECTIONS.REGIONS).add({
            name,
            subtitle,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Create default time slots for the new region
        const batch = db.batch();
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const times = ['10:00 AM', '2:00 PM', '6:00 PM'];
        const products = ['Bathrooms', 'Roofing'];

        // Create time slots for each day, time, and product
        for (const day of days) {
            for (const time of times) {
                for (const product of products) {
                    const timeSlotRef = db.collection(COLLECTIONS.TIME_SLOTS).doc();
                    batch.set(timeSlotRef, {
                        day,
                        time,
                        region: name,
                        product,
                        maxSlots: 5,
                        availableSlots: 5,
                        isActive: true,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        }

        // Commit all changes
        await batch.commit();

        // Clear form
        document.getElementById('regionName').value = '';
        document.getElementById('regionSubtitle').value = '';

        // Reload regions and time slots
        loadRegions();
        loadTimeSlots();
        showSuccess('Region added successfully with default time slots');
    } catch (error) {
        console.error('Error adding region:', error);
        showError('Failed to add region');
    }
}

async function editRegion(regionId) {
    try {
        // Get the current user's role
        const currentUser = auth.currentUser;
        if (!currentUser) {
            showError('You must be logged in to edit regions');
            return;
        }

        const currentUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, currentUser.uid));
        const currentUserData = currentUserDoc.data();
        const isManager = currentUserData.role === 'manager';
        const isAdmin = currentUserData.role === 'admin';

        // Check if user has permission
        if (!isManager && !isAdmin) {
            showError('You do not have permission to edit regions');
            return;
        }

        // Get region data
        const regionDoc = await getDoc(doc(db, COLLECTIONS.REGIONS, regionId));
        if (!regionDoc.exists()) {
            showError('Region not found');
            return;
        }

        const region = regionDoc.data();
        console.log('Region data:', region);

        // Remove any existing modals
        const existingModal = document.querySelector('.modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create and show the edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Region</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="editRegionForm" onsubmit="event.preventDefault(); updateRegion('${regionId}');">
                        <div class="form-group">
                            <label for="editRegionName">Region Name</label>
                        <input type="text" id="editRegionName" value="${region.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="editRegionSubtitle">Subtitle (Optional)</label>
                            <input type="text" id="editRegionSubtitle" value="${region.subtitle || ''}">
                        </div>
                    <button type="submit" class="submit-button">
                                <i class="fas fa-save"></i>
                                Save Changes
                            </button>
                    </form>
            </div>
        `;

        document.body.appendChild(modal);

    } catch (error) {
        console.error('Error editing region:', error);
        showError('Failed to edit region: ' + error.message);
    }
}

// Function to update a region
async function updateRegion(regionId) {
    try {
        const name = document.getElementById('editRegionName').value;
        const subtitle = document.getElementById('editRegionSubtitle').value;

        // Update the region
        await updateDoc(doc(db, COLLECTIONS.REGIONS, regionId), {
            name,
            subtitle,
            updatedAt: serverTimestamp()
        });

        // Close the modal
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }

        // Reload regions
        loadRegions();
        showSuccess('Region updated successfully');

    } catch (error) {
        console.error('Error updating region:', error);
        showError('Failed to update region: ' + error.message);
    }
}

// Make functions globally available
window.loadDashboardStats = loadDashboardStats;
window.loadActiveUsers = loadActiveUsers;
window.editRegion = editRegion;
window.updateRegion = updateRegion;

async function deleteRegion(regionId) {
    if (!confirm('Are you sure you want to delete this region?')) return;

    try {
        await db.collection(COLLECTIONS.REGIONS).doc(regionId).delete();
        loadRegions();
    } catch (error) {
        console.error('Error deleting region:', error);
        showError('Failed to delete region');
    }
}

// Time Slot Management Functions
async function addTimeSlot() {
    try {
        const time = document.getElementById('timeSlotTime').value;
        const duration = 90; // Static duration of 90 minutes
        const region = document.getElementById('timeSlotRegion').value;
        const product = document.getElementById('timeSlotProduct').value;
        const day = document.getElementById('timeSlotDay').value;

        // Validate inputs
        if (!time || !region || !product || !day) {
            showError('Please fill in all required fields');
            return;
        }

        // Validate time is within allowed range (8 AM to 8 PM)
        const [hours, minutes] = time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        const startTimeInMinutes = 8 * 60; // 8 AM
        const endTimeInMinutes = 20 * 60; // 8 PM

        // Check if the appointment would end after 8 PM
        const appointmentEndTime = timeInMinutes + duration;
        if (appointmentEndTime > endTimeInMinutes) {
            showError('Appointment would end after 8:00 PM. Please select an earlier time.');
            return;
        }

        if (timeInMinutes < startTimeInMinutes || timeInMinutes > endTimeInMinutes) {
            showError('Time must be between 8:00 AM and 8:00 PM');
            return;
        }

        // Validate region exists
        const regionDoc = await getDocs(
            query(
                collection(db, COLLECTIONS.REGIONS),
                where('name', '==', region)
            )
        );

        if (regionDoc.empty) {
            showError('Selected region does not exist');
            return;
        }

        // Check for overlapping time slots
        const existingSlots = await getDocs(
            query(
                collection(db, COLLECTIONS.TIME_SLOTS),
                where('day', '==', day),
                where('region', '==', region),
                where('product', '==', product)
            )
        );

        const newSlotStart = new Date(`2000-01-01T${time}`);
        const newSlotEnd = new Date(newSlotStart.getTime() + duration * 60000);

        for (const doc of existingSlots.docs) {
            const existingSlot = doc.data();
            const existingStart = new Date(`2000-01-01T${existingSlot.time}`);
            const existingEnd = new Date(existingStart.getTime() + existingSlot.duration * 60000);

            if (
                (newSlotStart >= existingStart && newSlotStart < existingEnd) ||
                (newSlotEnd > existingStart && newSlotEnd <= existingEnd) ||
                (newSlotStart <= existingStart && newSlotEnd >= existingEnd)
            ) {
                showError('This time slot overlaps with an existing slot for the same product');
                return;
            }
        }

        // Add time slot
        await addDoc(collection(db, COLLECTIONS.TIME_SLOTS), {
            day,
            time,
            duration,
            region,
            product,
            maxSlots: 10, // Default value
            availableSlots: 10, // Default value
            isActive: true,
            createdAt: serverTimestamp()
        });

        // Close modal and reload time slots
        document.getElementById('timeSlotModal').style.display = 'none';
        loadTimeSlots();
        showSuccess('Time slot added successfully');
    } catch (error) {
        console.error('Error adding time slot:', error);
        showError('Failed to add time slot');
    }
}

async function editTimeSlot(slotId) {
    try {
        // Get the time slot data
        const slotDoc = await getDoc(doc(db, COLLECTIONS.TIME_SLOTS, slotId));
        if (!slotDoc.exists()) {
            showError('Time slot not found');
            return;
        }

        const slotData = slotDoc.data();

        // Populate the edit form
        document.getElementById('editTimeSlotTime').value = slotData.time;
        document.getElementById('editTimeSlotDuration').value = slotData.duration;
        document.getElementById('editTimeSlotRegion').value = slotData.region;
        document.getElementById('editTimeSlotProduct').value = slotData.product;
        document.getElementById('editTimeSlotMaxSlots').value = slotData.maxSlots;
        document.getElementById('editTimeSlotAvailableSlots').value = slotData.availableSlots;

        // Show the modal
        const modal = document.getElementById('editTimeSlotModal');
        modal.style.display = 'flex';

        // Handle form submission
        const form = document.getElementById('editTimeSlotForm');
        form.onsubmit = async (e) => {
            e.preventDefault();

            try {
                // Get form values
                const updatedData = {
                    time: document.getElementById('editTimeSlotTime').value,
                    duration: parseInt(document.getElementById('editTimeSlotDuration').value),
                    region: document.getElementById('editTimeSlotRegion').value,
                    product: document.getElementById('editTimeSlotProduct').value,
                    maxSlots: parseInt(document.getElementById('editTimeSlotMaxSlots').value),
                    availableSlots: parseInt(document.getElementById('editTimeSlotAvailableSlots').value),
                    lastModified: serverTimestamp()
                };

                // Update the time slot
                await updateDoc(doc(db, COLLECTIONS.TIME_SLOTS, slotId), updatedData);

                // Close modal and reload time slots
                modal.style.display = 'none';
                loadTimeSlots();
                showSuccess('Time slot updated successfully');
            } catch (error) {
                console.error('Error updating time slot:', error);
                showError('Failed to update time slot');
            }
        };
    } catch (error) {
        console.error('Error loading time slot for edit:', error);
        showError('Failed to load time slot for editing');
    }
}

async function deleteTimeSlot(slotId) {
    try {
        if (!confirm('Are you sure you want to delete this time slot?')) {
            return;
        }

        // Check if there are any active bookings for this time slot
        const bookingsQuery = query(
            collection(db, COLLECTIONS.BOOKINGS),
            where('timeSlotId', '==', slotId),
            where('status', '!=', 'cancelled')
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);

        if (!bookingsSnapshot.empty) {
            showError('Cannot delete time slot with active bookings');
            return;
        }

        // Delete the time slot
        await deleteDoc(doc(db, COLLECTIONS.TIME_SLOTS, slotId));
        loadTimeSlots();
        showSuccess('Time slot deleted successfully');
    } catch (error) {
        console.error('Error deleting time slot:', error);
        showError('Failed to delete time slot');
    }
}

// UI Helper Functions
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function closeEditRegionModal() {
    document.getElementById('editRegionModal').style.display = 'none';
}

function closeEditTimeSlotModal() {
    document.getElementById('editTimeSlotModal').style.display = 'none';
}

// Function to show create admin/manager modal
async function showCreateAdminModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Create Admin/Manager</h2>
                <button class="close-modal" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="createAdminForm" onsubmit="event.preventDefault(); createAdminUser();">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="firstName">First Name</label>
                        <input type="text" id="firstName" required>
                    </div>
                    <div class="form-group">
                        <label for="lastName">Last Name</label>
                        <input type="text" id="lastName" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" required>
                    </div>
                    <div class="form-group">
                        <label for="role">Role</label>
                        <select id="role" required>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                        </select>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="action-button edit-button">
                        <i class="fas fa-user-plus"></i>
                        Create User
                    </button>
                    <button type="button" class="action-button delete-button" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
}

// Function to create admin/manager user
async function createAdminUser() {
    try {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user document in Firestore
        await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
            firstName,
            lastName,
            email,
            role,
            isActive: true,
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp()
        });

        // Close the modal
        document.querySelector('.modal').remove();

        // Show success message
        showSuccess(`${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`);

        // Refresh the users list
        loadUsers();

    } catch (error) {
        console.error('Error creating user:', error);
        showError('Failed to create user: ' + error.message);
    }
}

// Add styles for the create admin modal
const createAdminStyles = document.createElement('style');
createAdminStyles.textContent = `
    .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-group label {
        font-weight: 500;
        color: #6b7280;
        font-size: 0.875rem;
    }

    .form-group input,
    .form-group select {
        padding: 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 0.875rem;
        transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-group input::placeholder {
        color: #9ca3af;
    }

    .modal-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 2px solid #f3f4f6;
    }

    .modal-actions .action-button {
        flex: 1;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s;
        font-size: 0.875rem;
    }

    .modal-actions .edit-button {
        background-color: #e0e7ff;
        color: #3730a3;
    }

    .modal-actions .edit-button:hover {
        background-color: #c7d2fe;
    }

    .modal-actions .delete-button {
        background-color: #fee2e2;
        color: #991b1b;
    }

    .modal-actions .delete-button:hover {
        background-color: #fca5a5;
    }
`;
document.head.appendChild(createAdminStyles);

// Make functions globally available
window.showCreateAdminModal = showCreateAdminModal;
window.createAdminUser = createAdminUser;

// Function to handle tab switching
function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.getElementsByClassName('tab-content');
    for (let content of tabContents) {
        content.classList.remove('active');
    }

    // Remove active class from all tab buttons
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let button of tabButtons) {
        button.classList.remove('active');
    }

    // Show selected tab content
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to selected tab button
    const selectedButton = document.getElementById(tabName + 'TabBtn');
    if (selectedButton) {
        selectedButton.classList.add('active');
    }

    // Load content based on tab
    switch (tabName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'users':
            loadUsers();
            break;
        case 'managers':
            loadManagers();
            break;
        case 'activeUsers':
            loadActiveUsers();
            break;
        case 'regions':
            loadRegions();
            break;
        case 'timeSlots':
            loadTimeSlots();
            break;
        case 'integrations':
            loadIntegrations();
            break;
    }
}

// Add event listeners for tab buttons
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = {
        'dashboardTabBtn': 'dashboard',
        'usersTabBtn': 'users',
        'managersTabBtn': 'managers',
        'activeUsersTabBtn': 'activeUsers',
        'regionsTabBtn': 'regions',
        'timeSlotsTabBtn': 'timeSlots',
        'integrationsTabBtn': 'integrations'
    };

    for (const [buttonId, tabName] of Object.entries(tabButtons)) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => switchTab(tabName));
        }
    }
});

// Authentication Functions
async function logout() {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showError('Failed to sign out');
    }
}

// Data Loading Functions
async function loadDashboardStats() {
    try {
        // Get total bookings (only confirmed ones)
        const bookingsQuery = query(
            collection(db, COLLECTIONS.BOOKINGS),
            where('status', '==', 'confirmed')
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const totalBookings = bookingsSnapshot.size;

        // Get cancelled bookings
        const cancelledBookingsQuery = query(
            collection(db, COLLECTIONS.BOOKINGS),
            where('status', '==', 'cancelled')
        );
        const cancelledBookingsSnapshot = await getDocs(cancelledBookingsQuery);
        const cancelledBookings = cancelledBookingsSnapshot.size;

        // Update UI
        document.getElementById('totalBookings').textContent = totalBookings;
        document.getElementById('cancelledBookings').textContent = cancelledBookings;

        // Set up real-time listeners for updates
        onSnapshot(bookingsQuery, (snapshot) => {
            document.getElementById('totalBookings').textContent = snapshot.size;
        });

        onSnapshot(cancelledBookingsQuery, (snapshot) => {
            document.getElementById('cancelledBookings').textContent = snapshot.size;
        });

    } catch (error) {
        console.error('Error loading dashboard statistics:', error);
        showError('Failed to load dashboard statistics');
    }
}

// Add this function to check if user is a super admin
async function isSuperAdmin(userId) {
    try {
        const userDocRef = doc(db, COLLECTIONS.USERS, userId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            console.error('User document not found');
            return false;
        }
        const userData = userDoc.data();
        return userData && userData.role === 'super_admin';
    } catch (error) {
        console.error('Error checking super admin status:', error);
        return false;
    }
}

// Function to load users
async function loadUsers() {
    try {
        const usersList = document.getElementById('usersList');
        if (!usersList) {
            console.error('Users list container not found');
            return;
        }
        
        usersList.innerHTML = '<div class="loading">Loading users...</div>';

        // Get current user
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error('No user is currently signed in');
            showError('Please sign in to view users');
            return;
        }

        // Get all users from Firestore
        const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        const users = [];
        
        usersSnapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        // Sort users by role (admin first, then manager, then regular users)
        users.sort((a, b) => {
            const roleOrder = { admin: 0, manager: 1, user: 2 };
            return roleOrder[a.role] - roleOrder[b.role];
        });

        // Clear loading state
        usersList.innerHTML = '';

        // Create user cards
        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="user-details">
                        <h3>${user.firstName} ${user.lastName}</h3>
                        <p class="user-email">${user.email}</p>
                        <div class="user-meta">
                            <span class="user-role ${user.role}">${user.role}</span>
                            <span class="user-status ${user.isActive ? 'active' : 'inactive'}">
                                ${user.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="action-button view-button" onclick="viewUserDetails('${user.id}')">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    <button class="action-button edit-button" onclick="editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="action-button delete-button" onclick="deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            `;
            usersList.appendChild(userCard);
        });

        // Update active users count
        const activeUsers = users.filter(user => user.isActive).length;
        const activeUsersCount = document.getElementById('activeUsersCount');
        if (activeUsersCount) {
            activeUsersCount.textContent = activeUsers;
        }

    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

// Add styles for user cards and status
const userCardStyles = document.createElement('style');
userCardStyles.textContent = `
    .user-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        transition: all 0.2s;
    }

    .user-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
    }

    .user-avatar {
        width: 48px;
        height: 48px;
        background: #f3f4f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        font-size: 1.25rem;
        flex-shrink: 0;
    }

    .user-details {
        flex: 1;
        min-width: 0;
    }

    .user-details h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
    }

    .user-email {
        margin: 0.25rem 0;
        font-size: 0.875rem;
        color: #6b7280;
    }

    .user-meta {
        display: flex;
        gap: 0.75rem;
        margin-top: 0.5rem;
    }

    .user-role {
        font-size: 0.75rem;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-weight: 500;
    }

    .user-role.admin {
        background: #dbeafe;
        color: #1e40af;
    }

    .user-role.manager {
        background: #fef3c7;
        color: #92400e;
    }

    .user-role.user {
        background: #f3f4f6;
        color: #4b5563;
    }

    .user-status {
        font-size: 0.75rem;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-weight: 500;
    }

    .user-status.active {
        background: #dcfce7;
        color: #166534;
    }

    .user-status.inactive {
        background: #fee2e2;
        color: #991b1b;
    }

    .user-actions {
        display: flex;
        gap: 0.5rem;
        margin-left: 1rem;
        flex-shrink: 0;
    }

    .action-button {
        padding: 0.5rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s;
        min-width: 80px;
        white-space: nowrap;
    }

    .action-button i {
        font-size: 1rem;
    }

    .view-button {
        background: #e0e7ff;
        color: #3730a3;
    }

    .view-button:hover {
        background: #c7d2fe;
    }

    .edit-button {
        background: #fef3c7;
        color: #92400e;
    }

    .edit-button:hover {
        background: #fde68a;
    }

    .delete-button {
        background: #fee2e2;
        color: #991b1b;
    }

    .delete-button:hover {
        background: #fca5a5;
    }
`;
document.head.appendChild(userCardStyles);

// Function to delete a user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

    try {
        // Delete from Firestore
        await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
        
        // Delete from Firebase Auth if it's a valid UID
        if (userId.length === 28) { // Firebase UIDs are 28 characters
            await deleteUser(auth.currentUser);
        }

        // Refresh the list
        loadUsers();
        showSuccess('User deleted successfully');
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showError('Failed to delete user: ' + error.message);
    }
}

// Make sure the function is available globally
window.deleteUser = deleteUser;

async function loadActiveUsers() {
    try {
        const activeUsersContainer = document.getElementById('activeUsersList');
        if (!activeUsersContainer) {
            console.error('Active users container not found');
            return;
        }

        // Clear existing content
        activeUsersContainer.innerHTML = '<div class="loading">Loading active users...</div>';

        // Get all users
        const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        const now = new Date();
        const activeThreshold = new Date(now.getTime() - (30 * 60 * 1000)); // 30 minutes ago

        // Filter active users
        const activeUsers = usersSnapshot.docs
            .map(doc => ({
                    id: doc.id,
                ...doc.data()
            }))
            .filter(user => {
                const lastActive = user.lastActive ? user.lastActive.toDate() : null;
                return lastActive && lastActive > activeThreshold;
            });

            // Update active users count
            const activeUsersCount = document.getElementById('activeUsersCount');
            if (activeUsersCount) {
                activeUsersCount.textContent = activeUsers.length;
            }

        // Update UI
        if (activeUsers.length === 0) {
            activeUsersContainer.innerHTML = '<div class="empty-state">No active users found</div>';
            return;
        }

        // Create active users list
        activeUsersContainer.innerHTML = '';
        activeUsers.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'list-item';
            userCard.innerHTML = `
                <div class="list-item-content">
                            <div class="list-item-title">
                        <i class="fas fa-user"></i>
                                ${user.firstName} ${user.lastName}
                        <span class="user-role ${user.role || 'user'}">${user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</span>
                            </div>
                    <div class="list-item-subtitle">
                                <div>Email: ${user.email}</div>
                        <div>Last Active: ${user.lastActive ? user.lastActive.toDate().toLocaleString() : 'Never'}</div>
                        <div>Time Since: ${getTimeSinceLastActive(user.lastActive.toDate())}</div>
                    </div>
                </div>
                <div class="list-item-actions">
                    <button onclick="viewUserDetails('${user.id}')" class="action-button edit-button">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            `;
            activeUsersContainer.appendChild(userCard);
        });

    } catch (error) {
        console.error('Error loading active users:', error);
        showError('Failed to load active users');
    }
}

// Helper function to get time since last active
function getTimeSinceLastActive(lastActive) {
    const now = new Date();
    const diff = now - lastActive;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Function to edit a user
async function editUser(userId) {
    try {
        // Get user data
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
        if (!userDoc.exists()) {
            showError('User not found');
            return;
        }

        const user = userDoc.data();
        console.log('User data:', user);
        
        // Create and show the edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit User</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="editUserForm" onsubmit="event.preventDefault(); updateUser('${userId}');">
                    <div class="form-group">
                        <label for="editFirstName">First Name</label>
                        <input type="text" id="editFirstName" value="${user.firstName || ''}" required>
                            </div>
                    <div class="form-group">
                        <label for="editLastName">Last Name</label>
                        <input type="text" id="editLastName" value="${user.lastName || ''}" required>
                            </div>
                    <div class="form-group">
                        <label for="editEmail">Email</label>
                        <input type="email" id="editEmail" value="${user.email || ''}" required>
                        </div>
                    <div class="form-group">
                        <label for="editRole">Role</label>
                        <select id="editRole" required>
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                            </div>
                    <div class="form-group">
                        <label for="editStatus">Status</label>
                        <select id="editStatus" required>
                            <option value="active" ${user.isActive ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${!user.isActive ? 'selected' : ''}>Inactive</option>
                        </select>
                            </div>
                    <button type="submit" class="submit-button">
                        <i class="fas fa-save"></i>
                        Save Changes
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

    } catch (error) {
        console.error('Error editing user:', error);
        showError('Failed to edit user: ' + error.message);
    }
}

// Function to update a user
async function updateUser(userId) {
    try {
        const firstName = document.getElementById('editFirstName').value;
        const lastName = document.getElementById('editLastName').value;
        const email = document.getElementById('editEmail').value;
        const role = document.getElementById('editRole').value;
        const isActive = document.getElementById('editStatus').value === 'active';

        // Update the user
        await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
            firstName,
            lastName,
            email,
            role,
            isActive,
            updatedAt: serverTimestamp()
        });

        // Close the modal
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }

        // Reload users
        loadUsers();
        showSuccess('User updated successfully');

    } catch (error) {
        console.error('Error updating user:', error);
        showError('Failed to update user: ' + error.message);
    }
}

// Function to manage managers
async function manageManagers() {
    try {
        // Get all managers
        const managersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        const managers = managersSnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(user => user.role === 'manager');

        // Create and show the managers modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Manage Managers</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="managers-list">
                    ${managers.length === 0 ? '<div class="empty-state">No managers found</div>' : ''}
                    ${managers.map(manager => `
                        <div class="list-item">
                            <div class="list-item-content">
                                <div class="list-item-title">
                                    <i class="fas fa-user-tie"></i>
                                    ${manager.firstName} ${manager.lastName}
                                </div>
                                <div class="list-item-subtitle">
                                    <div>Email: ${manager.email}</div>
                                    <div>Status: ${manager.isActive ? 'Active' : 'Inactive'}</div>
                                </div>
                            </div>
                            <div class="list-item-actions">
                                <button onclick="editUser('${manager.id}')" class="action-button edit-button">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteUser('${manager.id}')" class="action-button delete-button">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

    } catch (error) {
        console.error('Error managing managers:', error);
        showError('Failed to load managers: ' + error.message);
    }
}

// Function to view user details
async function viewUserDetails(userId) {
    try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
        if (!userDoc.exists()) {
            showError('User not found');
            return;
        }

        const user = userDoc.data();
        const currentUser = auth.currentUser;
        const currentUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, currentUser.uid));
        const currentUserData = currentUserDoc.data();
        const isAdmin = currentUserData.role === 'admin';

        // Create and show the modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>User Details</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="user-details">
                    <div class="detail-group">
                        <label>Name:</label>
                        <span>${user.firstName} ${user.lastName}</span>
                    </div>
                    <div class="detail-group">
                        <label>Email:</label>
                        <span>${user.email}</span>
                    </div>
                    <div class="detail-group">
                        <label>Role:</label>
                        <span class="user-role ${user.role || 'user'}">${user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</span>
                    </div>
                    <div class="detail-group">
                        <label>Status:</label>
                        <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div class="detail-group">
                        <label>Created:</label>
                        <span>${user.createdAt ? user.createdAt.toDate().toLocaleString() : 'N/A'}</span>
                    </div>
                    <div class="detail-group">
                        <label>Last Active:</label>
                        <span>${user.lastActive ? user.lastActive.toDate().toLocaleString() : 'Never'}</span>
                    </div>
                </div>
                ${isAdmin ? `
                    <div class="modal-actions">
                        <button onclick="editUser('${userId}')" class="action-button edit-button">
                            <i class="fas fa-edit"></i>
                            Edit User
                        </button>
                        <button onclick="deleteUser('${userId}')" class="action-button delete-button">
                            <i class="fas fa-trash"></i>
                            Delete User
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);

    } catch (error) {
        console.error('Error viewing user details:', error);
        showError('Failed to load user details: ' + error.message);
    }
}

// Make functions globally available
window.editUser = editUser;
window.updateUser = updateUser;
window.manageManagers = manageManagers;
window.viewUserDetails = viewUserDetails;
window.deleteUser = deleteUser;

// Add styles for the modal
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .modal-content {
        background-color: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        max-width: 500px;
        width: 90%;
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #f3f4f6;
    }

    .modal-header h2 {
        margin: 0;
        color: #1f2937;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .close-modal {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: #6b7280;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.2s;
    }

    .close-modal:hover {
        background-color: #f3f4f6;
        color: #1f2937;
    }

    .user-details {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .detail-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .detail-group label {
        font-weight: 500;
        color: #6b7280;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .detail-group span {
        color: #1f2937;
        font-size: 1rem;
        padding: 0.5rem;
        background-color: #f9fafb;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
    }

    .status-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
        text-align: center;
        min-width: 100px;
    }

    .status-badge.active {
        background-color: #dcfce7;
        color: #166534;
        border: 1px solid #86efac;
    }

    .status-badge.inactive {
        background-color: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
    }

    .user-role {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
        text-align: center;
        min-width: 100px;
        background-color: #e0e7ff;
        color: #3730a3;
        border: 1px solid #c7d2fe;
    }

    .modal-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 2px solid #f3f4f6;
    }

    .modal-actions .action-button {
        flex: 1;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s;
        font-size: 0.875rem;
    }

    .modal-actions .edit-button {
        background-color: #e0e7ff;
        color: #3730a3;
    }

    .modal-actions .edit-button:hover {
        background-color: #c7d2fe;
    }

    .modal-actions .delete-button {
        background-color: #fee2e2;
        color: #991b1b;
    }

    .modal-actions .delete-button:hover {
        background-color: #fca5a5;
    }
`;
document.head.appendChild(modalStyles);

// Function to load regions
async function loadRegions() {
    try {
        const regionsContainer = document.getElementById('regionsList');
        if (!regionsContainer) {
            console.error('Regions container not found');
            return;
        }

        // Clear existing content
        regionsContainer.innerHTML = '<div class="loading">Loading regions...</div>';

        // Get regions from Firestore
        const regionsSnapshot = await getDocs(collection(db, COLLECTIONS.REGIONS));
        const regions = regionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Update UI
        if (regions.length === 0) {
            regionsContainer.innerHTML = '<div class="empty-state">No regions found</div>';
            return;
        }

        // Create regions list
        regionsContainer.innerHTML = ''; // Clear loading state

        regions.forEach(region => {
            const regionCard = document.createElement('div');
            regionCard.className = 'list-item';
            regionCard.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">
                        <i class="fas fa-map-marker-alt"></i>
                        ${region.name}
                    </div>
                    <div class="list-item-subtitle">
                        ${region.subtitle || 'No subtitle'}
                    </div>
                </div>
                <div class="list-item-actions">
                    <button onclick="editRegion('${region.id}')" class="action-button edit-button">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteRegion('${region.id}')" class="action-button delete-button">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            regionsContainer.appendChild(regionCard);
        });

    } catch (error) {
        console.error('Error loading regions:', error);
        showError('Failed to load regions');
    }
}

// Function to load time slots
async function loadTimeSlots() {
    try {
        const timeSlotsList = document.getElementById('timeSlotsList');
        if (!timeSlotsList) return;

        timeSlotsList.innerHTML = '<div class="loading">Loading time slots...</div>';

        // Get the selected day and region filters
        const selectedDay = document.querySelector('.day-nav-button.active')?.dataset.day || 'all';
        const selectedRegion = document.querySelector('.region-nav-button.active')?.dataset.region || 'all';

        // Build the query
        let timeSlotsRef = collection(db, COLLECTIONS.TIME_SLOTS);
        let constraints = [];
        
        // Apply day filter if not "all"
        if (selectedDay !== 'all') {
            if (selectedDay === 'same-day') {
                const today = new Date();
                const dayName = WEEKDAYS[today.getDay()];
                constraints.push(where('day', '==', dayName));
            } else {
                constraints.push(where('day', '==', selectedDay));
            }
        }
        
        // Apply region filter if not "all"
        if (selectedRegion !== 'all') {
            constraints.push(where('region', '==', selectedRegion));
        }

        // Create the query with all constraints
        const q = query(timeSlotsRef, ...constraints);
        const snapshot = await getDocs(q);
        
        const timeSlots = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (timeSlots.length === 0) {
            timeSlotsList.innerHTML = '<div class="empty-state">No time slots found</div>';
            return;
        }

        // Sort time slots by day and time
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        timeSlots.sort((a, b) => {
            const dayCompare = days.indexOf(a.day) - days.indexOf(b.day);
            if (dayCompare !== 0) return dayCompare;
            return a.time.localeCompare(b.time);
        });

        // Create time slots list
        timeSlotsList.innerHTML = timeSlots.map(slot => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">
                        <i class="far fa-clock"></i>
                        ${slot.day} at ${slot.time}
                        <span class="badge ${slot.availableSlots <= 2 ? 'warning' : 'success'}">
                            ${slot.availableSlots} slots available
                        </span>
                    </div>
                    <div class="list-item-subtitle">
                        <div>Region: ${slot.region}</div>
                        <div>Product: ${slot.product}</div>
                        <div>Duration: ${slot.duration} minutes</div>
                        <div>Total Slots: ${slot.maxSlots}</div>
                    </div>
                </div>
                <div class="list-item-actions">
                    <button onclick="editTimeSlot('${slot.id}')" class="action-button edit-button">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTimeSlot('${slot.id}')" class="action-button delete-button">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading time slots:', error);
        showError('Failed to load time slots');
    }
}

// Function to filter time slots
function filterTimeSlots() {
    const regionFilter = document.getElementById('regionFilter').value;
    const viewFilter = document.getElementById('viewFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    console.log('Filtering with:', { regionFilter, viewFilter, statusFilter });

    window.filteredTimeSlots = window.allTimeSlots.filter(slot => {
        // Region filter
        if (regionFilter !== 'all') {
            const region = window.allRegions.find(r => r.id === regionFilter);
            if (!region || slot.regionId !== region.id) {
                return false;
            }
        }

        // Time of day filter
        if (viewFilter !== 'all' && slot.time) {
            const [hours] = slot.time.split(':').map(Number);
            if (viewFilter === 'morning' && (hours < 6 || hours >= 12)) return false;
            if (viewFilter === 'afternoon' && (hours < 12 || hours >= 18)) return false;
            if (viewFilter === 'evening' && (hours < 18 || hours >= 24)) return false;
        }

        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'available' && !slot.isAvailable) return false;
            if (statusFilter === 'booked' && slot.isAvailable) return false;
        }

        return true;
    });

    console.log('Filtered time slots:', window.filteredTimeSlots);
    displayFilteredTimeSlots();
}

// Function to display filtered time slots
function displayFilteredTimeSlots() {
    const timeSlotsList = document.getElementById('timeSlotsListContent');
    if (!timeSlotsList) return;

    // Sort filtered time slots
    window.filteredTimeSlots.sort((a, b) => {
        const timeToMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const [hours, minutes] = timeStr.split(':').map(Number);
            return (hours || 0) * 60 + (minutes || 0);
        };

        const timeA = timeToMinutes(a.time);
        const timeB = timeToMinutes(b.time);
        return timeA - timeB;
    });

        // Update UI
    if (window.filteredTimeSlots.length === 0) {
        timeSlotsList.innerHTML = '<div class="empty-state">No time slots match the current filters</div>';
            return;
        }

    timeSlotsList.innerHTML = '';
    window.filteredTimeSlots.forEach(slot => {
        const region = window.allRegions.find(r => r.id === slot.regionId);
            const slotCard = document.createElement('div');
        slotCard.className = 'list-item';
            slotCard.innerHTML = `
            <div class="list-item-content">
                <div class="list-item-title">
                    <i class="fas fa-clock"></i>
                    ${slot.time || 'No time'} (${slot.duration || 0} min)
                    <span class="slot-status ${slot.isAvailable ? 'active' : 'inactive'}">
                        ${slot.isAvailable ? 'Available' : 'Booked'}
                    </span>
                </div>
                <div class="list-item-subtitle">
                    <div>Region: ${region ? region.name : 'No region'}</div>
                    <div>Product: ${slot.product || 'No product'}</div>
                    <div>Available Slots: ${slot.availableSlots || 0} / ${slot.maxSlots || 'Unlimited'}</div>
                </div>
            </div>
            <div class="list-item-actions">
                <button onclick="editTimeSlot('${slot.id}')" class="action-button edit-button">
                    <i class="fas fa-edit"></i>
                    </button>
                <button onclick="deleteTimeSlot('${slot.id}')" class="action-button delete-button">
                    <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            timeSlotsList.appendChild(slotCard);
        });
}

// Add styles for filters
const filterStyles = document.createElement('style');
filterStyles.textContent = `
    .filter-controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .filter-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .filter-group label {
        font-weight: 500;
        color: #374151;
    }

    .filter-group select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        min-width: 150px;
    }

    .filter-group select:focus {
        outline: none;
        border-color: #8b5cf6;
        box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
    }

    #timeSlotsListContent {
        margin-top: 1rem;
    }

    .empty-state {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
        font-style: italic;
    }
`;
document.head.appendChild(filterStyles);

// Make functions globally available
window.loadTimeSlots = loadTimeSlots;
window.filterTimeSlots = filterTimeSlots;
window.displayFilteredTimeSlots = displayFilteredTimeSlots;

// Function to load managers
async function loadManagers() {
    try {
        const managersContainer = document.getElementById('managersList');
        if (!managersContainer) {
            console.error('Managers container not found');
            return;
        }

        // Clear existing content
        managersContainer.innerHTML = '<div class="loading">Loading managers...</div>';

        // Get all managers
        const managersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        const managers = managersSnapshot.docs
            .map(doc => ({
            id: doc.id,
            ...doc.data()
            }))
            .filter(user => user.role === 'manager');

        // Update UI
        if (managers.length === 0) {
            managersContainer.innerHTML = '<div class="empty-state">No managers found</div>';
            return;
        }

        // Create managers list
        managersContainer.innerHTML = '';
        managers.forEach(manager => {
            const managerCard = document.createElement('div');
            managerCard.className = 'list-item';
            managerCard.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">
                        <i class="fas fa-user-tie"></i>
                        ${manager.firstName} ${manager.lastName}
                        <span class="user-role manager">Manager</span>
                    </div>
                    <div class="list-item-subtitle">
                        <div>Email: ${manager.email}</div>
                        <div>Status: ${manager.isActive ? 'Active' : 'Inactive'}</div>
                        <div>Last Active: ${manager.lastActive ? manager.lastActive.toDate().toLocaleString() : 'Never'}</div>
                    </div>
                </div>
                <div class="list-item-actions">
                    <button onclick="viewUserDetails('${manager.id}')" class="action-button view-button">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editUser('${manager.id}')" class="action-button edit-button">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteUser('${manager.id}')" class="action-button delete-button">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            managersContainer.appendChild(managerCard);
        });

    } catch (error) {
        console.error('Error loading managers:', error);
        showError('Failed to load managers');
    }
}

// Function to show add manager modal
function showAddManagerModal() {
    const modal = document.getElementById('managerModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Function to close manager modal
function closeManagerModal() {
    const modal = document.getElementById('managerModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('managerForm').reset();
    }
}

// Function to add a new manager
async function addManager() {
    try {
        const email = document.getElementById('managerEmail').value;
        const password = document.getElementById('managerPassword').value;
        const name = document.getElementById('managerName').value;
        const phone = document.getElementById('managerPhone').value;

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Add manager data to Firestore
        await setDoc(doc(db, COLLECTIONS.MANAGERS, user.uid), {
            email,
            name,
            phone,
            role: 'manager',
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp(),
            isActive: true
        });

        // Close modal and refresh list
        closeManagerModal();
        loadManagers();
        showSuccess('Manager added successfully');

    } catch (error) {
        console.error('Error adding manager:', error);
        showError('Failed to add manager: ' + error.message);
    }
}

// Function to view manager details
async function viewManagerDetails(managerId) {
    try {
        const managerDoc = await getDoc(doc(db, COLLECTIONS.MANAGERS, managerId));
        if (!managerDoc.exists()) {
            showError('Manager not found');
            return;
        }

        const manager = managerDoc.data();
        alert(`
            Manager Details:
            Name: ${manager.name}
            Email: ${manager.email}
            Phone: ${manager.phone}
            Role: ${manager.role}
            Created: ${manager.createdAt?.toDate().toLocaleString() || 'N/A'}
            Last Active: ${manager.lastActive?.toDate().toLocaleString() || 'N/A'}
            Status: ${manager.isActive ? 'Active' : 'Inactive'}
        `);

    } catch (error) {
        console.error('Error viewing manager details:', error);
        showError('Failed to load manager details');
    }
}

// Function to delete a manager
async function deleteManager(managerId) {
    if (!confirm('Are you sure you want to delete this manager?')) {
        return;
    }

    try {
        // Delete from Firestore
        await deleteDoc(doc(db, COLLECTIONS.MANAGERS, managerId));
        
        // Delete from Firebase Auth
        await deleteUser(auth.currentUser);

        // Refresh the list
        loadManagers();
        showSuccess('Manager deleted successfully');

    } catch (error) {
        console.error('Error deleting manager:', error);
        showError('Failed to delete manager: ' + error.message);
    }
}

// Make functions globally available
window.loadManagers = loadManagers;
window.showAddManagerModal = showAddManagerModal;
window.closeManagerModal = closeManagerModal;
window.addManager = addManager;
window.viewManagerDetails = viewManagerDetails;
window.deleteManager = deleteManager;

// Function to load integrations
async function loadIntegrations() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error('No user signed in');
            return;
        }

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
            console.error('User document not found');
            return;
        }

        const userData = userDoc.data();
        const integrations = userData.integrations || {};

        // Update SMS card
        const smsCard = document.getElementById('smsCard');
        if (smsCard) {
            const statusIndicator = smsCard.querySelector('.status-indicator');
            const statusText = smsCard.querySelector('.integration-status span');
            const connectButton = smsCard.querySelector('.connect-button');

            if (integrations.sms) {
                smsCard.classList.add('connected');
                smsCard.classList.remove('disconnected');
                statusIndicator.classList.add('connected');
                statusIndicator.classList.remove('disconnected');
                statusText.textContent = 'Connected';
                connectButton.innerHTML = '<i class="fas fa-check"></i> Connected';
                connectButton.classList.add('connected');
            } else {
                smsCard.classList.remove('connected');
                smsCard.classList.add('disconnected');
                statusIndicator.classList.remove('connected');
                statusIndicator.classList.add('disconnected');
                statusText.textContent = 'Not Connected';
                connectButton.innerHTML = '<i class="fas fa-link"></i> Connect';
                connectButton.classList.remove('connected');
            }
        }
    } catch (error) {
        console.error('Error loading integrations:', error);
    }
}

// Make functions globally available
window.connectSMS = async function() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('No user signed in');
        }

        const smsCard = document.getElementById('smsCard');
        const statusIndicator = smsCard.querySelector('.status-indicator');
        const statusText = smsCard.querySelector('.integration-status span');
        const connectButton = smsCard.querySelector('.connect-button');

        // Update UI to show connecting state
        connectButton.disabled = true;
        connectButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';

        // Update user document with SMS integration status
        await updateDoc(doc(db, 'users', currentUser.uid), {
            'integrations.sms': true,
            'integrations.smsConnectedAt': serverTimestamp()
        });

        // Update UI to show connected state
        smsCard.classList.add('connected');
        smsCard.classList.remove('disconnected');
        statusIndicator.classList.add('connected');
        statusIndicator.classList.remove('disconnected');
        statusText.textContent = 'Connected';
        connectButton.innerHTML = '<i class="fas fa-check"></i> Connected';
        connectButton.classList.add('connected');
        connectButton.disabled = false;

        showNotification('SMS integration connected successfully!', 'success');
    } catch (error) {
        console.error('Error connecting SMS:', error);
        showNotification('Failed to connect SMS integration. Please try again.', 'error');
        
        // Reset UI on error
        const smsCard = document.getElementById('smsCard');
        const connectButton = smsCard.querySelector('.connect-button');
        connectButton.disabled = false;
        connectButton.innerHTML = '<i class="fas fa-link"></i> Connect';
    }
};

// Add event listeners for day and region navigation
document.addEventListener('DOMContentLoaded', () => {
    // Day navigation
    const dayButtons = document.querySelectorAll('.day-nav-button');
    dayButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            dayButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            // Reload time slots with new filter
            loadTimeSlots();
        });
    });

    // Region navigation
    const regionButtons = document.querySelectorAll('.region-nav-button');
    regionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            regionButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            // Reload time slots with new filter
            loadTimeSlots();
        });
    });

    // Load regions for the region navigation
    loadRegionsForNavigation();

    // Add event listener for the Add Time Slot button
    const addTimeSlotBtn = document.querySelector('.view-schedule-button');
    if (addTimeSlotBtn) {
        addTimeSlotBtn.addEventListener('click', async () => {
            try {
                await loadRegionsForTimeSlotModal();
                document.getElementById('timeSlotModal').style.display = 'block';
            } catch (error) {
                console.error('Error opening time slot modal:', error);
                showError('Failed to open time slot modal');
            }
        });
    }
});

// Function to load regions for navigation
async function loadRegionsForNavigation() {
    try {
        const regionNav = document.querySelector('.region-navigation');
        if (!regionNav) return;

        // Get all regions
        const regionsSnapshot = await getDocs(collection(db, COLLECTIONS.REGIONS));
        const regions = regionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Clear existing buttons except "All Regions"
        const allRegionsButton = regionNav.querySelector('.region-nav-button[data-region="all"]');
        regionNav.innerHTML = '';
        if (allRegionsButton) {
            regionNav.appendChild(allRegionsButton);
        }

        // Add region buttons
        regions.forEach(region => {
            const button = document.createElement('button');
            button.className = 'region-nav-button';
            button.dataset.region = region.name;
            button.textContent = region.name;
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                document.querySelectorAll('.region-nav-button').forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');
                // Reload time slots with new filter
                loadTimeSlots();
            });
            regionNav.appendChild(button);
        });
    } catch (error) {
        console.error('Error loading regions for navigation:', error);
        showError('Failed to load regions');
    }
}

// Function to load regions into the time slot modal
async function loadRegionsForTimeSlotModal() {
    try {
        console.log('Starting to load regions...');
        const regionSelect = document.getElementById('timeSlotRegion');
        if (!regionSelect) {
            console.error('Region select element not found');
            return;
        }

        // Clear existing options
        regionSelect.innerHTML = '<option value="">Select Region</option>';

        // Get all regions from the database
        const regionsRef = collection(db, COLLECTIONS.REGIONS);
        console.log('Fetching regions from Firestore...');
        
        const regionsSnapshot = await getDocs(regionsRef);
        console.log('Found regions:', regionsSnapshot.size);
        
        if (regionsSnapshot.empty) {
            console.log('No regions found, creating default regions...');
            // Create default regions
            const defaultRegions = [
                { name: 'North Region', isActive: true },
                { name: 'South Region', isActive: true },
                { name: 'East Region', isActive: true },
                { name: 'West Region', isActive: true }
            ];

            // Add each default region
            for (const region of defaultRegions) {
                try {
                    await addDoc(regionsRef, {
                        name: region.name,
                        isActive: true,
                        createdAt: serverTimestamp()
                    });
                    console.log(`Added region: ${region.name}`);
                } catch (error) {
                    console.error(`Error adding region ${region.name}:`, error);
                }
            }
            
            // Fetch the newly created regions
            const newRegionsSnapshot = await getDocs(regionsRef);
            newRegionsSnapshot.forEach(doc => {
                const region = doc.data();
                const option = document.createElement('option');
                option.value = region.name;
                option.textContent = region.name;
                regionSelect.appendChild(option);
                console.log(`Added option for region: ${region.name}`);
            });
        } else {
            // Add existing regions to the select
            regionsSnapshot.forEach(doc => {
                const region = doc.data();
                const option = document.createElement('option');
                option.value = region.name;
                option.textContent = region.name;
                regionSelect.appendChild(option);
                console.log(`Added option for existing region: ${region.name}`);
            });
        }

        console.log('Regions loaded successfully');
    } catch (error) {
        console.error('Error loading regions:', error);
        showError('Failed to load regions. Please try again.');
    }
}

// Make functions globally available
window.editTimeSlot = editTimeSlot;
window.deleteTimeSlot = deleteTimeSlot;
window.loadRegionsForTimeSlotModal = loadRegionsForTimeSlotModal;

// Add this function to check if regions exist in the database
async function checkAndCreateDefaultRegions() {
    try {
        const regionsSnapshot = await getDocs(collection(db, COLLECTIONS.REGIONS));
        
        if (regionsSnapshot.empty) {
            // Create default regions if none exist
            const defaultRegions = [
                { name: 'North Region', isActive: true },
                { name: 'South Region', isActive: true },
                { name: 'East Region', isActive: true },
                { name: 'West Region', isActive: true }
            ];

            for (const region of defaultRegions) {
                await addDoc(collection(db, COLLECTIONS.REGIONS), {
                    ...region,
                    createdAt: serverTimestamp()
                });
            }
            console.log('Default regions created');
        }
    } catch (error) {
        console.error('Error checking/creating regions:', error);
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    await checkAndCreateDefaultRegions();
    // ... rest of your initialization code ...
});

// Function to initialize time slot functionality
function initializeTimeSlotFunctionality() {
    const addTimeSlotBtn = document.getElementById('addTimeSlotBtn');
    if (addTimeSlotBtn) {
        addTimeSlotBtn.addEventListener('click', async () => {
            try {
                console.log('Opening time slot modal...');
                const modal = document.getElementById('timeSlotModal');
                if (!modal) {
                    console.error('Time slot modal not found');
                    return;
                }

                // Show the modal first
                modal.style.display = 'block';
                
                // Then load regions
                await loadRegionsForTimeSlotModal();
                
                console.log('Modal opened and regions loaded');
            } catch (error) {
                console.error('Error opening time slot modal:', error);
                showError('Failed to open time slot modal');
            }
        });
    }

    // Initialize regions when the page loads
    initializeRegions();
}

// Add this to check if the regions collection exists and create it if needed
async function initializeRegions() {
    try {
        console.log('Initializing regions...');
        const regionsRef = collection(db, 'regions');
        const regionsSnapshot = await getDocs(regionsRef);
        
        if (regionsSnapshot.empty) {
            console.log('Creating initial regions...');
            const defaultRegions = [
                { name: 'North Region', isActive: true },
                { name: 'South Region', isActive: true },
                { name: 'East Region', isActive: true },
                { name: 'West Region', isActive: true }
            ];

            for (const region of defaultRegions) {
                await addDoc(regionsRef, {
                    name: region.name,
                    isActive: true,
                    createdAt: serverTimestamp()
                });
                console.log(`Created region: ${region.name}`);
            }
        }
    } catch (error) {
        console.error('Error initializing regions:', error);
    }
}

// Call initializeTimeSlotFunctionality when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeTimeSlotFunctionality();
});

// Add initialization function
async function initializeDashboard() {
    try {
        // Load all necessary data
        await Promise.all([
            loadDashboardStats(),
            loadRegions(),
            loadTimeSlots(),
            loadUsers(),
            loadManagers(),
            loadIntegrations()
        ]);
        
        // Initialize any UI components
        initializeTimeSlotFunctionality();
        initializeRegions();
        
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to initialize dashboard');
    }
}

// Call initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await initializeDashboard();
        } else {
            window.location.href = 'login.html';
        }
    });
});

// Initialize active users section
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing active users section');
    // Initial load of active users
    loadActiveUsers();
    
    // Set up periodic refresh
    setInterval(loadActiveUsers, 30000); // Refresh every 30 seconds
    
    // Set up event listeners for filters
    const searchInput = document.getElementById('activeUserSearch');
    const roleFilter = document.getElementById('activeUserRoleFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            loadActiveUsers();
        }, 300));
    }
    
    if (roleFilter) {
        roleFilter.addEventListener('change', () => {
            loadActiveUsers();
        });
    }
});