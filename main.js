import { app, BrowserWindow, session } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { collectionHelpers } from './collection-helpers.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Set up Content Security Policy for all sessions
app.whenReady().then(() => {
  // Set CSP for all sessions
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' https:;",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://cdnjs.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com;",
          "script-src-elem 'self' 'unsafe-inline' https://www.gstatic.com https://cdnjs.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com;",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;",
          "img-src 'self' data: https: https://*.google-analytics.com;",
          "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;",
          "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.google-analytics.com;",
          "frame-src 'self' https://*.google-analytics.com;"
        ].join(' ')
      }
    });
  });

  // Set CSP for new windows
  app.on('web-contents-created', (event, contents) => {
    contents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' https:;",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://cdnjs.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com;",
            "script-src-elem 'self' 'unsafe-inline' https://www.gstatic.com https://cdnjs.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com;",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;",
            "img-src 'self' data: https: https://*.google-analytics.com;",
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;",
            "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.google-analytics.com;",
            "frame-src 'self' https://*.google-analytics.com;"
          ].join(' ')
        }
      });
    });
  });
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      // Add these settings for Firebase Auth
      enableRemoteModule: true,
      nodeIntegrationInWorker: true
    }
  });

  // Set CSP for this window
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' https:;",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://cdnjs.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com;",
          "script-src-elem 'self' 'unsafe-inline' https://www.gstatic.com https://cdnjs.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com;",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;",
          "img-src 'self' data: https: https://*.google-analytics.com;",
          "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;",
          "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.google-analytics.com;",
          "frame-src 'self' https://*.google-analytics.com;"
        ].join(' ')
      }
    });
  });

  // Load the login page
  win.loadFile('login.html');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Initialize Firebase configuration
console.log('Initializing Firebase configuration...')

// Test the connection by getting the regions
collectionHelpers.getRegions()
    .then(regions => {
        console.log('Successfully connected to Firebase!')
        console.log('Available regions:', regions)
    })
    .catch(error => {
        console.error('Error connecting to Firebase:', error)
    }) 