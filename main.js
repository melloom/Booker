const electron = require('electron')
const { app, BrowserWindow } = electron
const path = require('path')
const { db, app: firebaseApp } = require('./firebase-config.js')
const { collectionHelpers } = require('./firebase-collections.js')

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true, // Enable web security
      allowRunningInsecureContent: false, // Disallow running insecure content
    }
  })

  // Set Content Security Policy
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' https:;",
          "script-src 'self' https: 'unsafe-inline';",
          "style-src 'self' https: 'unsafe-inline';",
          "img-src 'self' https: data:;",
          "font-src 'self' https: data:;",
          "connect-src 'self' https:;"
        ].join(' ')
    }
    });
  });

  // Open DevTools
  win.webContents.openDevTools()

  win.loadFile('login.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

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