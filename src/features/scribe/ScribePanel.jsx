import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getNotebooks, saveNotebooks } from '../../core/storage/scribe';
import './ScribePanel.css';

export default function ScribePanel({ onClose }) {
  const [notebooks, setNotebooks] = useState({ global: [] });
  const [activeTab, setActiveTab] = useState('global');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [activeFormats, setActiveFormats] = useState({});
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentDomain = window.location.hostname;

  useEffect(() => {
    try {
      chrome.storage.local.get(['mochiScribeDocked'], (res) => {
        if (res.mochiScribeDocked !== undefined) {
          setIsDocked(res.mochiScribeDocked);
        }
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      chrome.storage.local.set({ mochiScribeDocked: isDocked });
    } catch { /* ignore */ }

    if (isDocked) {
      document.documentElement.style.transition = 'padding-right 0.3s ease';
      document.documentElement.style.paddingRight = '420px'; // sidebar (60) + panel (360)
      document.body.classList.add('scribe-docked-active');
    } else {
      document.documentElement.style.paddingRight = '0px';
      document.body.classList.remove('scribe-docked-active');
    }

    return () => {
      document.documentElement.style.paddingRight = '0px';
      document.body.classList.remove('scribe-docked-active');
    };
  }, [isDocked]);

  useEffect(() => {
    if (isComposing && editorRef.current) {
      if (editorRef.current.innerHTML !== newNoteContent) {
        editorRef.current.innerHTML = newNoteContent;
      }
    }
  }, [isComposing, newNoteContent]);

  // Load saved content and position
  useEffect(() => {
    getNotebooks().then(data => {
      // Migrate old string data to array if necessary
      const loaded = {};
      for (const key in data) {
        if (typeof data[key] === 'string') {
          if (data[key].trim()) {
            loaded[key] = [{ id: Date.now().toString(), content: data[key], timestamp: Date.now() }];
          } else {
            loaded[key] = [];
          }
        } else {
          loaded[key] = data[key] || [];
        }
      }

      if (!loaded.global) loaded.global = [];
      setNotebooks(loaded);

      // Auto-switch to current domain if not empty, or initialize it
      if (currentDomain) {
        setActiveTab(currentDomain);
        setNewNoteTitle('');
        setNewNoteContent('');
        setEditingNoteId(null);
        setIsComposing(false);
        if (!loaded[currentDomain]) {
          setNotebooks(prev => ({ ...prev, [currentDomain]: [] }));
        }
      }
    });
  }, [currentDomain]);

  // Save notebooks on change
  useEffect(() => {
    saveNotebooks(notebooks);
  }, [notebooks]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setNewNoteTitle('');
    setNewNoteContent('');
    setEditingNoteId(null);
    setIsComposing(false);
  };

  const handleAddNote = () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim()) {
      setIsComposing(false);
      return;
    }

    setNotebooks(prev => {
      const currentList = prev[activeTab] || [];

      if (editingNoteId) {
        // Update existing note
        return {
          ...prev,
          [activeTab]: currentList.map(n =>
            n.id === editingNoteId
              ? { ...n, title: newNoteTitle, content: newNoteContent, timestamp: Date.now() }
              : n
          )
        };
      } else {
        // Create new note
        return {
          ...prev,
          [activeTab]: [
            {
              id: Math.random().toString(36).substr(2, 9),
              title: newNoteTitle,
              content: newNoteContent,
              timestamp: Date.now()
            },
            ...currentList
          ]
        };
      }
    });

    setNewNoteTitle('');
    setNewNoteContent('');
    setEditingNoteId(null);
    setIsComposing(false);
  };

  const handleEditNote = (note, domain) => {
    if (activeTab === 'all' && domain) {
      setActiveTab(domain);
    }
    setNewNoteTitle(note.title || '');
    setNewNoteContent(note.content || '');
    setEditingNoteId(note.id);
    setIsComposing(true);
  };

  const updateFormattingState = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      h1: document.queryCommandValue('formatBlock') === 'h1',
      h2: document.queryCommandValue('formatBlock') === 'h2'
    });
  };

  const handleFormat = (command, value = null) => {
    editorRef.current.focus();
    if (command === 'formatBlock') {
      // Browsers often require tag names like <H1> for formatBlock
      document.execCommand(command, false, `<${value}>`);
    } else {
      document.execCommand(command, false, value);
    }
    setNewNoteContent(editorRef.current.innerHTML);
    updateFormattingState();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        editorRef.current.focus();
        document.execCommand('insertImage', false, dataUrl);
        setNewNoteContent(editorRef.current.innerHTML);
      };
      reader.readAsDataURL(file);
    } else {
      // Treat as text
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = event.target.result;
        editorRef.current.focus();
        // Insert as a preformatted block or plain text
        document.execCommand('insertText', false, textContent);
        setNewNoteContent(editorRef.current.innerHTML);
      };
      reader.readAsText(file);
    }

    e.target.value = null;
  };

  const cancelEdit = () => {
    setNewNoteTitle('');
    setNewNoteContent('');
    setEditingNoteId(null);
    setIsComposing(false);
  };

  const handleDeleteNote = (tab, id, e) => {
    e.stopPropagation(); // prevent edit trigger
    setNotebooks(prev => ({
      ...prev,
      [tab]: prev[tab].filter(n => n.id !== id)
    }));
    if (editingNoteId === id) cancelEdit();
  };

  const tabs = Object.keys(notebooks);

  // Compute all notes for the 'all' tab
  const allNotes = [];
  Object.entries(notebooks).forEach(([domain, notes]) => {
    notes.forEach(n => {
      allNotes.push({ ...n, domain });
    });
  });
  allNotes.sort((a, b) => b.timestamp - a.timestamp);

  const activeNotes = activeTab === 'all' ? allNotes : (notebooks[activeTab] || []);

  return createPortal(
    <div
      className={`mochi-scribe-panel-large ${isDocked ? 'docked' : ''}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {!isComposing && (
        <div className="mochi-scribe-header-large">
          <div className="mochi-scribe-title-wrap">
            <span className="mochi-scribe-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </span>
            <h2>The Scribe</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="mochi-scribe-close-large"
              onClick={() => setIsDocked(!isDocked)}
              title={isDocked ? "Float" : "Dock to Sidebar"}
            >
              {isDocked ? (
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M3 9h18"></path></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 3v18"></path></svg>
              )}
            </button>
            <button className="mochi-scribe-close-large" onClick={onClose}>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      )}

      <div className="mochi-scribe-body-large">
        {!isComposing && (
          <div className="mochi-scribe-sidebar-large">
            <div className="mochi-scribe-nav-section">
              <button
                className={`mochi-scribe-nav-item ${activeTab === 'global' ? 'active' : ''}`}
                onClick={() => handleTabChange('global')}
                title="Global Scratchpad"
              >
                <span className="site-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </span>
              </button>
              <button
                className={`mochi-scribe-nav-item ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => handleTabChange('all')}
                title="All Notes"
              >
                <span className="site-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                </span>
              </button>
            </div>

            <div className="mochi-scribe-nav-section">
              <div className="mochi-scribe-sidebar-divider" />
              <div className="mochi-scribe-site-list">
                {currentDomain && !tabs.includes(currentDomain) && (
                  <button
                    className={`mochi-scribe-nav-item site-item ${activeTab === currentDomain ? 'active' : ''}`}
                    onClick={() => handleTabChange(currentDomain)}
                    title={currentDomain}
                  >
                    <img src={`https://www.google.com/s2/favicons?domain=${currentDomain}&sz=32`} className="site-favicon" alt={currentDomain} />
                    <span className="site-badge-tiny current"></span>
                  </button>
                )}

                {tabs.filter(t => t !== 'global').map(tab => {
                  const count = notebooks[tab].length;
                  if (count === 0 && tab !== currentDomain) return null;
                  return (
                    <button
                      key={tab}
                      className={`mochi-scribe-nav-item site-item ${activeTab === tab ? 'active' : ''}`}
                      onClick={() => handleTabChange(tab)}
                      title={`${tab} (${count})`}
                    >
                      <img src={`https://www.google.com/s2/favicons?domain=${tab}&sz=32`} className="site-favicon" alt={tab} />
                      {tab === currentDomain ? (
                        <span className="site-badge-tiny current"></span>
                      ) : (
                        <span className="site-badge-tiny">{count > 9 ? '9+' : count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mochi-scribe-main-large">
          {!isComposing && (
            <div className="mochi-scribe-main-header">
              <h3>
                {activeTab === 'all' ? 'All Notes' :
                  activeTab === 'global' ? 'Global Scratchpad' :
                    activeTab}
              </h3>
              {activeTab !== 'all' && (
                <button className="mochi-scribe-add-small" onClick={() => setIsComposing(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  New
                </button>
              )}
            </div>
          )}

          <div className="mochi-scribe-scroll-area">
            {isComposing && activeTab !== 'all' ? (
              <div className="mochi-scribe-composer-block full-height">
                <input
                  className="mochi-scribe-title-input"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Note Heading..."
                  autoFocus
                />
                <div className="mochi-scribe-rich-toolbar">
                  <button className={activeFormats.bold ? 'active' : ''} onClick={() => handleFormat('bold')} title="Bold"><strong>B</strong></button>
                  <button className={activeFormats.italic ? 'active' : ''} onClick={() => handleFormat('italic')} title="Italic"><em>I</em></button>
                  <button className={activeFormats.underline ? 'active' : ''} onClick={() => handleFormat('underline')} title="Underline"><u>U</u></button>
                  <div className="toolbar-divider" />
                  <button className={activeFormats.h1 ? 'active' : ''} onClick={() => handleFormat('formatBlock', 'H1')} title="Large Heading">H1</button>
                  <button className={activeFormats.h2 ? 'active' : ''} onClick={() => handleFormat('formatBlock', 'H2')} title="Medium Heading">H2</button>
                  <div className="toolbar-divider" />
                  <button onClick={() => handleFormat('hiliteColor', '#FFE066')} title="Highlight" style={{ background: '#FFE066', color: '#3C2B25' }}>A</button>
                  <div className="toolbar-divider" />

                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,.txt,.md,.csv,.js,.jsx,.json" onChange={handleFileUpload} />
                  <button onClick={() => fileInputRef.current.click()} title="Add Attachment" className="add-file-btn">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                </div>
                <div
                  className="mochi-scribe-textarea full-height-textarea rich-editor"
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setNewNoteContent(e.currentTarget.innerHTML)}
                  onKeyUp={updateFormattingState}
                  onMouseUp={updateFormattingState}
                  onClick={(e) => {
                    if (e.target.tagName === 'IMG') {
                      setFullscreenImage(e.target.src);
                    }
                  }}
                  onKeyDown={(e) => {
                    updateFormattingState();
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                  data-placeholder="Jot down your thoughts... (Ctrl+Enter to save)"
                  spellCheck="false"
                />

                {fullscreenImage && (
                  <div className="mochi-scribe-lightbox" onClick={() => setFullscreenImage(null)}>
                    <img src={fullscreenImage} alt="Fullscreen Attachment" />
                    <button className="mochi-scribe-lightbox-close">✕</button>
                  </div>
                )}
                <div className="mochi-scribe-composer-footer">
                  <div className="mochi-scribe-actions">
                    <button className="mochi-scribe-btn secondary" onClick={cancelEdit}>Cancel</button>
                    <button className="mochi-scribe-btn primary" onClick={handleAddNote}>
                      {editingNoteId ? 'Update' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mochi-scribe-notes-grid">
                {activeNotes.length === 0 ? (
                  <div className="mochi-scribe-empty-state">
                    <div className="empty-icon">🍃</div>
                    <p>No notes exist in this space yet.</p>
                  </div>
                ) : (
                  activeNotes.map(note => (
                    <div key={note.id} className="mochi-scribe-card-rich" onClick={() => handleEditNote(note, note.domain)}>
                      <div className="card-rich-header">
                        <h4 className="card-rich-title">
                          {note.title || (note.content ? note.content.replace(/<[^>]*>?/gm, '').substring(0, 30) + '...' : 'Untitled Note')}
                        </h4>
                      </div>
                      <div className="card-rich-footer">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="card-rich-date">
                            {new Date(note.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {activeTab === 'all' && (
                            <>
                              <span style={{ color: '#D4C4B7' }}>•</span>
                              <span className="card-rich-domain">
                                {note.domain === 'global' ? 'Global' : note.domain}
                              </span>
                            </>
                          )}
                        </div>
                        <button className="card-rich-delete" onClick={(e) => handleDeleteNote(note.domain || activeTab, note.id, e)} title="Delete Note">
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
