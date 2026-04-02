import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SearchQuery, findNext, findPrevious, setSearchQuery, replaceNext, replaceAll } from '@codemirror/search';

export default function FindReplaceBar({ showReplace, onToggleReplace, onClose, editorView, showToast }) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [matchCount, setMatchCount] = useState({ current: 0, total: 0 });
  const findInputRef = useRef(null);

  // Focus find input when panel opens
  useEffect(() => {
    findInputRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Apply search to editor
  const applySearch = useCallback(() => {
    if (!editorView) return;

    // Ensure search extension is present
    const query = new SearchQuery({
      search: findText,
      replace: replaceText,
      caseSensitive: matchCase,
      wholeWord: wholeWord,
      regexp: useRegex,
    });

    editorView.dispatch({
      effects: setSearchQuery.of(query),
    });

    // Count matches
    if (findText) {
      let count = 0;
      let currentMatch = 0;
      const cursor = editorView.state.selection.main.head;
      const doc = editorView.state.doc.toString();
      
      try {
        let searchStr = findText;
        let flags = 'g';
        if (!matchCase) flags += 'i';
        
        if (!useRegex) {
          searchStr = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        if (wholeWord) {
          searchStr = `\\b${searchStr}\\b`;
        }
        
        const regex = new RegExp(searchStr, flags);
        let match;
        while ((match = regex.exec(doc)) !== null) {
          count++;
          if (match.index <= cursor && match.index + match[0].length >= cursor && currentMatch === 0) {
            currentMatch = count;
          }
          if (match[0].length === 0) break; // prevent infinite loop on empty match
        }
      } catch {
        // Invalid regex
      }
      
      setMatchCount({ current: currentMatch || (count > 0 ? 1 : 0), total: count });
    } else {
      setMatchCount({ current: 0, total: 0 });
    }
  }, [findText, replaceText, matchCase, wholeWord, useRegex, editorView]);

  // Update search on input change
  useEffect(() => {
    applySearch();
  }, [applySearch]);

  const handleFindNext = () => {
    if (!editorView) return;
    findNext(editorView);
    setTimeout(applySearch, 10);
  };

  const handleFindPrev = () => {
    if (!editorView) return;
    findPrevious(editorView);
    setTimeout(applySearch, 10);
  };

  const handleReplace = () => {
    if (!editorView) return;
    replaceNext(editorView);
    setTimeout(applySearch, 10);
  };

  const handleReplaceAll = () => {
    if (!editorView) return;
    const count = matchCount.total;
    replaceAll(editorView);
    setTimeout(() => {
      applySearch();
      showToast(`Replaced ${count} occurrences`);
    }, 10);
  };

  const handleFindKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) handleFindPrev();
      else handleFindNext();
    }
  };

  return (
    <div style={styles.panel}>
      {/* Row 1: Find */}
      <div style={styles.row}>
        <input
          ref={findInputRef}
          type="text"
          placeholder="Find..."
          value={findText}
          onChange={e => setFindText(e.target.value)}
          onKeyDown={handleFindKeyDown}
          style={styles.input}
        />
        <button style={styles.navBtn} onClick={handleFindPrev} title="Previous match (Shift+Enter)">▲</button>
        <button style={styles.navBtn} onClick={handleFindNext} title="Next match (Enter)">▼</button>
        {!showReplace && (
          <button style={styles.navBtn} onClick={onToggleReplace} title="Show Replace">⇄</button>
        )}
        <button style={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      {/* Row 2: Replace */}
      {showReplace && (
        <div style={styles.row}>
          <input
            type="text"
            placeholder="Replace..."
            value={replaceText}
            onChange={e => setReplaceText(e.target.value)}
            style={styles.input}
          />
          <button style={styles.replaceBtn} onClick={handleReplace}>Replace</button>
          <button style={styles.replaceAllBtn} onClick={handleReplaceAll}>Replace All</button>
        </div>
      )}

      {/* Row 3: Options + Match count */}
      <div style={styles.optionsRow}>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={matchCase}
            onChange={e => setMatchCase(e.target.checked)}
          />
          <span>Match Case</span>
        </label>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={wholeWord}
            onChange={e => setWholeWord(e.target.checked)}
          />
          <span>Whole Word</span>
        </label>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={useRegex}
            onChange={e => setUseRegex(e.target.checked)}
          />
          <span>Regex</span>
        </label>
        {findText && (
          <span style={styles.matchCount}>
            {matchCount.total > 0
              ? `${matchCount.current} of ${matchCount.total} matches`
              : 'No matches'}
          </span>
        )}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    position: 'absolute',
    top: 8,
    right: 16,
    width: 420,
    background: '#212121',
    border: '1px solid #2e2e2e',
    borderRadius: 8,
    padding: '12px 16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    animation: 'slideIn 0.15s ease-out',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    flex: 1,
    background: '#0d0d0d',
    border: '1px solid #2e2e2e',
    color: '#ececec',
    fontFamily: "'GeistMono', monospace",
    fontSize: 13,
    borderRadius: 4,
    padding: '6px 10px',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  navBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#2e2e2e',
    color: '#ececec',
    borderRadius: 4,
    cursor: 'pointer',
    border: 'none',
    fontSize: 12,
    transition: 'background 0.15s',
  },
  closeBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b6b6b',
    borderRadius: 4,
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontSize: 16,
    transition: 'color 0.15s',
  },
  replaceBtn: {
    padding: '6px 12px',
    background: '#2e2e2e',
    color: '#ececec',
    borderRadius: 4,
    cursor: 'pointer',
    border: 'none',
    fontSize: 12,
    fontFamily: "'Inter', sans-serif",
    transition: 'background 0.15s',
  },
  replaceAllBtn: {
    padding: '6px 12px',
    background: 'rgba(74, 222, 128, 0.15)',
    color: '#4ade80',
    border: '1px solid #4ade80',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: "'Inter', sans-serif",
    transition: 'background 0.15s',
  },
  optionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 12,
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: '#a0a0a0',
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    cursor: 'pointer',
  },
  matchCount: {
    marginLeft: 'auto',
    color: '#fbbf24',
    fontFamily: "'GeistMono', monospace",
    fontSize: 12,
  },
};
