const { db, auth } = require('./firebase-config.js');
const { COLLECTIONS } = require('./firebase-collections.js');
const { 
    getDoc, 
    getDocs, 
    doc, 
    collection, 
    query, 
    where, 
    onSnapshot 
} = require('firebase/firestore');

// Create Active Users Tab
function createActiveUsersTab() {
    const activeUsersTab = document.createElement('div');
    activeUsersTab.id = 'activeUsersTab';
    activeUsersTab.className = 'tab-content';
    activeUsersTab.innerHTML = `
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-users"></i>
                    Active Users
                </h2>
            </div>
            <div class="active-users-stats">
                <div class="stat-card total">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Total Online</h3>
                        <p id="totalOnlineCount">0</p>
                    </div>
                </div>
                <div class="stat-card admins">
                    <div class="stat-icon">
                        <i class="fas fa-user-shield"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Admins Online</h3>
                        <p id="adminsOnlineCount">0</p>
                    </div>
                </div>
                <div class="stat-card managers">
                    <div class="stat-icon">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Managers Online</h3>
                        <p id="managersOnlineCount">0</p>
                    </div>
                </div>
                <div class="stat-card users">
                    <div class="stat-icon">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Regular Users</h3>
                        <p id="usersOnlineCount">0</p>
                    </div>
                </div>
            </div>
            <div class="active-users-filters">
                <div class="form-group">
                    <input type="text" id="activeUserSearch" placeholder="Search users..." class="search-input">
                </div>
                <div class="form-group">
                    <select id="activeUserRoleFilter" class="role-filter">
                        <option value="all">All Roles</option>
                        <option value="admin">Admins</option>
                        <option value="manager">Managers</option>
                        <option value="user">Regular Users</option>
                    </select>
                </div>
            </div>
            <div class="active-users-list" id="activeUsersList">
                <div class="loading">Loading active users...</div>
            </div>
        </div>
    `;
    document.querySelector('.tab-content.active').parentNode.appendChild(activeUsersTab);

    // Add event listeners for search and filter
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
}

// Load active users with real-time updates
async function loadActiveUsers() {
    const activeUsersList = document.getElementById('activeUsersList');
    if (!activeUsersList) return;

    try {
        const searchTerm = document.getElementById('activeUserSearch')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('activeUserRoleFilter')?.value || 'all';

        // Set up real-time listener for users collection
        const usersRef = collection(db, COLLECTIONS.USERS);
        onSnapshot(usersRef, async (snapshot) => {
            const users = [];
            
            for (const doc of snapshot.docs) {
                const userData = doc.data();
                
                // Apply filters
                if (roleFilter !== 'all' && userData.role !== roleFilter) continue;
                
                if (searchTerm) {
                    const searchableText = `${userData.firstName} ${userData.lastName} ${userData.email}`.toLowerCase();
                    if (!searchableText.includes(searchTerm)) continue;
                }

                // Calculate time since last active
                const lastActive = userData.lastActive ? userData.lastActive.toDate() : null;
                const timeSinceLastActive = lastActive ? getTimeSinceLastActive(lastActive) : 'Never';
                
                users.push({
                    id: doc.id,
                    ...userData,
                    lastActive,
                    timeSinceLastActive
                });
            }

            // Sort users by online status and last active time
            users.sort((a, b) => {
                if (a.isOnline && !b.isOnline) return -1;
                if (!a.isOnline && b.isOnline) return 1;
                if (!a.lastActive) return 1;
                if (!b.lastActive) return -1;
                return b.lastActive - a.lastActive;
            });

            // Count users by role
            const stats = {
                total: users.filter(user => user.isOnline).length,
                admins: users.filter(user => user.isOnline && user.role === 'admin').length,
                managers: users.filter(user => user.isOnline && user.role === 'manager').length,
                regular: users.filter(user => user.isOnline && user.role === 'user').length
            };

            // Update stats
            document.getElementById('totalOnlineCount').textContent = stats.total;
            document.getElementById('adminsOnlineCount').textContent = stats.admins;
            document.getElementById('managersOnlineCount').textContent = stats.managers;
            document.getElementById('usersOnlineCount').textContent = stats.regular;

            // Update active users list
            activeUsersList.innerHTML = users.length > 0 ? users.map(user => `
                <div class="list-item ${user.isOnline ? 'online' : 'offline'}">
                    <div class="list-item-content">
                        <div class="list-item-title">
                            ${user.firstName} ${user.lastName}
                            <span class="user-role ${user.role}">${user.role || 'User'}</span>
                            <span class="status-indicator ${user.isOnline ? 'online' : 'offline'}">
                                <i class="fas fa-circle"></i>
                                ${user.isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                        <div class="list-item-subtitle">
                            <div>${user.email}</div>
                            <div>Last Active: ${user.timeSinceLastActive}</div>
                        </div>
                    </div>
                    <div class="list-item-actions">
                        <button class="action-button view-button" onclick="viewUserDetails('${user.id}')">
                            <i class="fas fa-eye"></i>
                            View Details
                        </button>
                    </div>
                </div>
            `).join('') : '<div class="no-users">No users found</div>';

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

// View user details
async function viewUserDetails(userId) {
    try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
        if (!userDoc.exists()) {
            showError('User not found');
            return;
        }

        const userData = userDoc.data();
        
        // Get user's bookings
        const bookingsSnapshot = await getDocs(
            query(
                collection(db, COLLECTIONS.BOOKINGS),
                where('userId', '==', userId)
            )
        );
        
        const bookings = bookingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal user-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>User Details</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="user-profile">
                        <div class="profile-header">
                            <div class="profile-icon">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div class="profile-info">
                                <h3>${userData.firstName} ${userData.lastName}</h3>
                                <span class="user-role ${userData.role}">${userData.role || 'User'}</span>
                            </div>
                        </div>
                        <div class="profile-details">
                            <div class="detail-item">
                                <i class="fas fa-envelope"></i>
                                <span>${userData.email}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-phone"></i>
                                <span>${userData.phone || 'Not provided'}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-clock"></i>
                                <span>Last Active: ${userData.lastActive ? userData.lastActive.toDate().toLocaleString() : 'Never'}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>Member Since: ${userData.createdAt ? userData.createdAt.toDate().toLocaleDateString() : 'Unknown'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="appointments-section">
                        <div class="section-header">
                            <h3>Appointment History</h3>
                            <div class="appointment-filters">
                                <select id="appointmentStatusFilter" class="filter-select">
                                    <option value="all">All Status</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <select id="appointmentDateFilter" class="filter-select">
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </select>
                                <input type="text" id="appointmentSearch" class="search-input" placeholder="Search appointments...">
                            </div>
                        </div>
                        <div class="appointments-stats">
                            <div class="stat-item">
                                <span class="stat-label">Total Appointments</span>
                                <span class="stat-value">${bookings.length}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Active</span>
                                <span class="stat-value">${bookings.filter(b => b.status === 'confirmed').length}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Cancelled</span>
                                <span class="stat-value">${bookings.filter(b => b.status === 'cancelled').length}</span>
                            </div>
                        </div>
                        <div class="appointments-list" id="userAppointmentsList">
                            ${bookings.length > 0 ? bookings.map(booking => `
                                <div class="appointment-card ${booking.status}">
                                    <div class="appointment-header">
                                        <h4>${booking.product} - ${booking.region}</h4>
                                        <span class="status-badge ${booking.status}">${booking.status}</span>
                                    </div>
                                    <div class="appointment-details">
                                        <div class="detail-row">
                                            <i class="fas fa-calendar"></i>
                                            <span>${booking.date.toDate().toLocaleDateString()}</span>
                                        </div>
                                        <div class="detail-row">
                                            <i class="fas fa-clock"></i>
                                            <span>${booking.time}</span>
                                        </div>
                                        <div class="detail-row">
                                            <i class="fas fa-map-marker-alt"></i>
                                            <span>${booking.address || 'No address provided'}</span>
                                        </div>
                                        ${booking.cancellationReason ? `
                                            <div class="detail-row">
                                                <i class="fas fa-exclamation-circle"></i>
                                                <span>Cancellation Reason: ${booking.cancellationReason}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="appointment-actions">
                                        ${booking.status === 'cancelled' ? `
                                            <button class="action-button reschedule" onclick="rescheduleBooking('${booking.id}')">
                                                <i class="fas fa-calendar-plus"></i> Reschedule
                                            </button>
                                        ` : booking.status === 'confirmed' ? `
                                            <button class="action-button cancel" onclick="cancelBooking('${booking.id}')">
                                                <i class="fas fa-times"></i> Cancel
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('') : '<div class="no-appointments">No appointments found</div>'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Add event listeners for filters
        const statusFilter = modal.querySelector('#appointmentStatusFilter');
        const dateFilter = modal.querySelector('#appointmentDateFilter');
        const searchInput = modal.querySelector('#appointmentSearch');

        function filterAppointments() {
            const status = statusFilter.value;
            const dateRange = dateFilter.value;
            const searchTerm = searchInput.value.toLowerCase();

            const filteredBookings = bookings.filter(booking => {
                // Status filter
                if (status !== 'all' && booking.status !== status) return false;

                // Date filter
                const bookingDate = booking.date.toDate();
                const today = new Date();
                if (dateRange !== 'all') {
                    if (dateRange === 'today') {
                        if (bookingDate.toDateString() !== today.toDateString()) return false;
                    } else if (dateRange === 'week') {
                        const weekAgo = new Date(today.setDate(today.getDate() - 7));
                        if (bookingDate < weekAgo) return false;
                    } else if (dateRange === 'month') {
                        const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
                        if (bookingDate < monthAgo) return false;
                    }
                }

                // Search filter
                if (searchTerm) {
                    const searchableText = `${booking.product} ${booking.region} ${booking.time}`.toLowerCase();
                    if (!searchableText.includes(searchTerm)) return false;
                }

                return true;
            });

            // Update appointments list
            const appointmentsList = modal.querySelector('#userAppointmentsList');
            appointmentsList.innerHTML = filteredBookings.length > 0 ? filteredBookings.map(booking => `
                <div class="appointment-card ${booking.status}">
                    <div class="appointment-header">
                        <h4>${booking.product} - ${booking.region}</h4>
                        <span class="status-badge ${booking.status}">${booking.status}</span>
                    </div>
                    <div class="appointment-details">
                        <div class="detail-row">
                            <i class="fas fa-calendar"></i>
                            <span>${booking.date.toDate().toLocaleDateString()}</span>
                        </div>
                        <div class="detail-row">
                            <i class="fas fa-clock"></i>
                            <span>${booking.time}</span>
                        </div>
                        <div class="detail-row">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${booking.address || 'No address provided'}</span>
                        </div>
                        ${booking.cancellationReason ? `
                            <div class="detail-row">
                                <i class="fas fa-exclamation-circle"></i>
                                <span>Cancellation Reason: ${booking.cancellationReason}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="appointment-actions">
                        ${booking.status === 'cancelled' ? `
                            <button class="action-button reschedule" onclick="rescheduleBooking('${booking.id}')">
                                <i class="fas fa-calendar-plus"></i> Reschedule
                            </button>
                        ` : booking.status === 'confirmed' ? `
                            <button class="action-button cancel" onclick="cancelBooking('${booking.id}')">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('') : '<div class="no-appointments">No appointments found</div>';
        }

        statusFilter.addEventListener('change', filterAppointments);
        dateFilter.addEventListener('change', filterAppointments);
        searchInput.addEventListener('input', debounce(filterAppointments, 300));

        // Close modal functionality
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

    } catch (error) {
        console.error('Error loading user details:', error);
        showError('Failed to load user details');
    }
};

// Export all functions
module.exports = {
    createActiveUsersTab,
    loadActiveUsers,
    viewUserDetails
}; 