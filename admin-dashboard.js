// Load Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAN7eGZ8KuVug7My2_-GPg7DC3pVPIWTo4",
    authDomain: "booking-b1567.firebaseapp.com",
    projectId: "booking-b1567",
    storageBucket: "booking-b1567.firebasestorage.app",
    messagingSenderId: "1027148740103",
    appId: "1:1027148740103:web:2b580beab39f01a0b6dca2",
    measurementId: "G-X1BE24TK3Q"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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
    MANAGERS: 'managers'  // Add the new managers collection
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
        console.log('Edit region clicked:', regionId);

        // Get the current user's role
        const currentUser = auth.currentUser;
        if (!currentUser) {
            showError('You must be logged in to edit regions');
            return;
        }

        const currentUserDoc = await db.collection(COLLECTIONS.USERS).doc(currentUser.uid).get();
        const currentUserData = currentUserDoc.data();
        const isManager = currentUserData.role === 'manager';
        const isAdmin = currentUserData.role === 'admin';

        // Check if user has permission
        if (!isManager && !isAdmin) {
            showError('You do not have permission to edit regions');
            return;
        }

        // Get region data
        const regionDoc = await db.collection(COLLECTIONS.REGIONS).doc(regionId).get();
        if (!regionDoc.exists) {
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
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Region</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="editRegionForm">
                        <div class="form-group">
                            <label for="editRegionName">Region Name</label>
                            <input type="text" id="editRegionName" value="${region.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="editRegionSubtitle">Subtitle (Optional)</label>
                            <input type="text" id="editRegionSubtitle" value="${region.subtitle || ''}">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="submit-button" onclick="updateRegion('${regionId}')">
                                <i class="fas fa-save"></i>
                                Save Changes
                            </button>
                            <button type="button" class="cancel-button" onclick="this.closest('.modal').remove()">
                                <i class="fas fa-times"></i>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Ensure the input values are set after the modal is added to the DOM
        const nameInput = document.getElementById('editRegionName');
        const subtitleInput = document.getElementById('editRegionSubtitle');
        
        if (nameInput && subtitleInput) {
            nameInput.value = region.name || '';
            subtitleInput.value = region.subtitle || '';
            console.log('Set form values:', { name: nameInput.value, subtitle: subtitleInput.value });
        }

        // Add modal styles if they don't exist
        if (!document.getElementById('modalStyles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'modalStyles';
            styleSheet.textContent = `
                .modal {
                    display: flex;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    width: 90%;
                    max-width: 500px;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .modal-header h2 {
                    margin: 0;
                    color: #333;
                }

                .close-modal {
                    background: none;
                    border: none;
                    font-size: 1.25rem;
                    color: #666;
                    cursor: pointer;
                    padding: 0.5rem;
                    transition: color 0.2s;
                }

                .close-modal:hover {
                    color: #333;
                }

                .modal-body {
                    margin-bottom: 1.5rem;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: #333;
                }

                .form-group input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                    background-color: #fff;
                    color: #333;
                }

                .form-group input:focus {
                    border-color: #4f46e5;
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
                }

                .form-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 2rem;
                }

                .submit-button, .cancel-button {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: 4px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .submit-button {
                    background-color: #4f46e5;
                    color: white;
                }

                .submit-button:hover {
                    background-color: #4338ca;
                    transform: translateY(-2px);
                }

                .cancel-button {
                    background-color: #f3f4f6;
                    color: #333;
                }

                .cancel-button:hover {
                    background-color: #e5e7eb;
                    transform: translateY(-2px);
                }
            `;
            document.head.appendChild(styleSheet);
        }

    } catch (error) {
        console.error('Error editing region:', error);
        showError('Failed to load region for editing');
    }
}

// Make sure the function is available globally
window.editRegion = editRegion;

async function updateRegion(regionId) {
    try {
        console.log('Starting region update for ID:', regionId);
        
        // Get form inputs
        const nameInput = document.getElementById('editRegionName');
        const subtitleInput = document.getElementById('editRegionSubtitle');
        
        if (!nameInput || !subtitleInput) {
            console.error('Form inputs not found:', { nameInput, subtitleInput });
            showError('Form inputs not found');
            return;
        }

        const name = nameInput.value.trim();
        const subtitle = subtitleInput.value.trim();

        console.log('Form values:', { name, subtitle });

        // Validate inputs
        if (!name) {
            showError('Region name is required');
            return;
        }

        // Get region reference
        const regionRef = db.collection(COLLECTIONS.REGIONS).doc(regionId);
        
        // Check if region exists
        const regionDoc = await regionRef.get();
        if (!regionDoc.exists) {
            console.error('Region not found:', regionId);
            showError('Region not found');
            return;
        }

        console.log('Current region data:', regionDoc.data());

        // Update the region
        try {
            // First, verify we can write to the document
            await regionRef.set({
                name: name,
                subtitle: subtitle,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Verify the update was successful
            const updatedDoc = await regionRef.get();
            const updatedData = updatedDoc.data();
            
            console.log('Updated region data:', updatedData);
            
            if (updatedData.name !== name || updatedData.subtitle !== subtitle) {
                throw new Error('Update verification failed - data mismatch');
            }

            console.log('Region update verified successfully');
        } catch (updateError) {
            console.error('Error during region update:', updateError);
            showError('Failed to update region: ' + updateError.message);
            return;
        }

        // Close the modal
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }

        // Show success message
        showSuccess('Region updated successfully');

        // Reload regions
        try {
            await loadRegions();
            console.log('Regions reloaded successfully');
        } catch (reloadError) {
            console.error('Error reloading regions:', reloadError);
            showError('Region updated but failed to refresh the list');
        }
    } catch (error) {
        console.error('Error in updateRegion:', error);
        showError('Failed to update region: ' + error.message);
    }
}

// Make sure the function is available globally
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
    const duration = parseInt(document.getElementById('timeSlotDuration').value);
    const region = document.getElementById('timeSlotRegion').value;
    const product = document.getElementById('timeSlotProduct').value;
    const maxSlots = parseInt(document.getElementById('timeSlotMaxSlots').value);
        const availableSlots = parseInt(document.getElementById('timeSlotAvailableSlots').value);
        const day = document.getElementById('timeSlotDay').value;

        // Validate region exists
        const regionDoc = await db.collection(COLLECTIONS.REGIONS)
            .where('name', '==', region)
            .get();

        if (regionDoc.empty) {
            showError('Selected region does not exist');
            return;
        }

        // Add time slot
        await db.collection(COLLECTIONS.TIME_SLOTS).add({
            day,
            time,
            duration,
            region,
            product,
            maxSlots,
            availableSlots,
            isActive: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
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

async function editTimeSlot(timeSlotId) {
    try {
        const time = document.getElementById('editTimeSlotTime').value;
        const duration = parseInt(document.getElementById('editTimeSlotDuration').value);
        const region = document.getElementById('editTimeSlotRegion').value;
        const product = document.getElementById('editTimeSlotProduct').value;
        const maxSlots = parseInt(document.getElementById('editTimeSlotMaxSlots').value);
        const availableSlots = parseInt(document.getElementById('editTimeSlotAvailableSlots').value);

        await db.collection(COLLECTIONS.TIME_SLOTS).doc(timeSlotId).update({
            time,
            duration,
            region,
            product,
            maxSlots,
            availableSlots,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        closeEditTimeSlotModal();
        loadTimeSlots();
    } catch (error) {
        console.error('Error editing time slot:', error);
        showError('Failed to edit time slot');
    }
}

async function deleteTimeSlot(timeSlotId) {
    if (!confirm('Are you sure you want to delete this time slot?')) return;

    try {
        await db.collection(COLLECTIONS.TIME_SLOTS).doc(timeSlotId).delete();
        loadTimeSlots();
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

function showCreateAdminModal() {
    // Implement this function based on your requirements
    console.log('Show create admin modal');
}

// Global function to handle tab switching
function switchTab(tabId) {
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
    const selectedTab = document.getElementById(tabId + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to selected tab button
    const selectedButton = document.querySelector(`.tab-button[onclick="switchTab('${tabId}')"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }

    // Load content based on selected tab
    switch(tabId) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'users':
            loadUsers();
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
        const bookingsSnapshot = await db.collection(COLLECTIONS.BOOKINGS).get();
        const cancelledBookingsSnapshot = await db.collection(COLLECTIONS.CANCELLED_BOOKINGS).get();

        document.getElementById('totalBookings').textContent = bookingsSnapshot.size;
        document.getElementById('cancelledBookings').textContent = cancelledBookingsSnapshot.size;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showError('Failed to load dashboard statistics');
    }
}

// Add this function to check if user is a super admin
async function isSuperAdmin(userId) {
    try {
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
        const userData = userDoc.data();
        return userData && userData.role === 'super_admin';
    } catch (error) {
        console.error('Error checking super admin status:', error);
        return false;
    }
}

// Update the initializeDashboard function to handle the Create Admin button visibility
function initializeDashboard() {
    // ... existing initialization code ...
    
    // Check for weekly update needed
    checkWeeklyUpdateNeeded();
    
    // Set up daily check for weekly update
    setInterval(checkWeeklyUpdateNeeded, 24 * 60 * 60 * 1000); // Check every 24 hours

    // Hide Create Admin button for regular admins, only show for managers
    const createAdminButton = document.querySelector('.create-admin-button');
    if (createAdminButton) {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.uid).get();
                const userData = userDoc.data();
                const isManager = userData.role === 'manager';
                createAdminButton.style.display = isManager ? 'block' : 'none';
            }
        });
    }

    // Initialize integrations
    initializeIntegrations();
}

// Update the loadUsers function to handle admin creation visibility
async function loadUsers() {
    try {
        const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();
        const managersSnapshot = await db.collection(COLLECTIONS.MANAGERS).get();
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';

        // Check if current user is admin or manager
        const currentUser = auth.currentUser;
        const currentUserDoc = await db.collection(COLLECTIONS.USERS).doc(currentUser.uid).get();
        const currentUserData = currentUserDoc.data();
        const isAdmin = currentUserData.role === 'admin';
        const isManager = currentUserData.role === 'manager';

        // Show/hide Create Admin button based on role
        const createAdminBtn = document.getElementById('createAdminBtn');
        if (createAdminBtn) {
            createAdminBtn.style.display = isManager ? 'block' : 'none';
        }

        // Process regular users
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            if (user.role !== 'manager') { // Only show non-manager users
                const userElement = document.createElement('div');
                userElement.className = 'list-item';
                userElement.innerHTML = `
                    <div class="list-item-content">
                        <div class="list-item-title">
                            ${user.firstName} ${user.lastName}
                            <span class="user-role ${user.role}">${user.role || 'User'}</span>
                        </div>
                        <div class="list-item-subtitle">
                            ${user.email}<br>
                            Last Active: ${user.lastActive ? user.lastActive.toDate().toLocaleString() : 'Never'}
                        </div>
                    </div>
                    <div class="list-item-actions">
                        <button class="action-button view-button" onclick="viewUserDetails('${doc.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${(isAdmin || isManager) ? `
                            <button class="action-button edit-button" onclick="editUser('${doc.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        ${isManager ? `
                            <button class="action-button delete-button" onclick="deleteUser('${doc.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                `;
                usersList.appendChild(userElement);
            }
        });

        // Process managers
        managersSnapshot.forEach(doc => {
            const manager = doc.data();
            const managerElement = document.createElement('div');
            managerElement.className = 'list-item manager-item';
            managerElement.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">
                        ${manager.firstName} ${manager.lastName}
                        <span class="user-role manager">Manager</span>
                    </div>
                    <div class="list-item-subtitle">
                        ${manager.email}<br>
                        Last Active: ${manager.lastActive ? manager.lastActive.toDate().toLocaleString() : 'Never'}
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="action-button view-button" onclick="viewManagerDetails('${doc.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${isManager ? `
                        <button class="action-button edit-button" onclick="editManager('${doc.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-button delete-button" onclick="deleteManager('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            `;
            usersList.appendChild(managerElement);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

async function deleteUser(userId) {
    try {
        // Get the user data first
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
        if (!userDoc.exists) {
            showError('User not found');
            return;
        }

        const userData = userDoc.data();
        
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete ${userData.firstName} ${userData.lastName}? This action cannot be undone.`)) {
            return;
        }

        // Delete the user document
        await db.collection(COLLECTIONS.USERS).doc(userId).delete();
        
        // Show success message
        showSuccess('User deleted successfully');
        
        // Reload the users list
        await loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showError('Failed to delete user');
    }
}

// Make sure both functions are available globally
window.loadUsers = loadUsers;
window.deleteUser = deleteUser;

async function loadActiveUsers() {
    try {
        const activeUsersList = document.getElementById('activeUsersList');
        if (!activeUsersList) return;

        activeUsersList.innerHTML = '<div class="loading">Loading active users...</div>';
        const now = new Date();
        const activeThreshold = new Date(now.getTime() - (30 * 60 * 1000)); // 30 minutes ago

        // Set up real-time listener for users collection
        const usersRef = db.collection(COLLECTIONS.USERS);
        usersRef.onSnapshot(async (snapshot) => {
        const activeUsers = [];
            
            snapshot.forEach(doc => {
            const user = doc.data();
                const lastActive = user.lastActive ? user.lastActive.toDate() : null;
                
                // Consider user active if they've been active in the last 30 minutes
                if (lastActive && lastActive > activeThreshold) {
                activeUsers.push({
                    id: doc.id,
                        ...user,
                        lastActive
                });
            }
        });

            // Sort active users by last active time (most recent first)
            activeUsers.sort((a, b) => b.lastActive - a.lastActive);

            // Update active users count
            const activeUsersCount = document.getElementById('activeUsersCount');
            if (activeUsersCount) {
                activeUsersCount.textContent = activeUsers.length;
            }

        // Display active users
            if (activeUsers.length > 0) {
                activeUsersList.innerHTML = activeUsers.map(user => `
                    <div class="list-item">
                <div class="list-item-content">
                            <div class="list-item-title">
                                ${user.firstName} ${user.lastName}
                                <span class="user-role ${user.role}">${user.role || 'User'}</span>
                            </div>
                    <div class="list-item-subtitle">
                                <div>Email: ${user.email}</div>
                                <div>Last Active: ${user.lastActive.toLocaleString()}</div>
                                <div>Time Since: ${getTimeSinceLastActive(user.lastActive)}</div>
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="action-button view-button" onclick="viewUserDetails('${user.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                    </div>
                `).join('');
            } else {
            activeUsersList.innerHTML = `
                <div class="no-data-message">
                    No active users in the last 30 minutes
                </div>
            `;
        }
        }, (error) => {
            console.error('Error listening to users:', error);
            showError('Failed to load active users');
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

// Add this function to view user details
async function viewUserDetails(userId) {
    try {
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
        if (!userDoc.exists) {
            showError('User not found');
            return;
        }

        const user = userDoc.data();
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>User Details</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="user-profile">
                        <div class="profile-header">
                            <div class="profile-icon">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div class="profile-info">
                                <h3>${user.firstName} ${user.lastName}</h3>
                                <span class="user-role ${user.role}">${user.role || 'User'}</span>
                            </div>
                        </div>
                        <div class="profile-details">
                            <div class="detail-item">
                                <i class="fas fa-envelope"></i>
                                <span>${user.email}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-phone"></i>
                                <span>${user.phone || 'Not provided'}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-clock"></i>
                                <span>Last Active: ${user.lastActive ? user.lastActive.toDate().toLocaleString() : 'Never'}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>Member Since: ${user.createdAt ? user.createdAt.toDate().toLocaleDateString() : 'Unknown'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error viewing user details:', error);
        showError('Failed to load user details');
    }
}

async function editUser(userId) {
    try {
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
        if (!userDoc.exists) {
            showError('User not found');
            return;
        }

        const user = userDoc.data();
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
                <div class="modal-body">
                    <form id="editUserForm" onsubmit="event.preventDefault(); updateUser('${userId}');">
                        <div class="form-group">
                            <label for="editFirstName">First Name</label>
                            <input type="text" id="editFirstName" value="${user.firstName}" required>
                        </div>
                        <div class="form-group">
                            <label for="editLastName">Last Name</label>
                            <input type="text" id="editLastName" value="${user.lastName}" required>
                        </div>
                        <div class="form-group">
                            <label for="editEmail">Email</label>
                            <input type="email" id="editEmail" value="${user.email}" required>
                        </div>
                        <div class="form-group">
                            <label for="editPhone">Phone</label>
                            <input type="tel" id="editPhone" value="${user.phone || ''}">
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
                            <label for="editPassword">New Password (leave blank to keep current)</label>
                            <input type="password" id="editPassword" minlength="6">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="submit-button">Save Changes</button>
                            <button type="button" class="cancel-button" onclick="this.closest('.modal').remove()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error editing user:', error);
        showError('Failed to load user for editing');
    }
}

async function updateUser(userId) {
    try {
        const firstName = document.getElementById('editFirstName').value;
        const lastName = document.getElementById('editLastName').value;
        const email = document.getElementById('editEmail').value;
        const phone = document.getElementById('editPhone').value;
        const role = document.getElementById('editRole').value;
        const newPassword = document.getElementById('editPassword').value;

        // Update user data in Firestore
        await db.collection(COLLECTIONS.USERS).doc(userId).update({
            firstName,
            lastName,
            email,
            phone,
            role,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // If password is provided, update it
        if (newPassword) {
            // Note: This requires Firebase Admin SDK on the backend
            // You'll need to implement a Cloud Function to handle password updates
            showError('Password updates must be handled by an administrator');
        }

        // Close modal and refresh user list
        document.querySelector('.modal').remove();
        loadUsers();
        showSuccess('User updated successfully');
    } catch (error) {
        console.error('Error updating user:', error);
        showError('Failed to update user');
}
}

// Make the new functions available globally
window.viewUserDetails = viewUserDetails;
window.editUser = editUser;
window.updateUser = updateUser;

async function loadRegions() {
    try {
        console.log('Loading regions...'); // Debug log
        const regionsSnapshot = await db.collection(COLLECTIONS.REGIONS).get();
        const regionsList = document.getElementById('regionsList');
        if (!regionsList) {
            console.error('Regions list element not found');
            return;
        }

        regionsList.innerHTML = '';

        if (regionsSnapshot.empty) {
            regionsList.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-map-marker-alt"></i>
                    <p>No regions found. Add your first region using the form above.</p>
                </div>
            `;
            return;
        }

        // Create a container for the regions
        const regionsContainer = document.createElement('div');
        regionsContainer.className = 'regions-grid';

        regionsSnapshot.forEach(doc => {
            const region = doc.data();
            console.log('Loading region:', region); // Debug log

            const regionElement = document.createElement('div');
            regionElement.className = 'region-card';
            regionElement.innerHTML = `
                <div class="region-content">
                    <div class="region-header">
                        <h3 class="region-name">${region.name}</h3>
                        <div class="region-actions">
                    <button class="action-button edit-button" onclick="editRegion('${doc.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-button delete-button" onclick="deleteRegion('${doc.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                        </div>
                    </div>
                    ${region.subtitle ? `
                        <div class="region-subtitle">
                            <i class="fas fa-info-circle"></i>
                            ${region.subtitle}
                        </div>
                    ` : ''}
                    <div class="region-meta">
                        <span class="region-date">
                            <i class="fas fa-calendar"></i>
                            Created: ${region.createdAt ? region.createdAt.toDate().toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                </div>
            `;
            regionsContainer.appendChild(regionElement);
        });

        regionsList.appendChild(regionsContainer);

        // Add styles if they don't exist
        if (!document.getElementById('regionsStyles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'regionsStyles';
            styleSheet.textContent = `
                .regions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                    padding: 1rem;
                }

                .region-card {
                    background: white;
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    border: 1px solid var(--border-color);
                }

                .region-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-lg);
                }

                .region-content {
                    padding: 1.5rem;
                }

                .region-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }

                .region-name {
                    margin: 0;
                    font-size: 1.25rem;
                    color: var(--text-color);
                }

                .region-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .action-button {
                    background: none;
                    border: none;
                    padding: 0.5rem;
                    cursor: pointer;
                    color: var(--text-light);
                    transition: color 0.2s ease;
                }

                .action-button:hover {
                    color: var(--primary-color);
                }

                .edit-button:hover {
                    color: var(--primary-color);
                }

                .delete-button:hover {
                    color: #dc2626;
                }

                .region-subtitle {
                    color: var(--text-light);
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .region-meta {
                    font-size: 0.75rem;
                    color: var(--text-light);
                }

                .region-date {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .no-data-message {
                    text-align: center;
                    padding: 3rem;
                    color: var(--text-light);
                }

                .no-data-message i {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    color: var(--primary-color);
                }

                @media (max-width: 768px) {
                    .regions-grid {
                        grid-template-columns: 1fr;
                        padding: 0.5rem;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        console.log('Regions loaded successfully'); // Debug log
    } catch (error) {
        console.error('Error loading regions:', error);
        showError('Failed to load regions');
    }
}

// Make sure the function is available globally
window.loadRegions = loadRegions;

async function loadTimeSlots() {
    try {
        // Reset filters
        currentDayFilter = 'all';
        currentRegionFilter = 'all';

        // Get the time slots list element
        const timeSlotsList = document.getElementById('timeSlotsList');
        if (!timeSlotsList) {
            console.log('Time slots list element not found - tab may not be active');
            return;
        }

        // Add the Next Week's Board button next to Add Time Slot
        const addTimeSlotButton = document.querySelector('.add-time-slot-button');
        if (addTimeSlotButton) {
            // Remove existing button if it exists
            const existingButton = document.querySelector('.next-week-button');
            if (existingButton) {
                existingButton.remove();
            }

            // Create and add the new button
            const nextWeekButton = document.createElement('button');
            nextWeekButton.className = 'action-button next-week-button';
            nextWeekButton.innerHTML = `
                <i class="fas fa-calendar-plus"></i>
                Next Week's Board
            `;
            nextWeekButton.onclick = manageNextWeekBoard;
            addTimeSlotButton.parentNode.insertBefore(nextWeekButton, addTimeSlotButton.nextSibling);
        }

        // First, load regions for the navigation and modal
        const regionsSnapshot = await db.collection(COLLECTIONS.REGIONS).get();
        const regionNav = document.querySelector('.region-navigation');
        const regionSelect = document.getElementById('timeSlotRegion');
        
        if (regionNav) {
        // Clear existing options
        regionNav.innerHTML = '<button class="region-nav-button active" data-region="all">All Regions</button>';
        
            // Add regions to navigation
        regionsSnapshot.forEach(doc => {
            const region = doc.data();
            const navButton = document.createElement('button');
            navButton.className = 'region-nav-button';
            navButton.setAttribute('data-region', region.name);
            navButton.textContent = region.name;
            navButton.onclick = () => filterTimeSlotsByRegion(region.name);
            regionNav.appendChild(navButton);
            });
        }
        
        if (regionSelect) {
            // Clear existing options
            regionSelect.innerHTML = '';
            
            // Add regions to select
            regionsSnapshot.forEach(doc => {
                const region = doc.data();
            const option = document.createElement('option');
            option.value = region.name;
            option.textContent = region.name;
            regionSelect.appendChild(option);
        });
        }

        // Initialize day navigation
        const dayNav = document.querySelector('.day-navigation');
        if (dayNav) {
        dayNav.innerHTML = ''; // Clear existing buttons

        // Add "All Days" button
        const allDaysButton = document.createElement('button');
        allDaysButton.className = 'day-nav-button active';
        allDaysButton.setAttribute('data-day', 'all');
        allDaysButton.textContent = 'All Days';
        allDaysButton.onclick = () => filterTimeSlotsByDay('all');
        dayNav.appendChild(allDaysButton);

        // Add buttons for next 14 days (2 weeks)
        const days = getNextDays(14);
        days.forEach((date, index) => {
            const button = document.createElement('button');
            button.className = `day-nav-button ${isToday(date) ? 'today' : ''}`;
            button.setAttribute('data-day', date.toLocaleDateString('en-US', { weekday: 'long' }));
            button.innerHTML = `
                <i class="fas ${isToday(date) ? 'fa-calendar-day' : 'fa-calendar'}"></i>
                ${formatDate(date)}
            `;
            button.onclick = () => filterTimeSlotsByDay(button.getAttribute('data-day'));
            dayNav.appendChild(button);
        });
        }

        // Then load time slots
        const timeSlotsSnapshot = await db.collection(COLLECTIONS.TIME_SLOTS).get();
        timeSlotsList.innerHTML = '';

        // Group time slots by day
        const timeSlotsByDay = {};
        timeSlotsSnapshot.forEach(doc => {
            const timeSlot = doc.data();
            const day = timeSlot.day || 'Monday'; // Default to Monday if no day specified
            if (!timeSlotsByDay[day]) {
                timeSlotsByDay[day] = [];
            }
            timeSlotsByDay[day].push({ id: doc.id, ...timeSlot });
        });

        // Create sections for each day
        Object.keys(timeSlotsByDay).sort().forEach(day => {
            const daySection = document.createElement('div');
            daySection.className = 'day-section';
            daySection.innerHTML = `
                <div class="day-header">
                    <h3 class="day-title">${day}</h3>
                </div>
                <div class="time-slots-grid" id="timeSlots-${day}">
                </div>
            `;
            timeSlotsList.appendChild(daySection);

            // Add time slots for this day
            const dayGrid = document.getElementById(`timeSlots-${day}`);
            timeSlotsByDay[day].forEach(timeSlot => {
                const timeSlotElement = document.createElement('div');
                timeSlotElement.className = 'time-slot-card';
                timeSlotElement.innerHTML = `
                    <div class="time-slot-header">
                        <div class="time-slot-title">${timeSlot.time} - ${timeSlot.region}</div>
                        <div class="time-slot-actions">
                            <button class="action-button edit-button" onclick="editTimeSlot('${timeSlot.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-button delete-button" onclick="deleteTimeSlot('${timeSlot.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="time-slot-details">
                        <div>Product: ${timeSlot.product}</div>
                        <div>Duration: ${timeSlot.duration}min</div>
                        <div>Available: ${timeSlot.availableSlots}/${timeSlot.maxSlots}</div>
                    </div>
                `;
                dayGrid.appendChild(timeSlotElement);
            });
        });

        // Apply initial filters
        applyFilters();

    } catch (error) {
        console.error('Error loading time slots:', error);
        showError('Failed to load time slots');
    }
}

// Make sure the function is available globally
window.loadTimeSlots = loadTimeSlots;

// Update the filterTimeSlotsByRegion function
function filterTimeSlotsByRegion(region) {
    currentRegionFilter = region;
    
    // Update active state of region buttons
    document.querySelectorAll('.region-nav-button').forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-region') === region);
    });

    // Apply both day and region filters
    applyFilters();
}

// Update the filterTimeSlotsByDay function
function filterTimeSlotsByDay(day) {
    currentDayFilter = day;
    
    // Update active state of day buttons
    document.querySelectorAll('.day-nav-button').forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-day') === day);
    });

    // Apply both day and region filters
    applyFilters();
}

// Add new function to apply both filters
function applyFilters() {
    document.querySelectorAll('.day-section').forEach(section => {
        const sectionDay = section.querySelector('.day-title').textContent;
        const shouldShowDay = currentDayFilter === 'all' || sectionDay === currentDayFilter;
        
        // First check if the day section should be visible
        if (!shouldShowDay) {
            section.style.display = 'none';
            return;
        }

        // Then check each time slot within the visible day section
        let hasVisibleSlots = false;
        section.querySelectorAll('.time-slot-card').forEach(card => {
            const timeSlotRegion = card.querySelector('.time-slot-title').textContent.split(' - ')[1];
            const shouldShowRegion = currentRegionFilter === 'all' || timeSlotRegion === currentRegionFilter;
            
            card.style.display = shouldShowRegion ? 'block' : 'none';
            if (shouldShowRegion) {
                hasVisibleSlots = true;
            }
        });

        // Only show the day section if it has visible slots
        section.style.display = hasVisibleSlots ? 'block' : 'none';
    });
}

// Booking Modal Functions
function openBookingModal(region, product, time) {
    const modal = document.getElementById('bookingModal');
    if (!modal) {
        console.error('Booking modal element not found');
        return;
    }

    // Set modal content
    document.getElementById('modalRegion').textContent = region;
    document.getElementById('modalProduct').textContent = product;
    document.getElementById('modalTime').textContent = time;

    // Show modal
    modal.style.display = 'flex';
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Add these functions after the existing ones
async function checkWeeklyUpdateNeeded() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday
    
    // Check if it's Friday or Sunday
    if (dayOfWeek === 5 || dayOfWeek === 0) {
        // Get the last update timestamp
        const lastUpdateDoc = await db.collection('systemSettings').doc('lastWeeklyUpdate').get();
        const lastUpdate = lastUpdateDoc.exists ? lastUpdateDoc.data().timestamp.toDate() : null;
        
        // If no update has been done or last update was before today
        if (!lastUpdate || lastUpdate.getDate() !== today.getDate()) {
            showWeeklyUpdateNotification();
        }
    }
}

function showWeeklyUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'notification weekly-update-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-calendar-alt"></i>
            <div class="notification-text">
                <h4>Weekly Board Update Required</h4>
                <p>Please update the weekly board for the upcoming week.</p>
            </div>
            <button class="notification-action" onclick="updateWeeklyBoard()">
                Update Now
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 1 hour
    setTimeout(() => {
        notification.remove();
    }, 3600000);
}

async function updateWeeklyBoard() {
    try {
        // Get the next week's dates
        const today = new Date();
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() + (7 - today.getDay())); // Start from next Sunday
        
        // Create time slots for the next week
        const batch = db.batch();
        
        // For each day of the week
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(nextWeekStart);
            currentDate.setDate(nextWeekStart.getDate() + i);
            const dayName = WEEKDAYS[currentDate.getDay()];
            
            // Get all regions
            const regionsSnapshot = await db.collection(COLLECTIONS.REGIONS).get();
            
            // For each region
            regionsSnapshot.forEach(regionDoc => {
                const region = regionDoc.data();
                
                // For each product (Bathrooms and Roofing)
                ['Bathrooms', 'Roofing'].forEach(product => {
                    // Create time slots for each day
                    ['10:00 AM', '2:00 PM', '6:00 PM'].forEach(time => {
                        const timeSlotRef = db.collection(COLLECTIONS.TIME_SLOTS).doc();
                        batch.set(timeSlotRef, {
                            day: dayName,
                            time: time,
                            region: region.name,
                            product: product,
                            maxSlots: 5,
                            availableSlots: 5,
                            isActive: true,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            weekStartDate: nextWeekStart
                        });
                    });
                });
            });
        }
        
        // Update the last update timestamp
        const lastUpdateRef = db.collection('systemSettings').doc('lastWeeklyUpdate');
        batch.set(lastUpdateRef, {
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: auth.currentUser.uid
        });
        
        // Commit all changes
        await batch.commit();
        
        // Show success message
        showSuccess('Weekly board updated successfully!');
        
        // Reload time slots
        loadTimeSlots();
        
    } catch (error) {
        console.error('Error updating weekly board:', error);
        showError('Failed to update weekly board');
    }
}

// Make the new functions available globally
window.updateWeeklyBoard = updateWeeklyBoard;

// Add this function to manage next week's board
async function manageNextWeekBoard() {
    try {
        // Get the next week's dates
        const today = new Date();
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() + (7 - today.getDay())); // Start from next Sunday
        
        // Create a modal for next week's board management
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content next-week-board-modal">
                <div class="modal-header">
                    <h2>Next Week's Board Management</h2>
                    <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="week-info">
                        <p>Week of: ${nextWeekStart.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div class="board-actions">
                        <button class="action-button" onclick="updateNextWeekBoard()">
                            <i class="fas fa-sync"></i> Update Next Week's Board
                        </button>
                        <button class="action-button" onclick="viewNextWeekBoard()">
                            <i class="fas fa-eye"></i> View Next Week's Board
                        </button>
                    </div>
                    <div class="board-preview" id="nextWeekBoardPreview">
                        <!-- Board preview will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Load the preview
        await loadNextWeekBoardPreview();
        
    } catch (error) {
        console.error('Error opening next week board management:', error);
        showError('Failed to open next week board management');
    }
}

async function loadNextWeekBoardPreview() {
    try {
        const preview = document.getElementById('nextWeekBoardPreview');
        if (!preview) return;
        
        // Get the next week's dates
        const today = new Date();
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
        
        // Get existing time slots for next week
        const timeSlotsQuery = query(
            collection(db, COLLECTIONS.TIME_SLOTS),
            where('weekStartDate', '>=', nextWeekStart),
            where('weekStartDate', '<', new Date(nextWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000))
        );
        
        const snapshot = await getDocs(timeSlotsQuery);
        const timeSlots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Group time slots by day
        const slotsByDay = {};
        timeSlots.forEach(slot => {
            if (!slotsByDay[slot.day]) {
                slotsByDay[slot.day] = [];
            }
            slotsByDay[slot.day].push(slot);
        });
        
        // Create preview HTML
        preview.innerHTML = `
            <div class="preview-grid">
                ${Object.entries(slotsByDay).map(([day, slots]) => `
                    <div class="preview-day">
                        <h3>${day}</h3>
                        <div class="preview-slots">
                            ${slots.map(slot => `
                                <div class="preview-slot">
                                    <span class="time">${slot.time}</span>
                                    <span class="region">${slot.region}</span>
                                    <span class="product">${slot.product}</span>
                                    <span class="slots">${slot.availableSlots}/${slot.maxSlots}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading next week board preview:', error);
        showError('Failed to load next week board preview');
    }
}

async function updateNextWeekBoard() {
    try {
        // Get the next week's dates
        const today = new Date();
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
        
        // Create time slots for the next week
        const batch = db.batch();
        
        // For each day of the week
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(nextWeekStart);
            currentDate.setDate(nextWeekStart.getDate() + i);
            const dayName = WEEKDAYS[currentDate.getDay()];
            
            // Get all regions
            const regionsSnapshot = await db.collection(COLLECTIONS.REGIONS).get();
            
            // For each region
            regionsSnapshot.forEach(regionDoc => {
                const region = regionDoc.data();
                
                // For each product (Bathrooms and Roofing)
                ['Bathrooms', 'Roofing'].forEach(product => {
                    // Create time slots for each day
                    ['10:00 AM', '2:00 PM', '6:00 PM'].forEach(time => {
                        const timeSlotRef = db.collection(COLLECTIONS.TIME_SLOTS).doc();
                        batch.set(timeSlotRef, {
                            day: dayName,
                            time: time,
                            region: region.name,
                            product: product,
                            maxSlots: 5,
                            availableSlots: 5,
                            isActive: true,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            weekStartDate: nextWeekStart
                        });
                    });
                });
            });
        }
        
        // Commit all changes
        await batch.commit();
        
        // Show success message
        showSuccess('Next week\'s board updated successfully!');
        
        // Reload the preview
        await loadNextWeekBoardPreview();
        
    } catch (error) {
        console.error('Error updating next week board:', error);
        showError('Failed to update next week board');
    }
}

// Make the new functions available globally
window.manageNextWeekBoard = manageNextWeekBoard;
window.updateNextWeekBoard = updateNextWeekBoard;
window.viewNextWeekBoard = loadNextWeekBoardPreview;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication state
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            console.log('No user logged in, redirecting to login page');
            window.location.href = 'login.html';
            return;
        }

        try {
            // Check if user is admin
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();

            if (!userData || userData.role !== 'admin') {
                console.log('User is not an admin, redirecting to main page');
                window.location.href = 'index.html';
                return;
            }

            // Update lastActive timestamp when user logs in
            await db.collection(COLLECTIONS.USERS).doc(user.uid).update({
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Set up periodic update of lastActive timestamp
            const updateLastActive = async () => {
                try {
                    await db.collection(COLLECTIONS.USERS).doc(user.uid).update({
                        lastActive: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } catch (error) {
                    console.error('Error updating lastActive:', error);
                }
            };

            // Update lastActive every 5 minutes
            setInterval(updateLastActive, 5 * 60 * 1000);

            // Also update lastActive on user activity
            const updateOnActivity = debounce(updateLastActive, 1000);
            document.addEventListener('mousemove', updateOnActivity);
            document.addEventListener('keydown', updateOnActivity);
            document.addEventListener('click', updateOnActivity);

            // Hide Create Admin button for regular admins
            const createAdminButton = document.querySelector('.create-admin-button');
            if (createAdminButton) {
                createAdminButton.style.display = 'none';
            }

            // Load initial data
            loadDashboardStats();
            loadRegions();
            loadTimeSlots();
            loadUsers();
            loadActiveUsers();

            // Set up periodic refresh of active users
            setInterval(loadActiveUsers, 60000); // Refresh every minute

            // Check for weekly update needed
            checkWeeklyUpdateNeeded();
            
            // Set up daily check for weekly update
            setInterval(checkWeeklyUpdateNeeded, 24 * 60 * 60 * 1000); // Check every 24 hours
        } catch (error) {
            console.error('Error checking user role:', error);
            window.location.href = 'login.html';
        }
    });
});

// Helper function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make the new functions available globally
window.debounce = debounce;

// Add this function to initialize integrations
async function initializeIntegrations() {
    try {
        // Initialize Geckoboard
        const geckoboardApiKey = localStorage.getItem('geckoboard_api_key');
        if (geckoboardApiKey) {
            geckoboardIntegration = new GeckoboardIntegration();
            await geckoboardIntegration.initialize(geckoboardApiKey);
        }

        // Initialize Salesforce
        const salesforceConfig = JSON.parse(localStorage.getItem('salesforce_config') || '{}');
        if (salesforceConfig.clientId) {
            salesforceIntegration = new SalesforceIntegration();
            await salesforceIntegration.initialize(
                salesforceConfig.clientId,
                salesforceConfig.clientSecret,
                salesforceConfig.username,
                salesforceConfig.password
            );
        }

        // Initialize Call Tracking
        const callTrackingApiKey = localStorage.getItem('call_tracking_api_key');
        if (callTrackingApiKey) {
            callTrackingIntegration = new CallTrackingIntegration();
            await callTrackingIntegration.initialize(callTrackingApiKey);
        }
    } catch (error) {
        console.error('Error initializing integrations:', error);
    }
}

// Add this function to load the integrations tab
async function loadIntegrations() {
    try {
        const integrationsTab = document.getElementById('integrationsTab');
        if (!integrationsTab) return;

        integrationsTab.innerHTML = `
            <div class="integrations-header">
                <div class="header-content">
                    <h2><i class="fas fa-plug"></i> Integrations</h2>
                    <p>Connect your appointment scheduler with external services to enhance functionality</p>
                </div>
            </div>
            <div class="integrations-container">
                <!-- Geckoboard Integration -->
                <div class="integration-card">
                    <div class="integration-card-header">
                        <div class="integration-icon geckoboard">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="integration-info">
                            <h3>Geckoboard</h3>
                            <div class="integration-status ${geckoboardIntegration ? 'connected' : 'disconnected'}">
                                <i class="fas ${geckoboardIntegration ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                ${geckoboardIntegration ? 'Connected' : 'Not Connected'}
                            </div>
                        </div>
                    </div>
                    <div class="integration-card-body">
                        <div class="integration-description">
                            <i class="fas fa-info-circle"></i>
                            <p>Connect to Geckoboard to display appointment metrics and KPIs on your dashboard.</p>
                        </div>
                        <form id="geckoboardForm" onsubmit="event.preventDefault(); saveGeckoboardConfig();">
                            <div class="form-group">
                                <label for="geckoboardApiKey">
                                    <i class="fas fa-key"></i>
                                    API Key
                                </label>
                                <div class="input-with-icon">
                                    <input type="password" id="geckoboardApiKey" value="${localStorage.getItem('geckoboard_api_key') || ''}" required>
                                    <i class="fas fa-eye toggle-password" onclick="togglePassword('geckoboardApiKey')"></i>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="submit-button">
                                    <i class="fas fa-save"></i>
                                    Save Configuration
                                </button>
                                ${geckoboardIntegration ? `
                                    <button type="button" class="test-button" onclick="testGeckoboardConnection()">
                                        <i class="fas fa-sync"></i>
                                        Test Connection
                                    </button>
                                ` : ''}
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Salesforce Integration -->
                <div class="integration-card">
                    <div class="integration-card-header">
                        <div class="integration-icon salesforce">
                            <i class="fas fa-cloud"></i>
                        </div>
                        <div class="integration-info">
                            <h3>Salesforce</h3>
                            <div class="integration-status ${salesforceIntegration ? 'connected' : 'disconnected'}">
                                <i class="fas ${salesforceIntegration ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                ${salesforceIntegration ? 'Connected' : 'Not Connected'}
                            </div>
                        </div>
                    </div>
                    <div class="integration-card-body">
                        <div class="integration-description">
                            <i class="fas fa-info-circle"></i>
                            <p>Connect to Salesforce to sync appointments and create leads automatically.</p>
                        </div>
                        <form id="salesforceForm" onsubmit="event.preventDefault(); saveSalesforceConfig();">
                            <div class="form-group">
                                <label for="salesforceClientId">
                                    <i class="fas fa-id-card"></i>
                                    Client ID
                                </label>
                                <div class="input-with-icon">
                                    <input type="text" id="salesforceClientId" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="salesforceClientSecret">
                                    <i class="fas fa-lock"></i>
                                    Client Secret
                                </label>
                                <div class="input-with-icon">
                                    <input type="password" id="salesforceClientSecret" required>
                                    <i class="fas fa-eye toggle-password" onclick="togglePassword('salesforceClientSecret')"></i>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="salesforceUsername">
                                    <i class="fas fa-user"></i>
                                    Username
                                </label>
                                <div class="input-with-icon">
                                    <input type="text" id="salesforceUsername" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="salesforcePassword">
                                    <i class="fas fa-key"></i>
                                    Password
                                </label>
                                <div class="input-with-icon">
                                    <input type="password" id="salesforcePassword" required>
                                    <i class="fas fa-eye toggle-password" onclick="togglePassword('salesforcePassword')"></i>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="submit-button">
                                    <i class="fas fa-save"></i>
                                    Save Configuration
                                </button>
                                ${salesforceIntegration ? `
                                    <button type="button" class="test-button" onclick="testSalesforceConnection()">
                                        <i class="fas fa-sync"></i>
                                        Test Connection
                                    </button>
                                ` : ''}
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Call Tracking Integration -->
                <div class="integration-card">
                    <div class="integration-card-header">
                        <div class="integration-icon call-tracking">
                            <i class="fas fa-phone"></i>
                        </div>
                        <div class="integration-info">
                            <h3>Call Tracking</h3>
                            <div class="integration-status ${callTrackingIntegration ? 'connected' : 'disconnected'}">
                                <i class="fas ${callTrackingIntegration ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                ${callTrackingIntegration ? 'Connected' : 'Not Connected'}
                            </div>
                        </div>
                    </div>
                    <div class="integration-card-body">
                        <div class="integration-description">
                            <i class="fas fa-info-circle"></i>
                            <p>Connect to Call Tracking Metrics to monitor and analyze call data.</p>
                        </div>
                        <form id="callTrackingForm" onsubmit="event.preventDefault(); saveCallTrackingConfig();">
                            <div class="form-group">
                                <label for="callTrackingApiKey">
                                    <i class="fas fa-key"></i>
                                    API Key
                                </label>
                                <div class="input-with-icon">
                                    <input type="password" id="callTrackingApiKey" value="${localStorage.getItem('call_tracking_api_key') || ''}" required>
                                    <i class="fas fa-eye toggle-password" onclick="togglePassword('callTrackingApiKey')"></i>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="submit-button">
                                    <i class="fas fa-save"></i>
                                    Save Configuration
                                </button>
                                ${callTrackingIntegration ? `
                                    <button type="button" class="test-button" onclick="testCallTrackingConnection()">
                                        <i class="fas fa-sync"></i>
                                        Test Connection
                                    </button>
                                ` : ''}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Load saved Salesforce config
        const savedSalesforceConfig = JSON.parse(localStorage.getItem('salesforce_config') || '{}');
        document.getElementById('salesforceClientId').value = savedSalesforceConfig.clientId || '';
        document.getElementById('salesforceUsername').value = savedSalesforceConfig.username || '';

    } catch (error) {
        console.error('Error loading integrations:', error);
        showError('Failed to load integrations');
    }
}

// Add this function to toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling;
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Make the new function available globally
window.togglePassword = togglePassword;

// Add these test connection functions
async function testGeckoboardConnection() {
    try {
        const success = await geckoboardIntegration.testConnection();
        if (success) {
            showSuccess('Successfully connected to Geckoboard');
        } else {
            showError('Failed to connect to Geckoboard');
        }
    } catch (error) {
        console.error('Error testing Geckoboard connection:', error);
        showError('Failed to test Geckoboard connection');
    }
}

async function testSalesforceConnection() {
    try {
        const success = await salesforceIntegration.initialize(
            document.getElementById('salesforceClientId').value,
            document.getElementById('salesforceClientSecret').value,
            document.getElementById('salesforceUsername').value,
            document.getElementById('salesforcePassword').value
        );
        if (success) {
            showSuccess('Successfully connected to Salesforce');
        } else {
            showError('Failed to connect to Salesforce');
        }
    } catch (error) {
        console.error('Error testing Salesforce connection:', error);
        showError('Failed to test Salesforce connection');
    }
}

async function testCallTrackingConnection() {
    try {
        const success = await callTrackingIntegration.testConnection();
        if (success) {
            showSuccess('Successfully connected to Call Tracking Metrics');
        } else {
            showError('Failed to connect to Call Tracking Metrics');
        }
    } catch (error) {
        console.error('Error testing Call Tracking connection:', error);
        showError('Failed to test Call Tracking connection');
    }
}

// Make the new functions available globally
window.testGeckoboardConnection = testGeckoboardConnection;
window.testSalesforceConnection = testSalesforceConnection;
window.testCallTrackingConnection = testCallTrackingConnection;

// Update the styles
const styles = `
    // ... existing styles ...

    .integrations-header {
        background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
        color: white;
        padding: 3rem 2rem;
        margin-bottom: 2rem;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
    }

    .integrations-header .header-content {
        max-width: 800px;
        margin: 0 auto;
        text-align: center;
    }

    .integrations-header h2 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }

    .integrations-header p {
        font-size: 1.1rem;
        opacity: 0.9;
        line-height: 1.6;
    }

    .integrations-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 2rem;
        padding: 1rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    .integration-card {
        background: white;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        transition: all 0.3s ease;
        overflow: hidden;
        border: 1px solid var(--border-color);
    }

    .integration-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-lg);
    }

    .integration-card-header {
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        border-bottom: 1px solid var(--border-color);
        background: #f8fafc;
    }

    .integration-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.75rem;
        color: white;
    }

    .integration-icon.geckoboard {
        background: linear-gradient(135deg, #00a3e0, #0077b5);
    }

    .integration-icon.salesforce {
        background: linear-gradient(135deg, #00a1e0, #1798c1);
    }

    .integration-icon.call-tracking {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
    }

    .integration-info {
        flex: 1;
    }

    .integration-info h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        color: var(--text-color);
    }

    .integration-status {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .integration-status.connected {
        background-color: #dcfce7;
        color: #166534;
    }

    .integration-status.disconnected {
        background-color: #fee2e2;
        color: #991b1b;
    }

    .integration-card-body {
        padding: 1.5rem;
    }

    .integration-description {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 2rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: var(--border-radius);
    }

    .integration-description i {
        color: var(--primary-color);
        font-size: 1.25rem;
        margin-top: 0.25rem;
    }

    .integration-description p {
        margin: 0;
        color: var(--text-light);
        font-size: 0.875rem;
        line-height: 1.6;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-color);
    }

    .form-group label i {
        color: var(--primary-color);
    }

    .input-with-icon {
        position: relative;
    }

    .input-with-icon input {
        width: 100%;
        padding: 0.75rem 1rem;
        padding-right: 2.5rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: 1rem;
        transition: all 0.2s ease;
        background: white;
    }

    .input-with-icon input:focus {
        border-color: var(--primary-color);
        outline: none;
        box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
    }

    .input-with-icon .toggle-password {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-light);
        cursor: pointer;
        transition: color 0.2s ease;
    }

    .input-with-icon .toggle-password:hover {
        color: var(--primary-color);
    }

    .form-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }

    .submit-button, .test-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: var(--border-radius);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        flex: 1;
        justify-content: center;
    }

    .submit-button {
        background-color: var(--primary-color);
        color: white;
    }

    .submit-button:hover {
        background-color: var(--primary-hover);
        transform: translateY(-2px);
    }

    .test-button {
        background-color: #f1f5f9;
        color: var(--text-color);
    }

    .test-button:hover {
        background-color: #e2e8f0;
        transform: translateY(-2px);
    }

    @media (max-width: 768px) {
        .integrations-header {
            padding: 2rem 1rem;
        }

        .integrations-header h2 {
            font-size: 2rem;
        }

        .integrations-container {
            grid-template-columns: 1fr;
            padding: 0.5rem;
        }

        .integration-card {
            margin: 0 0.5rem;
        }

        .form-actions {
            flex-direction: column;
        }

        .submit-button, .test-button {
            width: 100%;
        }
    }
`;