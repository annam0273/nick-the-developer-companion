import React, { useState } from 'react';
import { useForager } from './useForager';
import './ForagerPanel.css';

export default function ForagerPanel({ onClose, initialTab }) {
  const { data, isScanning } = useForager(true);
  const [copied, setCopied] = useState('');

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const [activeTab, setActiveTab] = useState(initialTab || 'palette');
  const [selectedAsset, setSelectedAsset] = useState(null);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setSelectedAsset(null);
    }
  }, [initialTab]);

  return (
    <div className="mochi-forager-panel" onClick={(e) => e.stopPropagation()}>
      <div className="mochi-forager-header">
        <h3>The Sniffer</h3>
        <button className="mochi-forager-close" onClick={onClose}>×</button>
      </div>

      <div className="mochi-forager-content">
        {isScanning ? (
          <div className="mochi-forager-scanning">
            <div className="mochi-forager-spinner"></div>
            <p>Sniffing...</p>
          </div>
        ) : (
          <>
            {selectedAsset === null && (
              <div className="mochi-forager-tabs">
                <button 
                  className={`mochi-forager-tab ${activeTab === 'stack' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stack')}
                >
                  Stack
                </button>
                <button 
                  className={`mochi-forager-tab ${activeTab === 'palette' ? 'active' : ''}`}
                  onClick={() => setActiveTab('palette')}
                >
                  Palette
                </button>
                <button 
                  className={`mochi-forager-tab ${activeTab === 'assets' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assets')}
                >
                  Assets
                </button>
              </div>
            )}

            <div className="mochi-forager-tab-content">
              {activeTab === 'stack' && (
                <div className="mochi-forager-section">
                  {data.frameworks.length > 0 ? (
                    <div className="mochi-forager-tags">
                      {data.frameworks.map(fw => (
                        <span key={fw} className="mochi-forager-tag">{fw}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="mochi-forager-empty">No recognized frameworks detected.</p>
                  )}
                </div>
              )}

              {activeTab === 'palette' && (
                <div className="mochi-forager-section">
                  <div className="mochi-forager-grid">
                    {data.colors.map(color => (
                      <div 
                        key={color} 
                        className="mochi-forager-color"
                        style={{ backgroundColor: color }}
                        onClick={() => copyToClipboard(color, color)}
                        title={color}
                      >
                        {copied === color && <span className="mochi-forager-copied">Copied!</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'assets' && (
                <div className="mochi-forager-section">
                  {selectedAsset !== null ? (
                    <div className="mochi-forager-asset-detail">
                      <button className="mochi-forager-back" onClick={() => setSelectedAsset(null)} title="Back to Assets">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                      <div className="mochi-forager-asset-preview" dangerouslySetInnerHTML={{ __html: data.svgs[selectedAsset] }} />
                      <button 
                        className="mochi-forager-copy-btn" 
                        onClick={() => copyToClipboard(data.svgs[selectedAsset], 'detail')}
                      >
                        {copied === 'detail' ? 'Copied!' : 'Copy SVG'}
                      </button>
                    </div>
                  ) : (
                    data.svgs.length > 0 ? (
                      <div className="mochi-forager-svg-grid">
                        {data.svgs.map((svgHtml, idx) => (
                          <div 
                            key={idx} 
                            className="mochi-forager-svg-item"
                            onClick={() => setSelectedAsset(idx)}
                            title="Click to View SVG"
                          >
                            <div dangerouslySetInnerHTML={{ __html: svgHtml }} className="mochi-forager-svg-wrapper" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mochi-forager-empty">No inline SVGs found.</p>
                    )
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
