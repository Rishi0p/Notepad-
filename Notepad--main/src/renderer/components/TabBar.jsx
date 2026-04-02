import React, { useRef, useEffect } from 'react';

export default function TabBar({ tabs, activeTabId, onSwitchTab, onCloseTab, onNewTab }) {
  const scrollRef = useRef(null);

  // Auto-scroll to active tab
  useEffect(() => {
    const activeEl = scrollRef.current?.querySelector('.tab-active');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }, [activeTabId]);

  const isUnsaved = (tab) => !tab.filePath && tab.content.length > 0;

  return (
    <div style={styles.tabBar}>
      <div ref={scrollRef} style={styles.tabScroll}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={tab.id === activeTabId ? 'tab-active' : ''}
            style={{
              ...styles.tab,
              ...(tab.id === activeTabId ? styles.tabActive : styles.tabInactive)
            }}
            onClick={() => onSwitchTab(tab.id)}
          >
            {isUnsaved(tab) && <span style={styles.unsavedDot} />}
            <span style={styles.tabTitle}>{tab.title}</span>
            <button
              style={styles.closeBtn}
              className="tab-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button style={styles.newTabBtn} onClick={onNewTab}>+</button>
      <style>{`
        .tab-close-btn { opacity: 0; transition: opacity 0.15s; }
        .tab-active .tab-close-btn,
        div:hover > .tab-close-btn { opacity: 1 !important; }
        .tab-close-btn:hover { color: #f87171 !important; }
        div[style]:hover { color: #a0a0a0 !important; }
      `}</style>
    </div>
  );
}

const styles = {
  tabBar: {
    height: 36,
    background: '#1a1a1a',
    borderBottom: '1px solid #2e2e2e',
    display: 'flex',
    alignItems: 'stretch',
    flexShrink: 0,
    overflow: 'hidden',
  },
  tabScroll: {
    display: 'flex',
    alignItems: 'stretch',
    flex: 1,
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  tab: {
    minWidth: 120,
    maxWidth: 200,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 8px 0 12px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.15s, color 0.15s',
    flexShrink: 0,
    fontSize: 12,
    fontFamily: "'Inter', sans-serif",
  },
  tabActive: {
    background: '#0d0d0d',
    borderTop: '2px solid #67e8f9',
    color: '#ececec',
  },
  tabInactive: {
    background: '#1a1a1a',
    borderTop: '2px solid transparent',
    color: '#6b6b6b',
  },
  tabTitle: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 12,
  },
  unsavedDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#fb923c',
    flexShrink: 0,
  },
  closeBtn: {
    width: 18,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: '#6b6b6b',
    borderRadius: 4,
    cursor: 'pointer',
    flexShrink: 0,
    border: 'none',
    background: 'none',
    padding: 0,
    lineHeight: 1,
  },
  newTabBtn: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: '#6b6b6b',
    cursor: 'pointer',
    transition: 'color 0.15s',
    border: 'none',
    background: 'none',
    flexShrink: 0,
  },
};
