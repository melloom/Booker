// Function to open the booking modal
function openBookingModal(timeSlot, date) {
    console.log('Opening booking modal with:', { timeSlot, date });
    
    // Remove any existing modal
    const existingModal = document.querySelector('.booking-modal');
    if (existingModal) {
        console.log('Removing existing modal');
        existingModal.remove();
    }

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'booking-modal';
    console.log('Created modal container');

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    console.log('Created modal content');

    // Create form
    const form = document.createElement('form');
    form.id = 'bookingForm';
    console.log('Created booking form');

    // Add form fields
    form.innerHTML = `
        <h2>Book Appointment</h2>
        <div class="form-group">
            <label for="date">Date:</label>
            <input type="date" id="date" name="date" required>
        </div>
        <div class="form-group">
            <label for="time">Time:</label>
            <input type="text" id="time" name="time" readonly>
        </div>
        <div class="form-group">
            <label for="service">Service:</label>
            <select id="service" name="service" required>
                <option value="">Select a service</option>
                <option value="service1">Service 1</option>
                <option value="service2">Service 2</option>
                <option value="service3">Service 3</option>
            </select>
        </div>
        <div class="form-group">
            <label for="notes">Notes:</label>
            <textarea id="notes" name="notes" rows="3"></textarea>
        </div>
        <div class="form-actions">
            <button type="button" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn">Book Now</button>
        </div>
    `;
    console.log('Added form fields');

    // Add form to modal content
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    console.log('Added form to modal');

    // Add modal to body
    document.body.appendChild(modal);
    console.log('Added modal to body');

    // Set initial values
    const dateInput = form.querySelector('#date');
    const timeInput = form.querySelector('#time');
    
    if (date) {
        dateInput.value = date.toISOString().split('T')[0];
    }
    if (timeSlot) {
        timeInput.value = timeSlot;
    }
    console.log('Set initial values:', { date: dateInput.value, time: timeInput.value });

    // Add event listeners
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            console.log('Clicked outside modal - closing');
            modal.remove();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.querySelector('.booking-modal')) {
            console.log('Escape key pressed - closing modal');
            modal.remove();
        }
    });

    const cancelBtn = form.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', () => {
        console.log('Cancel button clicked');
        modal.remove();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');
        
        const formData = new FormData(form);
        const bookingData = {
            date: formData.get('date'),
            time: formData.get('time'),
            service: formData.get('service'),
            notes: formData.get('notes')
        };
        console.log('Booking data:', bookingData);

        try {
            await createBooking(bookingData);
            console.log('Booking created successfully');
            alert('Booking created successfully!');
            modal.remove();
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Error creating booking. Please try again.');
        }
    });

    // Focus on first input
    dateInput.focus();
    console.log('Modal setup complete');
}

// Make the function available globally
window.openBookingModal = openBookingModal;

// Export the function for module usage
export { openBookingModal }; 