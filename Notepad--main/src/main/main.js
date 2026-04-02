const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { initStore, saveTabs, getTabs, saveWindowBounds, getWindowBounds, getGlobalFontSize, setGlobalFontSize } = require('./fileStore');

let mainWindow;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

async function createWindow() {
  // Initialize store first
  await initStore();
  const bounds = await getWindowBounds();

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 600,
    minHeight: 400,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    transparent: false,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    },
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:1111');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Save window bounds on resize/move (debounced)
  let boundsTimer;
  const debouncedSaveBounds = () => {
    if (boundsTimer) clearTimeout(boundsTimer);
    boundsTimer = setTimeout(() => {
      if (mainWindow) saveWindowBounds(mainWindow.getBounds());
    }, 500);
  };
  mainWindow.on('resize', debouncedSaveBounds);
  mainWindow.on('move', debouncedSaveBounds);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle file drops
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  createMenu();
}

function createMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow?.webContents.send('menu:new-tab')
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: () => handleOpenFile()
        },
        {
          label: 'Save As',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu:save-as')
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow?.webContents.send('menu:close-tab')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => mainWindow?.webContents.send('menu:undo')
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Shift+Z',
          click: () => mainWindow?.webContents.send('menu:redo')
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow?.webContents.send('menu:find')
        },
        {
          label: 'Find & Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => mainWindow?.webContents.send('menu:find-replace')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => mainWindow?.webContents.send('menu:zoom-in')
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow?.webContents.send('menu:zoom-out')
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.send('menu:zoom-reset')
        },
        { type: 'separator' },
        {
          label: 'Toggle Line Numbers',
          click: () => mainWindow?.webContents.send('menu:toggle-line-numbers')
        },
        {
          label: 'Toggle Word Wrap',
          click: () => mainWindow?.webContents.send('menu:toggle-word-wrap')
        },
        { type: 'separator' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : [])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function handleOpenFile() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Text Files', extensions: ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'java', 'cpp', 'c', 'h'] }
    ]
  });

  if (!result.canceled) {
    for (const filePath of result.filePaths) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        mainWindow.webContents.send('file:opened', { filePath, content });
      } catch (err) {
        console.error('Failed to read file:', err);
      }
    }
  }
}

// IPC Handlers
ipcMain.on('tab:save-content', (_event, data) => {
  saveTabs(data.tabs, data.activeTabId);
});

ipcMain.on('window:ready', async (_event) => {
  const { tabs, activeTabId } = await getTabs();
  const globalFontSize = await getGlobalFontSize();
  mainWindow.webContents.send('tabs:restore', { tabs, activeTabId, globalFontSize });
});

ipcMain.on('font-size:update', (_event, size) => {
  setGlobalFontSize(size);
});

ipcMain.handle('dialog:open-file', async () => {
  await handleOpenFile();
});

ipcMain.handle('dialog:save-file', async (_event, { content, defaultPath }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultPath || 'untitled.txt',
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'JavaScript', extensions: ['js', 'jsx'] },
      { name: 'Python', extensions: ['py'] },
      { name: 'HTML', extensions: ['html', 'htm'] },
      { name: 'CSS', extensions: ['css'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'Markdown', extensions: ['md'] }
    ]
  });

  if (!result.canceled) {
    try {
      fs.writeFileSync(result.filePath, content, 'utf-8');
      return { success: true, filePath: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, canceled: true };
});

ipcMain.handle('file:read', async (_event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
