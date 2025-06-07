const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const app = initializeApp();
const db = getFirestore(app);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const bookingData = JSON.parse(event.body);
    
    // Add validation here
    if (!bookingData.date || !bookingData.time || !bookingData.userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Create booking in Firestore
    const bookingRef = await db.collection('bookings').add({
      ...bookingData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Booking created successfully',
        bookingId: bookingRef.id
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create booking' })
    };
  }
}; 