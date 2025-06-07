# Appointment Scheduler

A modern web-based appointment scheduling system built with Firebase and Vite. This application helps manage appointments, users, and integrates with various services.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Java JDK (v11 or higher) - Required for Firebase Emulators
- Git
- A Firebase account

### Step 1: Clone the Repository
```bash
git clone https://github.com/melloom/test--booker.git
cd test--booker
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Firebase
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication, Firestore, and Realtime Database
3. Copy your Firebase config from Project Settings
4. Update `firebase-config.js` with your configuration

### Step 4: Run the Application

#### Option 1: Development Mode (Recommended)
```bash
npm run dev
```
This will start the Vite development server at `http://localhost:5173`

#### Option 2: Production Build
```bash
npm run build
npm run preview
```

## 🔧 Configuration

### Firebase Configuration
The application uses the following Firebase services:
- Authentication
- Firestore
- Realtime Database

Update your Firebase configuration in `firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### Environment Variables
Create a `.env` file in the root directory:
```env
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=your-project-id
```

## 📁 Project Structure

```
test--booker/
├── src/                    # Source files
├── public/                 # Static files
├── firebase-config.js      # Firebase configuration
├── firebase-init.js        # Firebase initialization
├── vite.config.js          # Vite configuration
└── package.json           # Project dependencies
```

## 🔐 Authentication

The application supports:
- Email/Password authentication
- Google Sign-in
- Role-based access control (Admin, Manager, User)

## 📅 Features

- Appointment scheduling
- User management
- Role-based access control
- Real-time updates
- Integration with external services
- Admin dashboard
- Time slot management
- Region management

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linting
- `npm run test` - Run tests

### Firebase Emulators
To run Firebase emulators locally:
```bash
firebase emulators:start
```

## 🔄 Integration

The application integrates with:
- Salesforce
- Geckoboard
- Call Tracking services

## 🚨 Troubleshooting

### Common Issues

1. **Firebase Connection Error**
   - Check your Firebase configuration
   - Ensure you have internet connection
   - Verify Firebase project is active

2. **Java Not Found**
   - Install Java JDK
   - Add Java to system PATH
   - Restart terminal

3. **Port Conflicts**
   - Check if ports 5173, 9099, 8082 are available
   - Kill processes using these ports
   - Use different ports in configuration

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Node.js Documentation](https://nodejs.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 👥 Support

For support, email [your-email@example.com] or open an issue in the repository.

---

Made with ❤️ by [Your Name] 