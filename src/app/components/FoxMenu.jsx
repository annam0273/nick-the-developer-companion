import React, { useState } from 'react';
import './FoxMenu.css';

const IconForager = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconScout = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;
const IconTypographer = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;
const IconCompressor = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IconScribe = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const IconSketcher = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>;

export default function FoxMenu({ onClose, onAction }) {
  const [hoveredLabel, setHoveredLabel] = useState('');

  const handleAction = (actionName) => {
    onAction(actionName);
    onClose();
  };

  return (
    <div className="mochi-fox-menu" onClick={(e) => e.stopPropagation()}>
      <div className="mochi-board-paw paw-left" />
      <div className="mochi-board-paw paw-right" />
      
      <div className="mochi-board-content">
        <div className="mochi-fox-menu-inner">
          <div className="mochi-fox-menu-icons">
            <button onMouseEnter={() => setHoveredLabel('The Sniffer')} onMouseLeave={() => setHoveredLabel('')} onClick={() => handleAction('FORAGER')}><IconForager /></button>
            <button onMouseEnter={() => setHoveredLabel('The Scout')} onMouseLeave={() => setHoveredLabel('')} onClick={() => handleAction('SCOUT')}><IconScout /></button>
            <button onMouseEnter={() => setHoveredLabel('The Designer')} onMouseLeave={() => setHoveredLabel('')} onClick={() => handleAction('TYPOGRAPHER')}><IconTypographer /></button>
            <button onMouseEnter={() => setHoveredLabel('The Sketcher')} onMouseLeave={() => setHoveredLabel('')} onClick={() => handleAction('SKETCHER')}><IconSketcher /></button>
            <button onMouseEnter={() => setHoveredLabel('The Compressor')} onMouseLeave={() => setHoveredLabel('')} onClick={() => handleAction('COMPRESSOR')}><IconCompressor /></button>
            <button onMouseEnter={() => setHoveredLabel('The Scribe')} onMouseLeave={() => setHoveredLabel('')} onClick={() => handleAction('SCRIBE')}><IconScribe /></button>
          </div>
          <div className="mochi-fox-menu-label">
            {hoveredLabel || 'What to do?'}
          </div>
        </div>
      </div>
    </div>
  );
}
