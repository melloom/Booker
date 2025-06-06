import { db } from './firebase-config.js';
import { COLLECTIONS } from './firebase-collections.js';
import { 
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Load regions
async function loadRegions() {
    try {
        const regionsSnapshot = await getDocs(collection(db, COLLECTIONS.REGIONS));
        const regionsList = document.getElementById('regionsList');
        regionsList.innerHTML = '';

        regionsSnapshot.forEach(doc => {
            const region = doc.data();
            const regionElement = document.createElement('div');
            regionElement.className = 'list-item';
            regionElement.innerHTML = `
                <div class="list-item-content">
                    <h3>${region.name}</h3>
                    ${region.subtitle ? `<p>${region.subtitle}</p>` : ''}
                </div>
                <div class="list-item-actions">
                    <button onclick="editRegion('${doc.id}')" class="action-button">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteRegion('${doc.id}')" class="action-button delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            regionsList.appendChild(regionElement);
        });
    } catch (error) {
        console.error('Error loading regions:', error);
        showError('Failed to load regions');
    }
}

// Edit region
async function editRegion(regionId) {
    try {
        const regionDoc = await getDoc(doc(db, COLLECTIONS.REGIONS, regionId));
        if (!regionDoc.exists()) {
            showError('Region not found');
            return;
        }

        const regionData = regionDoc.data();
        
        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Region</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editRegionForm">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" id="editRegionName" value="${regionData.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Subtitle</label>
                            <input type="text" id="editRegionSubtitle" value="${regionData.subtitle || ''}">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="submit-button">Save Changes</button>
                            <button type="button" class="cancel-button" onclick="closeEditRegionModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Handle form submission
        modal.querySelector('#editRegionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updates = {
                name: modal.querySelector('#editRegionName').value,
                subtitle: modal.querySelector('#editRegionSubtitle').value
            };

            try {
                await updateDoc(doc(db, COLLECTIONS.REGIONS, regionId), updates);
                modal.remove();
                showNotification('Region updated successfully', 'success');
                loadRegions();
            } catch (error) {
                console.error('Error updating region:', error);
                showError('Failed to update region');
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
        console.error('Error preparing region edit:', error);
        showError('Failed to prepare region edit');
    }
}

// Delete region
async function deleteRegion(regionId) {
    if (!confirm('Are you sure you want to delete this region? This action cannot be undone.')) {
        return;
    }

    try {
        // Check if region has any time slots
        const timeSlotsSnapshot = await getDocs(
            query(
                collection(db, COLLECTIONS.TIME_SLOTS),
                where('region', '==', regionId)
            )
        );

        if (!timeSlotsSnapshot.empty) {
            showError('Cannot delete region with existing time slots');
            return;
        }

        // Delete the region
        await deleteDoc(doc(db, COLLECTIONS.REGIONS, regionId));
        showNotification('Region deleted successfully', 'success');
        loadRegions();
    } catch (error) {
        console.error('Error deleting region:', error);
        showError('Failed to delete region');
    }
}

// Add new region
async function addRegion(regionData) {
    try {
        await addDoc(collection(db, COLLECTIONS.REGIONS), regionData);
        showNotification('Region added successfully', 'success');
        loadRegions();
    } catch (error) {
        console.error('Error adding region:', error);
        showError('Failed to add region');
    }
}

// Close edit region modal
function closeEditRegionModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Export all functions
export {
    loadRegions,
    editRegion,
    deleteRegion,
    addRegion,
    closeEditRegionModal
}; 