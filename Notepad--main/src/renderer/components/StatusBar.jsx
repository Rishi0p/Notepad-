import React, { useState } from 'react';

const LANGUAGES = [
  { id: 'plaintext', label: 'Plain Text' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C/C++' },
];

export default function StatusBar({ cursorLine, cursorCol, fileName, language, onLanguageChange }) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langLabel = LANGUAGES.find(l => l.id === language)?.label || language;

  return (
    <div style={styles.statusBar}>
      <div style={styles.left}>
        <span style={styles.cursorInfo}>
          Ln {cursorLine}, Col {cursorCol}
        </span>
      </div>
      <div style={styles.center}>
        <span style={styles.fileName}>{fileName}</span>
      </div>
      <div style={styles.right}>
        <div style={{ position: 'relative' }}>
          <button
            style={styles.langBtn}
            onClick={() => setShowLangMenu(!showLangMenu)}
          >
            {langLabel}
          </button>
          {showLangMenu && (
            <div style={styles.langMenu}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  style={{
                    ...styles.langMenuItem,
                    ...(lang.id === language ? styles.langMenuItemActive : {})
                  }}
                  onClick={() => {
                    onLanguageChange(lang.id);
                    setShowLangMenu(false);
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <span style={styles.encoding}>UTF-8</span>
      </div>
      {showLangMenu && (
        <div style={styles.overlay} onClick={() => setShowLangMenu(false)} />
      )}
    </div>
  );
}

const styles = {
  statusBar: {
    height: 26,
    background: '#1a1a1a',
    borderTop: '1px solid #2e2e2e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    flexShrink: 0,
    position: 'relative',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  cursorInfo: {
    fontFamily: "'Roboto Mono', 'JetBrains Mono', monospace",
    fontSize: 11,
    color: '#646669',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
  },
  fileName: {
    fontFamily: "'Roboto Mono', 'JetBrains Mono', monospace",
    fontSize: 11,
    color: '#646669',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  langBtn: {
    fontFamily: "'Roboto Mono', 'JetBrains Mono', monospace",
    fontSize: 11,
    color: '#e2b714',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    padding: '2px 6px',
    borderRadius: 3,
    transition: 'background 0.15s',
  },
  encoding: {
    fontFamily: "'Roboto Mono', 'JetBrains Mono', monospace",
    fontSize: 11,
    color: '#646669',
  },
  langMenu: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    background: '#1a1a1a',
    border: '1px solid #2e2e2e',
    borderRadius: 8,
    padding: '4px 0',
    minWidth: 150,
    boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
    zIndex: 300,
    marginBottom: 4,
  },
  langMenuItem: {
    display: 'block',
    width: '100%',
    padding: '6px 12px',
    color: '#d1d0c5',
    fontSize: 12,
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    transition: 'background 0.1s',
  },
  langMenuItemActive: {
    color: '#e2b714',
    background: 'rgba(226, 183, 20, 0.1)',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 299,
  },
};
