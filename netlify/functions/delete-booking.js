const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const app = initializeApp();
const db = getFirestore(app);

exports.handler = async (event, context) => {
  // Only allow DELETE requests
  if (event.httpMethod !== 'DELETE') {
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

    await db.collection('bookings').doc(bookingId).delete();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Booking deleted successfully',
        bookingId
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete booking' })
    };
  }
}; 