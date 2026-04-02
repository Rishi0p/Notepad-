const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Send messages to main process
  send: (channel, data) => {
    const validChannels = [
      'tab:save-content',
      'tab:open-file',
      'tab:save-as',
      'tab:close',
      'tab:new',
      'window:ready',
      'font-size:update',
      'menu:toggle-line-numbers',
      'menu:toggle-word-wrap'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Receive messages from main process
  on: (channel, callback) => {
    const validChannels = [
      'tabs:restore',
      'menu:find',
      'menu:find-replace',
      'menu:zoom-in',
      'menu:zoom-out',
      'menu:zoom-reset',
      'menu:new-tab',
      'menu:open-file',
      'menu:save-as',
      'menu:close-tab',
      'menu:undo',
      'menu:redo',
      'menu:toggle-line-numbers',
      'menu:toggle-word-wrap',
      'file:opened',
      'file:dropped'
    ];
    if (validChannels.includes(channel)) {
      const subscription = (_event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
  },

  // Invoke and get response from main process
  invoke: (channel, data) => {
    const validChannels = [
      'dialog:open-file',
      'dialog:save-file',
      'file:read',
      'file:write'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  }
});
