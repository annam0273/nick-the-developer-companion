import React, { useState, useEffect } from 'react';
import { useTypographer } from './useTypographer';
import { useXRay } from './useXRay';
import './TypographerPanel.css';

export default function TypographerPanel({ 
  onClose,
  isWireframerActive,
  setIsWireframerActive,
  isXRayActive,
  setIsXRayActive,
  isEditMode,
  setIsEditMode,
  initialTab
}) {
  const fonts = useTypographer(true);
  const [copied, setCopied] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab || 'typography');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      onClose();
    }
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="mochi-typographer-panel" onClick={(e) => e.stopPropagation()}>
      <div className="mochi-typographer-header">
        <h3>The Designer</h3>
        <button className="mochi-typographer-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="mochi-typographer-content">
        <div className="mochi-designer-tabs">
          <button 
            className={`mochi-forager-tab ${activeTab === 'typography' ? 'active' : ''}`}
            onClick={() => setActiveTab('typography')}
          >
            Typographer
          </button>
          <button 
            className={`mochi-forager-tab ${activeTab === 'illusionist' ? 'active' : ''}`}
            onClick={() => { setActiveTab('illusionist'); setIsXRayActive(false); }}
          >
            Illusionist
          </button>
          <button 
            className={`mochi-forager-tab ${activeTab === 'wireframer' ? 'active' : ''}`}
            onClick={() => { setActiveTab('wireframer'); setIsXRayActive(false); }}
          >
            Wireframe
          </button>
          <button 
            className={`mochi-forager-tab ${activeTab === 'xray' ? 'active' : ''}`}
            onClick={() => { setActiveTab('xray'); }}
          >
            X-Ray
          </button>
        </div>

        {activeTab === 'typography' && (
          fonts.tags.length === 0 ? (
            <div className="mochi-typographer-empty">Scanning for typography...</div>
          ) : (
          <div className="mochi-typographer-list">
            
            {/* EXTERNAL FONTS */}
            {fonts.external.length > 0 && (
              <div className="mochi-typography-external-group">
                <div className="mochi-typography-external-title">Custom Font Families</div>
                <div className="mochi-typography-external-chips">
                  {fonts.external.map((fontName, idx) => (
                    <span 
                      key={idx} 
                      className="mochi-typography-external-chip" 
                      title={fontName}
                      onClick={() => copyToClipboard(fontName, `ext-${idx}`)}
                    >
                      {fontName}
                      {copied === `ext-${idx}` && <span className="mochi-spec-copied">Copied</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* FONT HIERARCHY */}
            <div className="mochi-typography-external-title" style={{ marginTop: '8px' }}>Typography Hierarchy</div>
            {fonts.tags.map((f, idx) => (
              <div key={idx} className="mochi-typography-card">
                <div className="mochi-typography-card-header">
                  <span className="mochi-typography-tag">{f.tag}</span>
                  <span className="mochi-typography-font-name" onClick={() => copyToClipboard(f.fontFamily, `font-${idx}`)}>
                    {f.primaryFont}
                    {copied === `font-${idx}` && <span className="mochi-copied-badge">Copied!</span>}
                  </span>
                </div>
                
                <div 
                  className="mochi-typography-sample" 
                  style={{
                    fontFamily: f.fontFamily,
                    fontWeight: f.fontWeight,
                    fontSize: f.fontSize,
                    lineHeight: f.lineHeight,
                    color: f.color
                  }}
                >
                  {f.sampleText}
                </div>

                <div className="mochi-typography-specs">
                  <div className="mochi-typography-spec" onClick={() => copyToClipboard(f.fontWeight, `weight-${idx}`)}>
                    <span className="mochi-spec-label">Weight</span>
                    <span className="mochi-spec-value">{f.fontWeight}</span>
                    {copied === `weight-${idx}` && <span className="mochi-spec-copied">Copied</span>}
                  </div>
                  <div className="mochi-typography-spec" onClick={() => copyToClipboard(f.fontSize, `size-${idx}`)}>
                    <span className="mochi-spec-label">Size</span>
                    <span className="mochi-spec-value">{f.fontSize}</span>
                    {copied === `size-${idx}` && <span className="mochi-spec-copied">Copied</span>}
                  </div>
                  <div className="mochi-typography-spec" onClick={() => copyToClipboard(f.lineHeight, `line-${idx}`)}>
                    <span className="mochi-spec-label">Line H.</span>
                    <span className="mochi-spec-value">{f.lineHeight}</span>
                    {copied === `line-${idx}` && <span className="mochi-spec-copied">Copied</span>}
                  </div>
                  <div className="mochi-typography-spec" onClick={() => copyToClipboard(f.color, `color-${idx}`)}>
                    <span className="mochi-spec-label">Color</span>
                    <span className="mochi-spec-value">
                      <div className="mochi-spec-color-swatch" style={{backgroundColor: f.color}}></div>
                      {f.color}
                    </span>
                    {copied === `color-${idx}` && <span className="mochi-spec-copied">Copied</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          )
        )}

        {activeTab === 'illusionist' && (
          <div className="mochi-illusionist-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
            <div style={{ color: '#E07A3F' }}>
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#3C2B25' }}>Design Mode</div>
            <p style={{ fontSize: '12px', color: '#8C7A6B', margin: 0 }}>
              Transform the webpage! Click anywhere to edit text directly as if the site belongs to you.
            </p>
            <button 
              onClick={toggleEditMode}
              className="mochi-designer-toggle-btn"
              style={{ background: isEditMode ? '#698B43' : '#E07A3F' }}
            >
              {isEditMode ? 'Design Mode is ON' : 'Turn ON Design Mode'}
            </button>
          </div>
        )}

        {activeTab === 'wireframer' && (
          <div className="mochi-illusionist-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
            <div style={{ color: '#E07A3F' }}>
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#3C2B25' }}>The Wireframer</div>
            <p style={{ fontSize: '12px', color: '#8C7A6B', margin: 0 }}>
              Reveal the invisible structure! Inject a glowing colored outline around every DOM element to easily spot layout shifts and hidden margins.
            </p>
            <button 
              onClick={() => {
                const newVal = !isWireframerActive;
                setIsWireframerActive(newVal);
                if (newVal) onClose();
              }}
              className="mochi-designer-toggle-btn"
              style={{ background: isWireframerActive ? '#698B43' : '#E07A3F' }}
            >
              {isWireframerActive ? 'Wireframer is ON' : 'Turn ON Wireframer'}
            </button>
          </div>
        )}

        {activeTab === 'xray' && (
          <div className="mochi-illusionist-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
            <div style={{ color: '#E07A3F' }}>
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
                <line x1="12" y1="2" x2="12" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
              </svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#3C2B25' }}>The X-Ray</div>
            <p style={{ fontSize: '12px', color: '#8C7A6B', margin: 0 }}>
              Turn your cursor into an inspector probe. Hover over any element to instantly extract its exact dimensions, spacing, typography, and colors.
            </p>
            <button 
              onClick={() => {
                const newVal = !isXRayActive;
                setIsXRayActive(newVal);
                if (newVal) onClose();
              }}
              className="mochi-designer-toggle-btn"
              style={{ background: isXRayActive ? '#698B43' : '#E07A3F' }}
            >
              {isXRayActive ? 'X-Ray is ON' : 'Turn ON X-Ray'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
