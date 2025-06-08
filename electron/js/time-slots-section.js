// Create time slot element
const timeSlot = document.createElement('div');
timeSlot.className = 'time-slot';
timeSlot.textContent = `${startTime} - ${endTime}`;
timeSlot.dataset.startTime = startTime;
timeSlot.dataset.endTime = endTime;
timeSlot.dataset.date = date.toISOString();

// Add click event listener with debug logging
timeSlot.onclick = function() {
    console.log('Time slot clicked:', {
        startTime,
        endTime,
        date: date.toISOString()
    });
    try {
        if (typeof window.openBookingModal === 'function') {
            // Pass the time slot text and date object
            window.openBookingModal(`${startTime} - ${endTime}`, date);
            console.log('Modal opened successfully');
        } else {
            console.error('openBookingModal is not a function');
        }
    } catch (error) {
        console.error('Error opening modal:', error);
    }
}; 