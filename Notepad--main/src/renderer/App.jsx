import React, { useState, useEffect, useRef, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import TabBar from './components/TabBar';
import Editor from './components/Editor';
import FindReplaceBar from './components/FindReplaceBar';
import StatusBar from './components/StatusBar';
import { v4 as uuidv4 } from 'uuid';

function createNewTab(index = 1) {
  return {
    id: uuidv4(),
    title: `Untitled-${index}`,
    filePath: null,
    content: '',
    language: 'plaintext',
    cursorLine: 1,
    cursorCol: 1,
    scrollTop: 0,
    fontSize: 14
  };
}

function detectLanguage(filePath) {
  if (!filePath) return 'plaintext';
  const ext = filePath.split('.').pop().toLowerCase();
  const langMap = {
    js: 'javascript', jsx: 'javascript', ts: 'javascript', tsx: 'javascript',
    py: 'python',
    html: 'html', htm: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    java: 'java',
    cpp: 'cpp', c: 'cpp', h: 'cpp',
  };
  return langMap[ext] || 'plaintext';
}

export default function App() {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [showFind, setShowFind] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [globalFontSize, setGlobalFontSize] = useState(14);
  const [toast, setToast] = useState(null);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const untitledCounter = useRef(1);
  const editorRef = useRef(null);
  const toastTimer = useRef(null);
  const saveTimer = useRef(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || null;

  // ─── WPM tracking ───
  const keystrokeTimestamps = useRef([]);
  const [wpm, setWpm] = useState(0);
  const wpmInterval = useRef(null);

  const recordKeystroke = useCallback(() => {
    const now = Date.now();
    keystrokeTimestamps.current.push(now);
    // Keep only last 10 seconds of keystrokes
    const cutoff = now - 10000;
    keystrokeTimestamps.current = keystrokeTimestamps.current.filter(t => t >= cutoff);
  }, []);

  useEffect(() => {
    wpmInterval.current = setInterval(() => {
      const now = Date.now();
      const cutoff = now - 10000;
      const recent = keystrokeTimestamps.current.filter(t => t >= cutoff);
      // Average word = 5 characters; extrapolate 10s window to 60s
      const wordsInWindow = recent.length / 5;
      const currentWpm = Math.round(wordsInWindow * 6);
      setWpm(currentWpm);
    }, 500);
    return () => clearInterval(wpmInterval.current);
  }, []);

  // Show toast notification
  const showToast = useCallback((message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 1200);
  }, []);

  // Persist tabs to electron-store OR localStorage (debounced)
  const persistTabs = useCallback((updatedTabs, activeId) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (window.electronAPI) {
        window.electronAPI.send('tab:save-content', {
          tabs: updatedTabs,
          activeTabId: activeId
        });
      } else {
        // Browser mode: save to localStorage
        try {
          localStorage.setItem('noteforge_tabs', JSON.stringify(updatedTabs));
          localStorage.setItem('noteforge_activeTabId', activeId);
        } catch { /* quota exceeded or private mode */ }
      }
    }, 300);
  }, []);

  // Add new tab
  const addNewTab = useCallback(() => {
    const newTab = createNewTab(untitledCounter.current++);
    setTabs(prev => {
      const updated = [...prev, newTab];
      setActiveTabId(newTab.id);
      persistTabs(updated, newTab.id);
      return updated;
    });
  }, [persistTabs]);

  // Close tab
  const closeTab = useCallback((tabId) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === tabId);
      const updated = prev.filter(t => t.id !== tabId);
      if (updated.length === 0) {
        const newTab = createNewTab(untitledCounter.current++);
        const withNew = [newTab];
        setActiveTabId(newTab.id);
        persistTabs(withNew, newTab.id);
        return withNew;
      }
      if (tabId === activeTabId) {
        const newIdx = Math.min(idx, updated.length - 1);
        setActiveTabId(updated[newIdx].id);
        persistTabs(updated, updated[newIdx].id);
      } else {
        persistTabs(updated, activeTabId);
      }
      return updated;
    });
  }, [activeTabId, persistTabs]);

  // Switch tab
  const switchTab = useCallback((tabId) => {
    setActiveTabId(tabId);
    persistTabs(tabs, tabId);
  }, [tabs, persistTabs]);

  // Update tab content
  const updateTabContent = useCallback((tabId, content) => {
    setTabs(prev => {
      const updated = prev.map(t => t.id === tabId ? { ...t, content } : t);
      persistTabs(updated, activeTabId);
      return updated;
    });
  }, [activeTabId, persistTabs]);

  // Update tab cursor
  const updateTabCursor = useCallback((tabId, cursorLine, cursorCol) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, cursorLine, cursorCol } : t));
  }, []);

  // Update tab language
  const updateTabLanguage = useCallback((tabId, language) => {
    setTabs(prev => {
      const updated = prev.map(t => t.id === tabId ? { ...t, language } : t);
      persistTabs(updated, activeTabId);
      return updated;
    });
  }, [activeTabId, persistTabs]);

  // Open file into new tab
  const openFileInTab = useCallback((filePath, content) => {
    // Check if file is already open
    const existing = tabs.find(t => t.filePath === filePath);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }

    const lang = detectLanguage(filePath);
    const title = filePath.split('/').pop();
    const newTab = {
      id: uuidv4(),
      title,
      filePath,
      content,
      language: lang,
      cursorLine: 1,
      cursorCol: 1,
      scrollTop: 0,
      fontSize: globalFontSize
    };
    setTabs(prev => {
      const updated = [...prev, newTab];
      setActiveTabId(newTab.id);
      persistTabs(updated, newTab.id);
      return updated;
    });
  }, [tabs, globalFontSize, persistTabs]);

  // Persist font size
  const persistFontSize = useCallback((size) => {
    if (window.electronAPI) window.electronAPI.send('font-size:update', size);
    else { try { localStorage.setItem('noteforge_fontSize', String(size)); } catch { /* ignore */ } }
  }, []);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setGlobalFontSize(prev => {
      const next = Math.min(prev + 2, 48);
      showToast(`Font Size: ${next}px`);
      persistFontSize(next);
      return next;
    });
  }, [showToast, persistFontSize]);

  const zoomOut = useCallback(() => {
    setGlobalFontSize(prev => {
      const next = Math.max(prev - 2, 8);
      showToast(`Font Size: ${next}px`);
      persistFontSize(next);
      return next;
    });
  }, [showToast, persistFontSize]);

  const zoomReset = useCallback(() => {
    setGlobalFontSize(14);
    showToast('Font Size: 14px');
    persistFontSize(14);
  }, [showToast, persistFontSize]);

  // Save As
  const handleSaveAs = useCallback(async () => {
    if (!activeTab || !window.electronAPI) return;
    const result = await window.electronAPI.invoke('dialog:save-file', {
      content: activeTab.content,
      defaultPath: activeTab.filePath || activeTab.title
    });
    if (result?.success) {
      const lang = detectLanguage(result.filePath);
      const title = result.filePath.split('/').pop();
      setTabs(prev => {
        const updated = prev.map(t =>
          t.id === activeTabId
            ? { ...t, filePath: result.filePath, title, language: lang }
            : t
        );
        persistTabs(updated, activeTabId);
        return updated;
      });
      showToast('File saved');
    }
  }, [activeTab, activeTabId, persistTabs, showToast]);

  // Initialize — restore tabs or create default
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.send('window:ready');

      window.electronAPI.on('tabs:restore', (data) => {
        if (data.tabs && data.tabs.length > 0) {
          setTabs(data.tabs);
          setActiveTabId(data.activeTabId || data.tabs[0].id);
          // Find max untitled counter
          const maxUntitled = data.tabs.reduce((max, t) => {
            const match = t.title.match(/^Untitled-(\d+)$/);
            return match ? Math.max(max, parseInt(match[1])) : max;
          }, 0);
          untitledCounter.current = maxUntitled + 1;
          if (data.globalFontSize) setGlobalFontSize(data.globalFontSize);
        } else {
          addNewTab();
        }
      });

      window.electronAPI.on('file:opened', (data) => {
        openFileInTab(data.filePath, data.content);
      });

      window.electronAPI.on('file:dropped', (data) => {
        openFileInTab(data.filePath, data.content);
      });

      window.electronAPI.on('menu:new-tab', () => addNewTab());
      window.electronAPI.on('menu:close-tab', () => {
        if (activeTabId) closeTab(activeTabId);
      });
      window.electronAPI.on('menu:find', () => {
        setShowFind(true);
        setShowReplace(false);
      });
      window.electronAPI.on('menu:find-replace', () => {
        setShowFind(true);
        setShowReplace(true);
      });
      window.electronAPI.on('menu:zoom-in', () => zoomIn());
      window.electronAPI.on('menu:zoom-out', () => zoomOut());
      window.electronAPI.on('menu:zoom-reset', () => zoomReset());
      window.electronAPI.on('menu:save-as', () => handleSaveAs());
      window.electronAPI.on('menu:undo', () => {
        if (editorRef.current?.undo) editorRef.current.undo();
      });
      window.electronAPI.on('menu:redo', () => {
        if (editorRef.current?.redo) editorRef.current.redo();
      });
      window.electronAPI.on('menu:toggle-line-numbers', () => {
        setLineNumbers(prev => !prev);
      });
      window.electronAPI.on('menu:toggle-word-wrap', () => {
        setWordWrap(prev => !prev);
      });
    } else {
      // Running without Electron (browser mode) → restore from localStorage
      try {
        const savedTabs = localStorage.getItem('noteforge_tabs');
        const savedActiveId = localStorage.getItem('noteforge_activeTabId');
        const savedFontSize = localStorage.getItem('noteforge_fontSize');
        if (savedTabs) {
          const parsedTabs = JSON.parse(savedTabs);
          if (parsedTabs.length > 0) {
            setTabs(parsedTabs);
            setActiveTabId(savedActiveId || parsedTabs[0].id);
            const maxUntitled = parsedTabs.reduce((max, t) => {
              const match = t.title.match(/^Untitled-(\d+)$/);
              return match ? Math.max(max, parseInt(match[1])) : max;
            }, 0);
            untitledCounter.current = maxUntitled + 1;
            if (savedFontSize) setGlobalFontSize(parseInt(savedFontSize));
          } else {
            addNewTab();
          }
        } else {
          addNewTab();
        }
      } catch {
        addNewTab();
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle file drag & drop in renderer
  useEffect(() => {
    const handleDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        const content = await file.text();
        openFileInTab(file.path || file.name, content);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragover', handleDragOver);
    return () => {
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragover', handleDragOver);
    };
  }, [openFileInTab]);

  // Ctrl+Plus / Ctrl+Minus / Ctrl+0 zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          zoomReset();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, zoomReset]);

  // Update CSS variable for font size
  useEffect(() => {
    document.documentElement.style.setProperty('--editor-font-size', globalFontSize + 'px');
  }, [globalFontSize]);

  return (
    <div className="app-container">
      <Toolbar
        fontSize={globalFontSize}
        wpm={wpm}
        onNewTab={addNewTab}
        onOpenFile={() => window.electronAPI?.invoke('dialog:open-file')}
        onSaveAs={handleSaveAs}
        onFind={() => { setShowFind(true); setShowReplace(false); }}
        onFindReplace={() => { setShowFind(true); setShowReplace(true); }}
      />
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitchTab={switchTab}
        onCloseTab={closeTab}
        onNewTab={addNewTab}
      />
      <div className="editor-wrapper">
        {showFind && (
          <FindReplaceBar
            showReplace={showReplace}
            onToggleReplace={() => setShowReplace(prev => !prev)}
            onClose={() => { setShowFind(false); setShowReplace(false); }}
            editorView={editorRef.current?.view}
            showToast={showToast}
          />
        )}
        {activeTab && (
          <Editor
            ref={editorRef}
            key={activeTab.id}
            tab={activeTab}
            fontSize={globalFontSize}
            lineNumbers={lineNumbers}
            wordWrap={wordWrap}
            onContentChange={(content) => updateTabContent(activeTab.id, content)}
            onCursorChange={(line, col) => updateTabCursor(activeTab.id, line, col)}
            onLanguageChange={(lang) => updateTabLanguage(activeTab.id, lang)}
            onKeystroke={recordKeystroke}
            showToast={showToast}
          />
        )}
      </div>
      <StatusBar
        cursorLine={activeTab?.cursorLine || 1}
        cursorCol={activeTab?.cursorCol || 1}
        fileName={activeTab?.title || ''}
        language={activeTab?.language || 'plaintext'}
        onLanguageChange={(lang) => activeTab && updateTabLanguage(activeTab.id, lang)}
      />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
