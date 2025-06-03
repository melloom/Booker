const { db, auth } = require('./firebase-config.js');
const { COLLECTIONS } = require('./firebase-collections.js');
const { 
    getDoc, 
    getDocs, 
    doc, 
    collection, 
    query, 
    where, 
    updateDoc, 
    deleteDoc,
    serverTimestamp 
} = require('firebase/firestore');

// Create users tab
function createUsersTab() {
    const usersTab = document.createElement('div');
    usersTab.id = 'usersTab';
    usersTab.className = 'tab-content';
    usersTab.innerHTML = `
        <div class="section">
            <div class="section-header">
                <h2>Users</h2>
                <button class="create-admin-btn" onclick="showCreateAdminModal()">
                    <i class="fas fa-user-plus"></i> Create Admin Account
                </button>
            </div>
            <div class="users-list" id="usersList">
                <div class="loading">Loading users...</div>
            </div>
        </div>
    `;
    document.querySelector('.tab-content.active').parentNode.appendChild(usersTab);
}

// Load users with search and filter
async function loadUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    try {
        const userSearch = document.getElementById('userSearch');
        const userRoleFilter = document.getElementById('userRoleFilter');
        
        const searchTerm = userSearch ? userSearch.value.toLowerCase() : '';
        const roleFilter = userRoleFilter ? userRoleFilter.value : 'all';

        // Get current user's role
        const currentUser = auth.currentUser;
        const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const currentUserData = currentUserDoc.data();
        const isManager = currentUserData.role === 'manager';

        // Get all users
        const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        let users = [];
        
        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            
            // Apply filters
            if (roleFilter !== 'all' && userData.role !== roleFilter) continue;
            
            if (searchTerm) {
                const searchableText = `${userData.firstName} ${userData.lastName} ${userData.email}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) continue;
            }

            // Get user's bookings
            const bookingsSnapshot = await getDocs(
                query(
                    collection(db, COLLECTIONS.BOOKINGS),
                    where('userId', '==', doc.id)
                )
            );
            
            const bookings = bookingsSnapshot.docs.map(booking => ({
                id: booking.id,
                ...booking.data()
            }));

            // Calculate last active time
            const lastActive = userData.lastActive ? userData.lastActive.toDate() : null;
            
            users.push({
                id: doc.id,
                ...userData,
                bookings,
                lastActive
            });
        }

        // Sort users by last active time
        users.sort((a, b) => {
            if (!a.lastActive) return 1;
            if (!b.lastActive) return -1;
            return b.lastActive - a.lastActive;
        });

        // Update UI
        usersList.innerHTML = users.map(user => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">
                        ${user.firstName} ${user.lastName}
                        <span class="user-role ${user.role}">${user.role || 'User'}</span>
                    </div>
                    <div class="list-item-subtitle">
                        <div>${user.email}</div>
                        <div>Phone: ${user.phone || 'N/A'}</div>
                        <div>Total Bookings: ${user.bookings.length}</div>
                        <div>Last Active: ${user.lastActive ? user.lastActive.toLocaleString() : 'Never'}</div>
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="action-button edit-button" onclick="editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${isManager && user.role !== 'admin' ? `
                        <button class="action-button delete-button" onclick="deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

// Edit user
async function editUser(userId) {
    try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
        if (!userDoc.exists()) {
            showError('User not found');
            return;
        }

        const userData = userDoc.data();
        
        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit User</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editUserForm">
                        <div class="form-group">
                            <label>First Name</label>
                            <input type="text" id="editFirstName" value="${userData.firstName}" required>
                        </div>
                        <div class="form-group">
                            <label>Last Name</label>
                            <input type="text" id="editLastName" value="${userData.lastName}" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="editEmail" value="${userData.email}" required>
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" id="editPhone" value="${userData.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <select id="editRole" required>
                                <option value="user" ${userData.role === 'user' ? 'selected' : ''}>User</option>
                                <option value="manager" ${userData.role === 'manager' ? 'selected' : ''}>Manager</option>
                                <option value="admin" ${userData.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="submit-button">Save Changes</button>
                            <button type="button" class="cancel-button" onclick="closeEditUserModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Handle form submission
        modal.querySelector('#editUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updates = {
                firstName: modal.querySelector('#editFirstName').value,
                lastName: modal.querySelector('#editLastName').value,
                email: modal.querySelector('#editEmail').value,
                phone: modal.querySelector('#editPhone').value,
                role: modal.querySelector('#editRole').value,
                lastModified: serverTimestamp()
            };

            try {
                await updateDoc(doc(db, COLLECTIONS.USERS, userId), updates);
                modal.remove();
                showError('User updated successfully', 'success');
                loadUsers();
            } catch (error) {
                console.error('Error updating user:', error);
                showError('Failed to update user');
            }
        });

        // Close modal on button click
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

    } catch (error) {
        console.error('Error preparing user edit:', error);
        showError('Failed to prepare user edit');
    }
}

// Delete user
async function deleteUser(userId) {
    // Check if current user is a manager
    const currentUser = auth.currentUser;
    const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const currentUserData = currentUserDoc.data();
    
    if (currentUserData.role !== 'manager') {
        showError('Only managers can delete users');
        return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }

    try {
        // Delete user's bookings first
        const bookingsSnapshot = await getDocs(
            query(
                collection(db, COLLECTIONS.BOOKINGS),
                where('userId', '==', userId)
            )
        );

        const deletePromises = bookingsSnapshot.docs.map(doc => 
            deleteDoc(doc.ref)
        );

        await Promise.all(deletePromises);

        // Delete the user document
        await deleteDoc(doc(db, COLLECTIONS.USERS, userId));

        showNotification('User deleted successfully', 'success');
        loadUsers(); // Refresh the users list
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user', 'error');
    }
}

// Show create admin modal
function showCreateAdminModal() {
    const modal = document.createElement('div');
    modal.className = 'create-admin-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Create Admin Account</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="createAdminForm">
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" id="adminFirstName" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" id="adminLastName" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="adminEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="adminPassword" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="adminPhone">
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select id="adminRole" required>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                        </select>
                    </div>
                    <button type="submit" class="submit-btn">Create Account</button>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    // Add close functionality
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });

    // Handle form submission
    modal.querySelector('#createAdminForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = modal.querySelector('#adminFirstName').value;
        const lastName = modal.querySelector('#adminLastName').value;
        const email = modal.querySelector('#adminEmail').value;
        const password = modal.querySelector('#adminPassword').value;
        const phone = modal.querySelector('#adminPhone').value;
        const role = modal.querySelector('#adminRole').value;

        try {
            // Create authentication account
            const userCredential = await auth.createUser({
                email,
                password,
                displayName: `${firstName} ${lastName}`
            });

            // Create user document
            await setDoc(doc(db, COLLECTIONS.USERS, userCredential.uid), {
                firstName,
                lastName,
                email,
                phone,
                role,
                isOnline: false,
                createdAt: serverTimestamp(),
                lastActive: serverTimestamp()
            });

            modal.remove();
            showNotification('Admin account created successfully', 'success');
            loadUsers(); // Refresh the users list
        } catch (error) {
            console.error('Error creating admin account:', error);
            showNotification('Error creating admin account', 'error');
        }
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Make functions available globally
window.editUser = editUser;
window.deleteUser = deleteUser;
window.showCreateAdminModal = showCreateAdminModal;
window.closeEditUserModal = function() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
};

// Export all functions
module.exports = {
    createUsersTab,
    loadUsers,
    editUser,
    deleteUser,
    showCreateAdminModal
}; 