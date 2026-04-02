import React, { useState, useRef, useEffect, useMemo } from 'react';

function NeonStar() {
  return (
    <div className="neon-star-wrapper">
      {/* Main 4-point star */}
      <svg
        className="neon-star-main"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"
          fill="url(#neon-star-fill)"
          stroke="url(#neon-star-stroke)"
          strokeWidth="0.5"
        />
        <defs>
          <linearGradient id="neon-star-fill" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00fff2" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#ff6ec7" />
          </linearGradient>
          <linearGradient id="neon-star-stroke" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00fff2" />
            <stop offset="100%" stopColor="#ff6ec7" />
          </linearGradient>
        </defs>
      </svg>
      {/* Mini orbiting stars */}
      <div className="neon-mini neon-mini-1">✦</div>
      <div className="neon-mini neon-mini-2">✦</div>
      <div className="neon-mini neon-mini-3">✧</div>
      <style>{`
        .neon-star-wrapper {
          position: relative;
          width: 26px;
          height: 26px;
          margin-right: 8px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .neon-star-main {
          animation: neonPulse 2.5s ease-in-out infinite, neonSpin 8s linear infinite;
          filter:
            drop-shadow(0 0 4px rgba(0, 255, 242, 0.6))
            drop-shadow(0 0 8px rgba(192, 132, 252, 0.4))
            drop-shadow(0 0 14px rgba(255, 110, 199, 0.3));
        }
        .neon-mini {
          position: absolute;
          font-size: 7px;
          pointer-events: none;
          line-height: 1;
        }
        .neon-mini-1 {
          top: -2px; right: -2px;
          color: #00fff2;
          animation: miniPop1 2s ease-in-out infinite;
          filter: drop-shadow(0 0 4px #00fff2);
        }
        .neon-mini-2 {
          bottom: 0px; left: -3px;
          color: #ff6ec7;
          animation: miniPop2 2.6s ease-in-out infinite 0.4s;
          filter: drop-shadow(0 0 4px #ff6ec7);
        }
        .neon-mini-3 {
          top: 1px; left: 0px;
          color: #c084fc;
          animation: miniPop3 3s ease-in-out infinite 0.8s;
          filter: drop-shadow(0 0 4px #c084fc);
        }
        @keyframes neonPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(0.92); }
        }
        @keyframes neonSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes miniPop1 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          20% { opacity: 1; transform: scale(1.3) translate(3px, -3px); }
          50% { opacity: 0.7; transform: scale(1) translate(5px, -5px); }
          70% { opacity: 0; transform: scale(0) translate(7px, -7px); }
        }
        @keyframes miniPop2 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          20% { opacity: 1; transform: scale(1.1) translate(-3px, 2px); }
          50% { opacity: 0.7; transform: scale(0.9) translate(-5px, 4px); }
          70% { opacity: 0; transform: scale(0) translate(-7px, 6px); }
        }
        @keyframes miniPop3 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          25% { opacity: 1; transform: scale(1) translate(-2px, -3px); }
          55% { opacity: 0.6; transform: scale(0.8) translate(-4px, -5px); }
          75% { opacity: 0; transform: scale(0) translate(-5px, -8px); }
        }
      `}</style>
    </div>
  );
}

function WpmWidget({ wpm }) {
  const clamped = Math.min(wpm, 200);
  const pct = (clamped / 200) * 100;

  const color = useMemo(() => {
    if (wpm === 0) return '#646669';
    if (wpm < 25) return '#d1d0c5';
    if (wpm < 50) return '#e2b714';
    if (wpm < 80) return '#4ade80';
    if (wpm < 120) return '#67e8f9';
    return '#c084fc';
  }, [wpm]);

  const caretColor = useMemo(() => {
    if (wpm === 0) return '#2c2e31';
    if (wpm < 25) return 'rgba(209, 208, 197, 0.15)';
    if (wpm < 50) return 'rgba(226, 183, 20, 0.15)';
    if (wpm < 80) return 'rgba(74, 222, 128, 0.15)';
    if (wpm < 120) return 'rgba(103, 232, 249, 0.15)';
    return 'rgba(192, 132, 252, 0.15)';
  }, [wpm]);

  return (
    <div className="no-drag" style={wpmS.outer}>
      <div style={wpmS.container}>
        <span style={{ ...wpmS.sparkle, opacity: wpm > 0 ? 1 : 0.3 }}>✦</span>
        <div style={wpmS.numberBlock}>
          <span
            className="wpm-number"
            style={{ ...wpmS.number, color }}
          >
            {wpm}
          </span>
        </div>
        <div style={wpmS.labelCol}>
          <span style={wpmS.wpmLabel}>wpm</span>
          <div style={wpmS.barTrack}>
            <div
              style={{
                ...wpmS.barFill,
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${color}cc, ${color})`,
                boxShadow: wpm > 0 ? `0 0 10px ${color}44, 0 0 4px ${color}66` : 'none',
              }}
            />
          </div>
        </div>
        <div
          style={{
            ...wpmS.caret,
            background: caretColor,
            borderColor: wpm > 0 ? `${color}33` : 'transparent',
          }}
        >
          <span style={{ ...wpmS.caretPipe, color }}>|</span>
        </div>
      </div>
      <style>{`
        .wpm-number {
          transition: color 0.3s ease, transform 0.15s ease;
        }
      `}</style>
    </div>
  );
}

const wpmS = {
  outer: {
    display: 'flex',
    alignItems: 'center',
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#1a1a1a',
    border: '1px solid #2e2e2e',
    borderRadius: 8,
    padding: '4px 10px 4px 8px',
    height: 32,
  },
  sparkle: {
    fontSize: 12,
    color: '#e2b714',
    transition: 'opacity 0.3s',
    lineHeight: 1,
  },
  numberBlock: {
    display: 'flex',
    alignItems: 'baseline',
    minWidth: 32,
    justifyContent: 'flex-end',
  },
  number: {
    fontFamily: "'Roboto Mono', 'JetBrains Mono', monospace",
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    lineHeight: 1,
    transition: 'color 0.3s ease',
  },
  labelCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 36,
  },
  wpmLabel: {
    fontFamily: "'Roboto Mono', 'JetBrains Mono', monospace",
    fontSize: 8,
    fontWeight: 500,
    color: '#646669',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    lineHeight: 1,
  },
  barTrack: {
    width: 36,
    height: 3,
    borderRadius: 2,
    background: '#2c2e31',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease, box-shadow 0.3s ease',
  },
  caret: {
    width: 14,
    height: 20,
    borderRadius: 3,
    border: '1px solid transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.3s, border-color 0.3s',
  },
  caretPipe: {
    fontFamily: "'Roboto Mono', monospace",
    fontSize: 14,
    fontWeight: 300,
    lineHeight: 1,
    animation: 'caretBlink 1s step-end infinite',
    transition: 'color 0.3s',
  },
};

export default function Toolbar({ fontSize, wpm, onNewTab, onOpenFile, onSaveAs, onFind, onFindReplace }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menus = {
    File: [
      { label: 'New Tab', shortcut: 'Ctrl+T', action: () => { onNewTab(); setActiveMenu(null); } },
      { label: 'Open File', shortcut: 'Ctrl+O', action: () => { onOpenFile(); setActiveMenu(null); } },
      { label: 'Save As', shortcut: 'Ctrl+Shift+S', action: () => { onSaveAs(); setActiveMenu(null); } },
      { type: 'separator' },
    ],
    Edit: [
      { label: 'Find', shortcut: 'Ctrl+F', action: () => { onFind(); setActiveMenu(null); } },
      { label: 'Find & Replace', shortcut: 'Ctrl+H', action: () => { onFindReplace(); setActiveMenu(null); } },
    ],
    View: [
      { label: 'Zoom In', shortcut: 'Ctrl +', action: () => { setActiveMenu(null); } },
      { label: 'Zoom Out', shortcut: 'Ctrl −', action: () => { setActiveMenu(null); } },
      { label: 'Reset Zoom', shortcut: 'Ctrl 0', action: () => { setActiveMenu(null); } },
    ],
  };

  return (
    <div className="toolbar drag-region" style={styles.toolbar}>
      <div style={styles.left}>
        <NeonStar />
        <span style={styles.appName}>NoteForge</span>
      </div>
      <div className="no-drag" style={styles.center} ref={menuRef}>
        {Object.keys(menus).map(menu => (
          <div key={menu} style={styles.menuWrapper}>
            <button
              style={{
                ...styles.menuItem,
                ...(activeMenu === menu ? styles.menuItemActive : {})
              }}
              onClick={() => setActiveMenu(activeMenu === menu ? null : menu)}
              onMouseEnter={() => activeMenu && setActiveMenu(menu)}
            >
              {menu}
            </button>
            {activeMenu === menu && (
              <div style={styles.dropdown}>
                {menus[menu].map((item, i) =>
                  item.type === 'separator' ? (
                    <div key={i} style={styles.separator} />
                  ) : (
                    <button key={i} style={styles.dropdownItem} onClick={item.action}>
                      <span>{item.label}</span>
                      <span style={styles.shortcut}>{item.shortcut}</span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="no-drag" style={styles.right}>
        <WpmWidget wpm={wpm} />
        <div style={styles.fontBadge}>
          <span style={styles.fontSizeDisplay}>{fontSize}px</span>
        </div>
      </div>
      <style>{`
        @keyframes caretBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  toolbar: {
    height: 44,
    background: '#212121',
    borderBottom: '1px solid #2e2e2e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px 0 16px',
    flexShrink: 0,
    position: 'relative',
    zIndex: 100,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 8,
  },
  appName: {
    fontFamily: "'Roboto Mono', 'JetBrains Mono', monospace",
    fontWeight: 600,
    fontSize: 14,
    color: '#e2b714',
    letterSpacing: '0.02em',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  menuWrapper: {
    position: 'relative',
  },
  menuItem: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 400,
    fontSize: 13,
    color: '#646669',
    padding: '6px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'color 0.15s, background 0.15s',
    border: 'none',
    background: 'none',
  },
  menuItemActive: {
    color: '#d1d0c5',
    background: '#2c2e31',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    background: '#1a1a1a',
    border: '1px solid #2e2e2e',
    borderRadius: 8,
    padding: '4px 0',
    minWidth: 220,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    zIndex: 200,
  },
  dropdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '8px 16px',
    color: '#d1d0c5',
    fontSize: 13,
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    transition: 'background 0.1s',
    textAlign: 'left',
  },
  shortcut: {
    color: '#646669',
    fontSize: 11,
    fontFamily: "'Roboto Mono', 'JetBrains Mono', monospace",
    marginLeft: 24,
  },
  separator: {
    height: 1,
    background: '#2e2e2e',
    margin: '4px 0',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  fontBadge: {
    background: '#1a1a1a',
    border: '1px solid #2e2e2e',
    borderRadius: 6,
    padding: '4px 10px',
    height: 28,
    display: 'flex',
    alignItems: 'center',
  },
  fontSizeDisplay: {
    fontFamily: "'Roboto Mono', 'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: 500,
    color: '#646669',
    letterSpacing: '0.02em',
  },
};
