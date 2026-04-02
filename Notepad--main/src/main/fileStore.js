let store;

async function initStore() {
  if (store) return store;
  const { default: Store } = await import('electron-store');
  store = new Store({
    schema: {
      tabs: {
        type: 'array',
        default: [],
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            filePath: { type: ['string', 'null'] },
            content: { type: 'string', default: '' },
            language: { type: 'string', default: 'plaintext' },
            cursorLine: { type: 'number', default: 1 },
            cursorCol: { type: 'number', default: 1 },
            scrollTop: { type: 'number', default: 0 },
            fontSize: { type: 'number', default: 14 }
          }
        }
      },
      activeTabId: { type: ['string', 'null'], default: null },
      windowBounds: {
        type: 'object',
        default: { width: 1200, height: 800 },
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number', default: 1200 },
          height: { type: 'number', default: 800 }
        }
      },
      globalFontSize: { type: 'number', default: 14 }
    }
  });
  return store;
}

async function saveTabs(tabs, activeTabId) {
  const s = await initStore();
  s.set('tabs', tabs);
  s.set('activeTabId', activeTabId);
}

async function getTabs() {
  const s = await initStore();
  return {
    tabs: s.get('tabs', []),
    activeTabId: s.get('activeTabId', null)
  };
}

async function saveWindowBounds(bounds) {
  const s = await initStore();
  s.set('windowBounds', bounds);
}

async function getWindowBounds() {
  const s = await initStore();
  return s.get('windowBounds', { width: 1200, height: 800 });
}

async function getGlobalFontSize() {
  const s = await initStore();
  return s.get('globalFontSize', 14);
}

async function setGlobalFontSize(size) {
  const s = await initStore();
  s.set('globalFontSize', size);
}

module.exports = {
  initStore,
  saveTabs,
  getTabs,
  saveWindowBounds,
  getWindowBounds,
  getGlobalFontSize,
  setGlobalFontSize
};
