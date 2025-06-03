const { db } = require('./firebase-config.js');
const { COLLECTIONS } = require('./firebase-collections.js');
const { 
    getDocs, 
    doc, 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    orderBy,
    getDoc
} = require('firebase/firestore');

// Load time slots
async function loadTimeSlots() {
    try {
        const timeSlotsSnapshot = await getDocs(collection(db, COLLECTIONS.TIME_SLOTS));
        const timeSlotsContainer = document.getElementById('timeSlotsContainer');
        timeSlotsContainer.innerHTML = '';

        // Group time slots by region
        const regionsMap = new Map();
        timeSlotsSnapshot.forEach(doc => {
            const timeSlot = doc.data();
            if (!regionsMap.has(timeSlot.region)) {
                regionsMap.set(timeSlot.region, []);
            }
            regionsMap.get(timeSlot.region).push({ id: doc.id, ...timeSlot });
        });

        // Create region sections
        for (const [regionId, timeSlots] of regionsMap) {
            const regionSection = document.createElement('div');
            regionSection.className = 'region-section';
            
            // Get region name
            const regionDoc = await getDoc(doc(db, COLLECTIONS.REGIONS, regionId));
            const regionName = regionDoc.exists() ? regionDoc.data().name : 'Unknown Region';

            regionSection.innerHTML = `
                <div class="region-header">
                    <h2>${regionName}</h2>
                    <button onclick="openAddTimeSlotModal('${regionId}')" class="add-button">
                        <i class="fas fa-plus"></i> Add Time Slot
                    </button>
                </div>
                <div class="time-slots-grid">
                    ${timeSlots
                        .sort((a, b) => {
                            // Sort by day, then time
                            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                            const dayCompare = days.indexOf(a.day) - days.indexOf(b.day);
                            if (dayCompare !== 0) return dayCompare;
                            return a.time.localeCompare(b.time);
                        })
                        .map(slot => `
                            <div class="time-slot-card ${slot.available < 3 ? 'low-availability' : ''}">
                                <div class="time-slot-header">
                                    <span class="day">${slot.day}</span>
                                    <span class="time">${slot.time}</span>
                                </div>
                                <div class="time-slot-body">
                                    <div class="product">${slot.product}</div>
                                    <div class="slots-info">
                                        <span class="total">Total: ${slot.totalSlots}</span>
                                        <span class="available">Available: ${slot.available}</span>
                                    </div>
                                    <div class="status-badge ${slot.available === 0 ? 'full' : slot.available < 3 ? 'low' : 'available'}">
                                        ${slot.available === 0 ? 'Full' : slot.available < 3 ? 'Low' : 'Available'}
                                    </div>
                                </div>
                                <div class="time-slot-actions">
                                    <button onclick="editTimeSlot('${slot.id}')" class="action-button" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteTimeSlot('${slot.id}')" class="action-button delete" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                </div>
            `;

            timeSlotsContainer.appendChild(regionSection);
        }

        // Add styles
        const styles = `
            .time-slots-container {
                padding: 20px;
            }

            .region-section {
                margin-bottom: 30px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                overflow: hidden;
            }

            .region-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: linear-gradient(135deg, #4a90e2, #357abd);
                color: white;
            }

            .region-header h2 {
                margin: 0;
                font-size: 1.2em;
            }

            .time-slots-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
                padding: 20px;
            }

            .time-slot-card {
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: transform 0.2s, box-shadow 0.2s;
            }

            .time-slot-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }

            .time-slot-header {
                padding: 15px;
                background: #f8f9fa;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .time-slot-body {
                padding: 15px;
            }

            .product {
                font-weight: 500;
                margin-bottom: 10px;
            }

            .slots-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 0.9em;
                color: #666;
            }

            .status-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8em;
                font-weight: 500;
            }

            .status-badge.full {
                background: #dc3545;
                color: white;
            }

            .status-badge.low {
                background: #ffc107;
                color: #000;
            }

            .status-badge.available {
                background: #28a745;
                color: white;
            }

            .time-slot-actions {
                padding: 10px 15px;
                border-top: 1px solid #eee;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }

            .action-button {
                background: none;
                border: none;
                color: #666;
                cursor: pointer;
                padding: 5px;
                transition: color 0.2s;
            }

            .action-button:hover {
                color: #4a90e2;
            }

            .action-button.delete:hover {
                color: #dc3545;
            }

            .low-availability {
                border: 2px solid #ffc107;
            }

            .add-button {
                background: white;
                color: #4a90e2;
                border: none;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
                transition: background-color 0.2s;
            }

            .add-button:hover {
                background: #f8f9fa;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

    } catch (error) {
        console.error('Error loading time slots:', error);
        showError('Failed to load time slots');
    }
}

// Add new time slot
async function addTimeSlot(timeSlotData) {
    try {
        await addDoc(collection(db, COLLECTIONS.TIME_SLOTS), timeSlotData);
        showNotification('Time slot added successfully', 'success');
        loadTimeSlots();
    } catch (error) {
        console.error('Error adding time slot:', error);
        showError('Failed to add time slot');
    }
}

// Edit time slot
async function editTimeSlot(timeSlotId) {
    try {
        const timeSlotDoc = await getDoc(doc(db, COLLECTIONS.TIME_SLOTS, timeSlotId));
        if (!timeSlotDoc.exists()) {
            showError('Time slot not found');
            return;
        }

        const timeSlotData = timeSlotDoc.data();
        
        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Time Slot</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editTimeSlotForm">
                        <div class="form-group">
                            <label>Day</label>
                            <select id="editTimeSlotDay" required>
                                ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                                    .map(day => `<option value="${day}" ${day === timeSlotData.day ? 'selected' : ''}>${day}</option>`)
                                    .join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Time</label>
                            <input type="time" id="editTimeSlotTime" value="${timeSlotData.time}" required>
                        </div>
                        <div class="form-group">
                            <label>Product</label>
                            <input type="text" id="editTimeSlotProduct" value="${timeSlotData.product}" required>
                        </div>
                        <div class="form-group">
                            <label>Total Slots</label>
                            <input type="number" id="editTimeSlotTotal" value="${timeSlotData.totalSlots}" min="1" required>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="submit-button">Save Changes</button>
                            <button type="button" class="cancel-button" onclick="closeEditTimeSlotModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Handle form submission
        modal.querySelector('#editTimeSlotForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updates = {
                day: modal.querySelector('#editTimeSlotDay').value,
                time: modal.querySelector('#editTimeSlotTime').value,
                product: modal.querySelector('#editTimeSlotProduct').value,
                totalSlots: parseInt(modal.querySelector('#editTimeSlotTotal').value),
                available: parseInt(modal.querySelector('#editTimeSlotTotal').value)
            };

            try {
                await updateDoc(doc(db, COLLECTIONS.TIME_SLOTS, timeSlotId), updates);
                modal.remove();
                showNotification('Time slot updated successfully', 'success');
                loadTimeSlots();
            } catch (error) {
                console.error('Error updating time slot:', error);
                showError('Failed to update time slot');
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
        console.error('Error preparing time slot edit:', error);
        showError('Failed to prepare time slot edit');
    }
}

// Delete time slot
async function deleteTimeSlot(timeSlotId) {
    if (!confirm('Are you sure you want to delete this time slot? This action cannot be undone.')) {
        return;
    }

    try {
        await deleteDoc(doc(db, COLLECTIONS.TIME_SLOTS, timeSlotId));
        showNotification('Time slot deleted successfully', 'success');
        loadTimeSlots();
    } catch (error) {
        console.error('Error deleting time slot:', error);
        showError('Failed to delete time slot');
    }
}

// Make functions available globally
window.editTimeSlot = editTimeSlot;
window.deleteTimeSlot = deleteTimeSlot;
window.closeEditTimeSlotModal = function() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
};

// Export all functions
module.exports = {
    loadTimeSlots,
    addTimeSlot,
    editTimeSlot,
    deleteTimeSlot
}; 