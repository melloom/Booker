const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const app = initializeApp();
const db = getFirestore(app);

exports.handler = async (event, context) => {
  // Only allow PUT requests
  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { bookingId } = event.queryStringParameters;
    if (!bookingId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Booking ID is required' })
      };
    }

    const updateData = JSON.parse(event.body);
    
    // Remove any fields that shouldn't be updated
    delete updateData.id;
    delete updateData.createdAt;

    await db.collection('bookings').doc(bookingId).update({
      ...updateData,
      updatedAt: new Date().toISOString()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Booking updated successfully',
        bookingId
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update booking' })
    };
  }
}; 