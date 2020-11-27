// Vendor
const {app, BrowserWindow, ipcMain} = require('electron');
const settings = require('electron-settings');

// Constants
const DEVTOOL_OPTIONS = {mode: 'detach'};

const OVERLAY_SIZE = {
  large: {
    height: 70,
    width: 460
  },
  medium: {
    height: 60,
    width: 400
  },
  small: {
    height: 50,
    width: 350
  }
};

let overlayWindow;
let settingsWindow;
let debug = process.argv[2] === 'debug';

function createOverlayWindow() {
  const windowOptions = {
    height: 70,
    width: 450,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    },
  };

  if (settings.has('overlay.size')) {
    const {height, width} = OVERLAY_SIZE[settings.get('overlay.size')];
    windowOptions.height = height;
    windowOptions.width = width;
  }

  if (settings.has('position')) {
    windowOptions.x = settings.get('position.x');
    windowOptions.y = settings.get('position.y');
  }

  overlayWindow = new BrowserWindow(windowOptions);

  overlayWindow.loadFile('./src/ui/overlay.html');

  overlayWindow.setMenu(null);

  overlayWindow.on('closed', () => overlayWindow = null);

  overlayWindow.on('move', () => {
    const [x, y] = overlayWindow.getPosition();
    settings.set('position', {x, y});
  });

  if (debug) overlayWindow.webContents.openDevTools(DEVTOOL_OPTIONS);
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 600,
    x: settings.get('position.x'),
    y: settings.get('position.y'),
    modal: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  settingsWindow.loadFile('./src/ui/settings.html');

  settingsWindow.setMenu(null);

  settingsWindow.on('closed', () => {
    overlayWindow.send('forceChaosRecipeRefresh')
    settingsWindow = null;
  });

  if (debug) settingsWindow.webContents.openDevTools(DEVTOOL_OPTIONS);
}

app.on('ready', () => {
  createOverlayWindow();
});

app.on('window-all-closed', () => app.quit());

ipcMain.on('overlay-size-changed', () => {
  const {height, width} = OVERLAY_SIZE[settings.get('overlay.size')];
  overlayWindow.setBounds({width, height});
});

ipcMain.on('open-options', () => {
  if (!settingsWindow) {
    createSettingsWindow();
    settingsWindow.show();
  }
});
