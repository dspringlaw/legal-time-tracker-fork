const { app, BrowserWindow, ipcMain, Menu, Tray, shell } = require('electron');
const path = require('path');
const url = require('url');
const Store = require('electron-store');

// Initialize data store
const store = new Store({
  name: 'legal-time-tracker-data',
  defaults: {
    clients: [],
    timeEntries: []
  }
});

let mainWindow;
let tray = null;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.png')
  });

  // Load the index.html from the React app
  let startUrl;
  
  if (process.env.ELECTRON_START_URL) {
    // Use the development server URL if provided
    startUrl = process.env.ELECTRON_START_URL;
  } else {
    try {
      // Try to use the built app
      startUrl = url.format({
        pathname: path.join(__dirname, '../build/index.html'),
        protocol: 'file:',
        slashes: true
      });
    } catch (error) {
      // Fallback to development server
      console.error('Failed to load build/index.html, falling back to development server:', error);
      startUrl = 'http://localhost:3000';
    }
  }
  
  mainWindow.loadURL(startUrl);

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create tray icon
  createTray();
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, '../public/icon.png');
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Open Legal Time Tracker', 
        click: () => {
          if (mainWindow === null) {
            createWindow();
          } else {
            mainWindow.show();
          }
        } 
      },
    { 
      label: 'Start Timer', 
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('start-timer');
        }
      } 
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('Legal Time Tracker');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
  } catch (error) {
    console.error('Failed to create tray icon:', error);
    // Continue without tray icon
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS re-create a window when the dock icon is clicked and no windows are open
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for data operations
ipcMain.handle('get-clients', () => {
  return store.get('clients');
});

ipcMain.handle('add-client', (event, client) => {
  const clients = store.get('clients');
  client.id = Date.now().toString(); // Simple ID generation
  clients.push(client);
  store.set('clients', clients);
  return client;
});

ipcMain.handle('update-client', (event, updatedClient) => {
  const clients = store.get('clients');
  const index = clients.findIndex(client => client.id === updatedClient.id);
  if (index !== -1) {
    clients[index] = updatedClient;
    store.set('clients', clients);
    return updatedClient;
  }
  return null;
});

ipcMain.handle('delete-client', (event, clientId) => {
  const clients = store.get('clients');
  const newClients = clients.filter(client => client.id !== clientId);
  store.set('clients', newClients);
  
  // Also delete all time entries for this client
  const timeEntries = store.get('timeEntries');
  const newTimeEntries = timeEntries.filter(entry => entry.clientId !== clientId);
  store.set('timeEntries', newTimeEntries);
  
  return true;
});

ipcMain.handle('get-time-entries', () => {
  return store.get('timeEntries');
});

ipcMain.handle('add-time-entry', (event, timeEntry) => {
  const timeEntries = store.get('timeEntries');
  timeEntry.id = Date.now().toString(); // Simple ID generation
  timeEntries.push(timeEntry);
  store.set('timeEntries', timeEntries);
  return timeEntry;
});

ipcMain.handle('update-time-entry', (event, updatedEntry) => {
  const timeEntries = store.get('timeEntries');
  const index = timeEntries.findIndex(entry => entry.id === updatedEntry.id);
  if (index !== -1) {
    timeEntries[index] = updatedEntry;
    store.set('timeEntries', timeEntries);
    return updatedEntry;
  }
  return null;
});

ipcMain.handle('delete-time-entry', (event, entryId) => {
  const timeEntries = store.get('timeEntries');
  const newTimeEntries = timeEntries.filter(entry => entry.id !== entryId);
  store.set('timeEntries', newTimeEntries);
  return true;
});

// Create desktop shortcut
ipcMain.handle('create-desktop-shortcut', () => {
  const shortcutPath = path.join(app.getPath('desktop'), 'Legal Time Tracker.lnk');
  shell.writeShortcutLink(shortcutPath, {
    target: app.getPath('exe'),
    args: app.getAppPath(),
    icon: path.join(__dirname, '../public/icon.png'),
    description: 'Legal Time Tracker'
  });
  return true;
});