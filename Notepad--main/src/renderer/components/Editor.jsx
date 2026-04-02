import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers as lineNumbersExt, highlightActiveLine, highlightSpecialChars, drawSelection, rectangularSelection, crosshairCursor, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, undo, redo, indentMore, indentLess } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting, HighlightStyle, indentUnit } from '@codemirror/language';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches } from '@codemirror/search';
import { tags } from '@lezer/highlight';

// Language imports
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';

// ─── Updated syntax highlighting (One Dark inspired palette) ───
const noteForgeHighlightStyle = HighlightStyle.define([
  // Keywords — soft orange
  { tag: tags.keyword, color: '#e5c07b' },
  { tag: tags.controlKeyword, color: '#e5c07b' },
  { tag: tags.definitionKeyword, color: '#e5c07b' },
  { tag: tags.moduleKeyword, color: '#e5c07b' },
  { tag: tags.operatorKeyword, color: '#e5c07b' },

  // Strings — green
  { tag: tags.string, color: '#98c379' },
  { tag: tags.special(tags.string), color: '#98c379' },

  // Numbers — cyan/teal
  { tag: tags.number, color: '#56b6c2' },

  // Booleans & null — orange
  { tag: tags.bool, color: '#d19a66' },
  { tag: tags.null, color: '#d19a66' },

  // Comments — gray muted, italic
  { tag: tags.comment, color: '#7f848e', fontStyle: 'italic' },
  { tag: tags.lineComment, color: '#7f848e', fontStyle: 'italic' },
  { tag: tags.blockComment, color: '#7f848e', fontStyle: 'italic' },
  { tag: tags.docComment, color: '#7f848e', fontStyle: 'italic' },

  // Functions — blue/purple
  { tag: tags.function(tags.variableName), color: '#61afef' },
  { tag: tags.function(tags.definition(tags.variableName)), color: '#61afef' },

  // Variables / params — soft grey (keeps plain text neutral)
  { tag: tags.variableName, color: '#abb2bf' },
  { tag: tags.definition(tags.variableName), color: '#abb2bf' },

  // Operators — white plain
  { tag: tags.operator, color: '#abb2bf' },

  // Types / Classes — yellow
  { tag: tags.className, color: '#e5c07b' },
  { tag: tags.definition(tags.className), color: '#e5c07b' },
  { tag: tags.typeName, color: '#e5c07b' },

  // Properties — blue
  { tag: tags.propertyName, color: '#61afef' },
  { tag: tags.definition(tags.propertyName), color: '#61afef' },

  // HTML attributes — orange
  { tag: tags.attributeName, color: '#d19a66' },
  { tag: tags.attributeValue, color: '#98c379' },

  // HTML Tags — soft red
  { tag: tags.tagName, color: '#e06c75' },

  // Punctuation / angle brackets — white/plain
  { tag: tags.angleBracket, color: '#abb2bf' },
  { tag: tags.bracket, color: '#abb2bf' },
  { tag: tags.paren, color: '#abb2bf' },
  { tag: tags.squareBracket, color: '#abb2bf' },
  { tag: tags.brace, color: '#abb2bf' },
  { tag: tags.separator, color: '#abb2bf' },
  { tag: tags.punctuation, color: '#abb2bf' },

  // Meta
  { tag: tags.meta, color: '#e5c07b' },
  { tag: tags.regexp, color: '#56b6c2' },
  { tag: tags.escape, color: '#56b6c2' },
  { tag: tags.link, color: '#61afef', textDecoration: 'underline' },
  { tag: tags.heading, color: '#e06c75', fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },

  // Catch-all: any unmatched content stays grey
  { tag: tags.content, color: '#abb2bf' },
]);

// Dark theme matching design system
const noteForgeTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0d0d0d',
    color: '#abb2bf',
  },
  '.cm-content': {
    caretColor: '#67e8f9',
    fontFamily: "'JetBrains Mono', monospace",
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#67e8f9',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgba(103, 232, 249, 0.15)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  '.cm-gutters': {
    backgroundColor: '#1a1a1a',
    color: '#6b6b6b',
    border: 'none',
    borderRight: '1px solid #2e2e2e',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: '#a0a0a0',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#2e2e2e',
    border: 'none',
    color: '#a0a0a0',
  },
  '.cm-tooltip': {
    backgroundColor: '#212121',
    border: '1px solid #2e2e2e',
    borderRadius: '6px',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li': {
      padding: '4px 8px',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: 'rgba(103, 232, 249, 0.1)',
      color: '#ececec',
    },
  },
  '.cm-searchMatch': {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    outline: '1px solid rgba(251, 191, 36, 0.4)',
  },
  '.cm-searchMatch-selected': {
    backgroundColor: 'rgba(103, 232, 249, 0.4)',
    outline: '1px solid rgba(103, 232, 249, 0.6)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(103, 232, 249, 0.2)',
    outline: '1px solid rgba(103, 232, 249, 0.4)',
    color: '#67e8f9',
  },
}, { dark: true });

function getLanguageExtension(language) {
  switch (language) {
    case 'javascript': return javascript({ jsx: true, typescript: true });
    case 'python': return python();
    case 'html': return html();
    case 'css': return css();
    case 'json': return json();
    case 'markdown': return markdown();
    case 'java': return java();
    case 'cpp': return cpp();
    default: return [];
  }
}

// ─── Code formatter (Cmd+Shift+F) ───
// Formats selected text or entire document using proper indentation
function formatCode(view) {
  const { state } = view;
  const selection = state.selection.main;
  const hasSelection = selection.from !== selection.to;
  const textToFormat = hasSelection
    ? state.sliceDoc(selection.from, selection.to)
    : state.doc.toString();

  let formatted;
  try {
    // Try JSON parse + stringify first
    const parsed = JSON.parse(textToFormat);
    formatted = JSON.stringify(parsed, null, 2);
  } catch {
    // Proper indentation-based formatting
    const lines = textToFormat.split('\n');
    const indentStr = '  '; // 2 spaces
    let indentLevel = 0;
    const result = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Skip empty lines but keep one blank line between blocks
      if (line === '') {
        if (result.length > 0 && result[result.length - 1] !== '') {
          result.push('');
        }
        continue;
      }

      // Decrease indent for closing braces/brackets/parens at line start
      const closingStart = /^[}\])]/.test(line);
      if (closingStart && indentLevel > 0) {
        indentLevel--;
      }

      // Add indented line
      result.push(indentStr.repeat(indentLevel) + line);

      // Count opening and closing braces to adjust indent for next line
      // Ignore braces inside strings and comments
      let inString = false;
      let stringChar = '';
      let escaped = false;
      let opens = 0;
      let closes = 0;
      for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }
        if (inString) {
          if (ch === stringChar) inString = false;
          continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
          inString = true;
          stringChar = ch;
          continue;
        }
        // Skip rest of line for single-line comments
        if (ch === '/' && j + 1 < line.length && (line[j + 1] === '/' || line[j + 1] === '*')) break;
        if (ch === '{' || ch === '[' || ch === '(') opens++;
        if (ch === '}' || ch === ']' || ch === ')') closes++;
      }

      // Adjust for the *next* line: net openers minus closers
      // But we already decremented for closingStart above, so only count
      // net effect after the start character
      const netOpen = opens - closes + (closingStart ? 1 : 0);
      if (netOpen > 0) {
        indentLevel += netOpen;
      } else if (netOpen < 0 && !closingStart) {
        indentLevel = Math.max(0, indentLevel + netOpen);
      }
    }

    // Remove trailing empty line
    while (result.length > 0 && result[result.length - 1] === '') {
      result.pop();
    }

    formatted = result.join('\n');
  }

  if (formatted !== textToFormat) {
    if (hasSelection) {
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: formatted },
        selection: { anchor: selection.from, head: selection.from + formatted.length },
      });
    } else {
      view.dispatch({
        changes: { from: 0, to: state.doc.length, insert: formatted },
      });
    }
    return true;
  }
  return false;
}

// ─── Bold text wrapper (Cmd+B) ───
function toggleBold(view) {
  const { state } = view;
  const selection = state.selection.main;
  if (selection.from === selection.to) return false; // no selection

  const selectedText = state.sliceDoc(selection.from, selection.to);

  // Check if already bold (wrapped in ** or __)
  let newText;
  if ((selectedText.startsWith('**') && selectedText.endsWith('**')) ||
      (selectedText.startsWith('__') && selectedText.endsWith('__'))) {
    // Remove bold
    newText = selectedText.slice(2, -2);
  } else {
    // Add bold
    newText = `**${selectedText}**`;
  }

  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert: newText },
    selection: {
      anchor: selection.from,
      head: selection.from + newText.length,
    },
  });
  return true;
}

const Editor = forwardRef(function Editor({ tab, lineNumbers, wordWrap, onContentChange, onCursorChange, onKeystroke, showToast }, ref) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const debounceRef = useRef(null);

  // Expose undo/redo and view to parent
  useImperativeHandle(ref, () => ({
    get view() { return viewRef.current; },
    undo: () => viewRef.current && undo(viewRef.current),
    redo: () => viewRef.current && redo(viewRef.current),
  }));

  // Create editor
  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      noteForgeTheme,
      syntaxHighlighting(noteForgeHighlightStyle),
      history(),
      drawSelection(),
      highlightSpecialChars(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightSelectionMatches(),
      foldGutter(),
      indentOnInput(),
      indentUnit.of('  '),
      // ─── Custom keybindings ───
      keymap.of([
        // Tab → indent, Shift+Tab → outdent
        { key: 'Tab', run: indentMore, shift: indentLess },
        // Cmd+Shift+F → format code
        {
          key: 'Mod-Shift-f',
          run: (view) => {
            const result = formatCode(view);
            if (result && showToast) showToast('Code formatted');
            return true;
          }
        },
        // Cmd+B → toggle bold
        {
          key: 'Mod-b',
          run: (view) => {
            toggleBold(view);
            return true;
          }
        },
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const content = update.state.doc.toString();
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            onContentChange(content);
          }, 800);
          // Count inserted characters for WPM tracking
          if (onKeystroke) {
            update.changes.iterChanges((_fromA, _toA, _fromB, _toB, inserted) => {
              const len = inserted.length;
              for (let i = 0; i < len; i++) onKeystroke();
            });
          }
        }
        if (update.selectionSet || update.docChanged) {
          const cursor = update.state.selection.main.head;
          const line = update.state.doc.lineAt(cursor);
          onCursorChange(line.number, cursor - line.from + 1);
        }
      }),
    ];

    // Line numbers
    if (lineNumbers) {
      extensions.push(lineNumbersExt());
    }

    // Word wrap
    if (wordWrap) {
      extensions.push(EditorView.lineWrapping);
    }

    // Language
    const langExt = getLanguageExtension(tab.language);
    if (langExt) {
      if (Array.isArray(langExt)) {
        extensions.push(...langExt);
      } else {
        extensions.push(langExt);
      }
    }

    const state = EditorState.create({
      doc: tab.content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // Restore cursor position
    if (tab.cursorLine && tab.cursorCol) {
      try {
        const line = view.state.doc.line(Math.min(tab.cursorLine, view.state.doc.lines));
        const pos = Math.min(line.from + tab.cursorCol - 1, line.to);
        view.dispatch({
          selection: { anchor: pos, head: pos },
          scrollIntoView: true,
        });
      } catch { /* ignore */ }
    }

    // Focus editor
    view.focus();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        // Immediate save on cleanup
        const content = view.state.doc.toString();
        onContentChange(content);
      }
      view.destroy();
      viewRef.current = null;
    };
  }, [tab.id, tab.language, lineNumbers, wordWrap]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
});

export default Editor;
