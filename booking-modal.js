import { db, collection, addDoc, serverTimestamp } from './firebase-config.js';
import { auth } from './firebase-config.js';

// Booking modal functionality
export async function openBookingModal(region, product, time) {
    try {
        const user = window.auth.currentUser;
        if (!user) {
            alert('Please log in to book an appointment');
            return;
        }

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Book Appointment</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="bookingForm">
                        <div class="form-group">
                            <label for="name">Full Name</label>
                            <input type="text" id="name" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" required>
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone Number</label>
                            <input type="tel" id="phone" required>
                        </div>
                        <div class="form-group">
                            <label for="notes">Additional Notes</label>
                            <textarea id="notes" rows="3"></textarea>
                        </div>
                        <div class="booking-details">
                            <p><strong>Region:</strong> ${region}</p>
                            <p><strong>Product:</strong> ${product}</p>
                            <p><strong>Time:</strong> ${time}</p>
                        </div>
                        <button type="submit" class="submit-button">Book Appointment</button>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#bookingForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const user = window.auth.currentUser;
                if (!user) {
                    throw new Error('No user logged in');
                }

                // Get user data
                const userDoc = await window.getDoc(window.doc(window.db, 'users', user.uid));
                const userData = userDoc.data();

                // Get the time slot
                const timeSlotQuery = await window.getDocs(window.query(
                    window.collection(window.db, 'time_slots'),
                    window.where('region', '==', region),
                    window.where('product', '==', product),
                    window.where('time', '==', time),
                    window.where('isActive', '==', true)
                ));

                console.log('Time slot query results:', timeSlotQuery.size);
                if (timeSlotQuery.empty) {
                    throw new Error('Time slot not found');
                }

                const timeSlotDoc = timeSlotQuery.docs[0];
                const timeSlot = timeSlotDoc.data();
                console.log('Found time slot:', timeSlot);

                // Check if availableSlots exists and is a number
                if (typeof timeSlot.availableSlots !== 'number') {
                    console.error('Invalid availableSlots value:', timeSlot.availableSlots);
                    // Try to get maxSlots as fallback
                    if (typeof timeSlot.maxSlots === 'number') {
                        timeSlot.availableSlots = timeSlot.maxSlots;
                    } else {
                        throw new Error('Invalid time slot data');
                    }
                }

                if (timeSlot.availableSlots <= 0) {
                    throw new Error('No available slots for this time');
                }

                // Create booking
                const bookingRef = await window.addDoc(window.collection(window.db, 'bookings'), {
                    userId: user.uid,
                    userName: `${userData.firstName} ${userData.lastName}`,
                    region: region,
                    product: product,
                    time: time,
                    date: window.serverTimestamp(),
                    status: 'confirmed',
                    estimatedDuration: '60-90 minutes',
                    serviceProvider: 'Professional Team',
                    preparationRequired: 'Clear access area',
                    createdAt: window.serverTimestamp()
                });

                // Update time slot availability
                const newAvailableSlots = timeSlot.availableSlots - 1;
                console.log('Updating time slot availability:', {
                    current: timeSlot.availableSlots,
                    new: newAvailableSlots,
                    timeSlotId: timeSlotDoc.id
                });

                await window.updateDoc(timeSlotDoc.ref, {
                    availableSlots: newAvailableSlots,
                    lastModified: window.serverTimestamp()
                });

                // Remove the booking form modal
                modal.remove();

                // Show success message
                const successModal = document.createElement('div');
                successModal.className = 'modal active';
                successModal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Booking Confirmed!</h2>
                            <button class="close-modal" onclick="this.closest('.modal').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="booking-details">
                            <p><strong>Region:</strong> ${region}</p>
                            <p><strong>Product:</strong> ${product}</p>
                            <p><strong>Time:</strong> ${time}</p>
                            <p><strong>Status:</strong> Confirmed</p>
                        </div>
                    </div>
                `;
                document.body.appendChild(successModal);

                // Refresh time slots display by dispatching a custom event
                window.dispatchEvent(new CustomEvent('timeSlotsUpdated'));
            } catch (error) {
                console.error('Error confirming booking:', error);
                alert(error.message || 'Error confirming booking. Please try again.');
            }
        });
    } catch (error) {
        console.error('Error opening booking modal:', error);
        alert('Error opening booking form. Please try again.');
    }
}

// Make the function globally available
window.openBookingModal = openBookingModal;

// Add real-time listeners for time slots
function setupTimeSlotListeners() {
    // Listen for changes in time slots
    const timeSlotsQuery = window.query(
        window.collection(window.db, 'time_slots'),
        window.where('isActive', '==', true)
    );
    
    window.onSnapshot(timeSlotsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified') {
                const timeSlot = change.doc.data();
                const timeSlotElement = document.querySelector(`.time-slot[data-time="${timeSlot.time}"][data-region="${timeSlot.region}"][data-product="${timeSlot.product}"]`);
                
                if (timeSlotElement) {
                    const availabilityElement = timeSlotElement.querySelector('.availability');
                    if (availabilityElement) {
                        availabilityElement.innerHTML = `
                            <div class="slot-count ${timeSlot.availableSlots <= 2 ? 'low' : ''}">
                                <i class="fas ${timeSlot.availableSlots <= 2 ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
                                ${timeSlot.availableSlots} slots available
                            </div>
                        `;
                    }
                }
            }
        });
    }, (error) => {
        console.error('Error listening to time slots:', error);
    });
}

// Call setupTimeSlotListeners when the page loads
document.addEventListener('DOMContentLoaded', setupTimeSlotListeners); 