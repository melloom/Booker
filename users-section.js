import { db, auth } from './firebase-config.js';
import { COLLECTIONS } from './firebase-collections.js';
import { 
    getDoc, 
    getDocs, 
    doc, 
    collection, 
    query, 
    where, 
    updateDoc, 
    deleteDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

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
        // Get current user's role
        const currentUser = auth.currentUser;
        if (!currentUser) {
            showError('You must be logged in to edit users');
            return;
        }

        const currentUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, currentUser.uid));
        if (!currentUserDoc.exists()) {
            showError('Current user not found');
            return;
        }

        const currentUserData = currentUserDoc.data();
        const isManager = currentUserData.role === 'manager';
        const isAdmin = currentUserData.role === 'admin';

        // Get the user to be edited
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
        if (!userDoc.exists()) {
            showError('User not found');
            return;
        }

        const userData = userDoc.data();

        // Check permissions
        if (!isManager && !isAdmin) {
            showError('You do not have permission to edit users');
            return;
        }

        // Admins can only edit their own profile or promote users to admin
        if (isAdmin && !isManager && userId !== currentUser.uid && userData.role !== 'user') {
            showError('Admins can only edit their own profile or promote users to admin');
            return;
        }

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit User</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="editUserForm" class="edit-user-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="editFirstName">First Name</label>
                            <input type="text" id="editFirstName" value="${userData.firstName}" required>
                        </div>
                        <div class="form-group">
                            <label for="editLastName">Last Name</label>
                            <input type="text" id="editLastName" value="${userData.lastName}" required>
                        </div>
                        <div class="form-group">
                            <label for="editEmail">Email</label>
                            <input type="email" id="editEmail" value="${userData.email}" required>
                        </div>
                        <div class="form-group">
                            <label for="editPhone">Phone</label>
                            <input type="tel" id="editPhone" value="${userData.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label for="editRole">Role</label>
                            <select id="editRole" class="role-select" ${!isManager && userId !== currentUser.uid ? 'disabled' : ''}>
                                <option value="user" ${userData.role === 'user' ? 'selected' : ''}>Regular User</option>
                                ${isManager ? `<option value="manager" ${userData.role === 'manager' ? 'selected' : ''}>Manager</option>` : ''}
                                <option value="admin" ${userData.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="submit-button">
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
        `;

        // Add styles for the modal
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                display: flex;
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.5);
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .modal-content {
                background: white;
                padding: 2rem;
                border-radius: 12px;
                min-width: 400px;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #e2e8f0;
            }

            .modal-header h2 {
                font-size: 1.5rem;
                font-weight: 600;
                color: #1e293b;
            }

            .close-modal {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #64748b;
                cursor: pointer;
                padding: 0.5rem;
                transition: color 0.2s;
            }

            .close-modal:hover {
                color: #ef4444;
            }

            .edit-user-form .form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 1.5rem;
            }

            .edit-user-form .form-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .edit-user-form label {
                font-weight: 500;
                color: #1e293b;
                font-size: 0.875rem;
            }

            .edit-user-form input,
            .edit-user-form select {
                padding: 0.75rem;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                font-size: 0.875rem;
                transition: all 0.2s;
            }

            .edit-user-form input:focus,
            .edit-user-form select:focus {
                outline: none;
                border-color: #2563eb;
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
            }

            .edit-user-form .role-select {
                background-color: #f8fafc;
                cursor: pointer;
            }

            .edit-user-form .role-select:disabled {
                background-color: #e2e8f0;
                cursor: not-allowed;
            }

            .edit-user-form .form-actions {
                display: flex;
                gap: 1rem;
                margin-top: 1.5rem;
            }

            .edit-user-form .submit-button,
            .edit-user-form .cancel-button {
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .edit-user-form .submit-button {
                background-color: #2563eb;
                color: white;
            }

            .edit-user-form .submit-button:hover {
                background-color: #1d4ed8;
                transform: translateY(-1px);
            }

            .edit-user-form .cancel-button {
                background-color: #f1f5f9;
                color: #64748b;
            }

            .edit-user-form .cancel-button:hover {
                background-color: #e2e8f0;
                color: #1e293b;
            }
        `;
        document.head.appendChild(style);

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
                lastModified: serverTimestamp()
            };

            // Only include role update if the user has permission
            if (isManager || (isAdmin && userId === currentUser.uid)) {
                updates.role = modal.querySelector('#editRole').value;
            } else if (isAdmin && userData.role === 'user') {
                // Admins can only promote users to admin
                updates.role = 'admin';
            }

            try {
                await updateDoc(doc(db, COLLECTIONS.USERS, userId), updates);
                modal.remove();
                showNotification('User updated successfully', 'success');
                loadUsers();
            } catch (error) {
                console.error('Error updating user:', error);
                showError('Failed to update user: ' + error.message);
            }
        });

    } catch (error) {
        console.error('Error editing user:', error);
        showError('Failed to edit user: ' + error.message);
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
export {
    createUsersTab,
    loadUsers,
    editUser,
    deleteUser,
    showCreateAdminModal
}; 