const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const app = initializeApp();
const db = getFirestore(app);

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId } = event.queryStringParameters || {};
    
    let query = db.collection('bookings');
    
    // If userId is provided, filter by user
    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snapshot = await query.get();
    const bookings = [];
    
    snapshot.forEach(doc => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify(bookings)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch bookings' })
    };
  }
}; 