# Appointment Scheduler

A web-based appointment scheduling system built with Firebase and modern web technologies.

## Features

- User authentication and role-based access control
- Appointment scheduling and management
- Region and time slot management
- Integration with external services (Salesforce, Geckoboard, Call Tracking)
- Admin dashboard for system management
- Real-time updates and notifications

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Firebase (Authentication, Firestore, Functions)
- External Integrations: Salesforce, Geckoboard, Call Tracking

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a Firebase project and add your configuration
4. Set up environment variables for external integrations
5. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## Project Structure

- `admin-dashboard.js` - Admin interface functionality
- `firebase-config.js` - Firebase configuration
- `functions/` - Firebase Cloud Functions
- `styles/` - CSS styles
- Integration files:
  - `salesforce-integration.js`
  - `geckoboard-integration.js`
  - `call-tracking-integration.js`

## Security

- Firebase Security Rules implemented
- Role-based access control
- Secure API key management

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary and confidential. 