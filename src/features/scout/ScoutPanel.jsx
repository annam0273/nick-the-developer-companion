import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScout } from './useScout';
import './ScoutPanel.css';

export default function ScoutPanel({ onClose }) {
  const data = useScout(true);
  const [activeTab, setActiveTab] = useState('preview');
  const [copied, setCopied] = useState('');
  const [isDocked, setIsDocked] = useState(false);

  useEffect(() => {
    try {
      chrome.storage.local.get(['mochiScoutDocked'], (res) => {
        if (res.mochiScoutDocked !== undefined) {
          setIsDocked(res.mochiScoutDocked);
        }
      });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      chrome.storage.local.set({ mochiScoutDocked: isDocked });
    } catch {}
    
    if (isDocked) {
      document.documentElement.style.transition = 'padding-right 0.3s ease';
      document.documentElement.style.paddingRight = '300px';
      document.body.classList.add('scout-docked-active');
    } else {
      document.documentElement.style.paddingRight = '0px';
      document.body.classList.remove('scout-docked-active');
    }

    return () => {
      document.documentElement.style.paddingRight = '0px';
      document.body.classList.remove('scout-docked-active');
    };
  }, [isDocked]);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const getLengthColor = (length, min, max) => {
    if (length === 0) return 'error';
    if (length < min || length > max) return 'warning';
    return 'good';
  };

  const titleStatus = getLengthColor(data.seo?.titleLength || 0, 30, 60);
  const descStatus = getLengthColor(data.seo?.descLength || 0, 120, 160);
  const getScoreColor = (score) => {
    if (score >= 80) return '#698B43'; // Green
    if (score >= 50) return '#E07A3F'; // Orange
    return '#C25A24'; // Red
  };

  const panelContent = (
    <div className={`mochi-scout-panel ${isDocked ? 'docked' : ''}`} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <div className="mochi-scout-header">
        <h3>SEO Scout</h3>
        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <button 
            className="mochi-scout-close" 
            onClick={() => setIsDocked(!isDocked)}
            title={isDocked ? "Float" : "Dock to Sidebar"}
          >
            {isDocked ? (
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M3 9h18"></path></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 3v18"></path></svg>
            )}
          </button>
          <button className="mochi-scout-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div className="mochi-scout-tabs">
        <button
          className={`mochi-scout-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
        <button
          className={`mochi-scout-tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Full Audit
        </button>
      </div>

      <div className="mochi-scout-content">
        {activeTab === 'preview' && (
          <>
            <h4 className="mochi-scout-section-title">Social Card</h4>
            <div className="mochi-social-card">
              <div className="mochi-social-image">
                {data.image ? (
                  <img src={data.image} alt="OG Preview" />
                ) : (
                  <div className="mochi-social-no-image">No Image Found</div>
                )}
              </div>
              <div className="mochi-social-body">
                <div className="mochi-social-site">{data.siteName}</div>
                <p className="mochi-social-title" title={data.title}>{data.title}</p>
                <p className="mochi-social-desc" title={data.description}>{data.description}</p>
              </div>
            </div>

            <h4 className="mochi-scout-section-title">Critical Warnings</h4>
            {data.missingTags && data.missingTags.length > 0 ? (
              <div className="mochi-scout-missing">
                {data.missingTags.map(tag => (
                  <span key={tag} className="mochi-scout-missing-tag">missing: {tag}</span>
                ))}
              </div>
            ) : (
              <div className="mochi-scout-all-good">All crucial tags are present!</div>
            )}
          </>
        )}

        {activeTab === 'audit' && data.seo && (
          <div className="mochi-scout-audit">

            {/* SCORE HEADER */}
            <div className="mochi-scout-score-header">
              <div
                className="mochi-scout-score-circle"
                style={{ borderColor: getScoreColor(data.seo.score), color: getScoreColor(data.seo.score) }}
              >
                {data.seo.score}
              </div>
              <div className="mochi-scout-score-text">
                <span className="mochi-scout-score-title">SEO Score</span>
                <span className="mochi-scout-score-desc">Based on technical & on-page heuristics</span>
              </div>
            </div>

            <h4 className="mochi-scout-section-title">On-Page SEO</h4>
            <div className="mochi-scout-audit-group">
              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Title Tag <span className={`mochi-status-${titleStatus}`}>({data.seo.titleLength} chars)</span></span>
                <div
                  className="mochi-scout-audit-text clickable"
                  onClick={() => copyToClipboard(data.seo.rawTitle, 'title')}
                >
                  {data.seo.rawTitle || <em className="mochi-status-error">Missing Title</em>}
                  {copied === 'title' && <span className="mochi-scout-copied">Copied!</span>}
                </div>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Meta Description <span className={`mochi-status-${descStatus}`}>({data.seo.descLength} chars)</span></span>
                <div
                  className="mochi-scout-audit-text clickable"
                  onClick={() => copyToClipboard(data.seo.rawDesc, 'desc')}
                >
                  {data.seo.rawDesc || <em className="mochi-status-error">Missing Description</em>}
                  {copied === 'desc' && <span className="mochi-scout-copied">Copied!</span>}
                </div>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">H1 Tag</span>
                <span className={`mochi-scout-audit-value ${data.seo.headings.h1 === 1 ? 'mochi-status-good' : 'mochi-status-error'}`}>
                  {data.seo.h1Text}
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Heading Breakdown</span>
                <div className="mochi-scout-headings-grid">
                  <div className="heading-pill">H1: {data.seo.headings.h1}</div>
                  <div className="heading-pill">H2: {data.seo.headings.h2}</div>
                  <div className="heading-pill">H3: {data.seo.headings.h3}</div>
                  <div className="heading-pill">H4: {data.seo.headings.h4}</div>
                  <div className="heading-pill">H5: {data.seo.headings.h5}</div>
                  <div className="heading-pill">H6: {data.seo.headings.h6}</div>
                </div>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Word Count</span>
                <span className={`mochi-scout-audit-value ${data.seo.wordCount > 300 ? 'mochi-status-good' : 'mochi-status-warning'}`}>
                  {data.seo.wordCount} words
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Keyword Density (Top 5)</span>
                <div className="mochi-scout-keywords-container">
                  {data.seo.topKeywords.length > 0 ? (
                    data.seo.topKeywords.map((kw, idx) => (
                      <span key={idx} className="mochi-scout-keyword-pill">
                        {kw.word} <span style={{ opacity: 0.6, marginLeft: '2px' }}>({kw.count})</span>
                      </span>
                    ))
                  ) : (
                    <em className="mochi-status-warning">No text found</em>
                  )}
                </div>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Meta Keywords</span>
                {data.seo.keywords ? (
                  <div className="mochi-scout-keywords-container">
                    {data.seo.keywords.split(',').filter(k => k.trim()).map((kw, idx) => (
                      <span
                        key={idx}
                        className="mochi-scout-keyword-pill clickable"
                        onClick={() => copyToClipboard(kw.trim(), `kw-${idx}`)}
                      >
                        {kw.trim()}
                        {copied === `kw-${idx}` && <span className="mochi-scout-copied">Copied!</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mochi-scout-audit-text">
                    <em className="mochi-status-warning">None specified (Deprecated)</em>
                  </div>
                )}
              </div>
            </div>

            <h4 className="mochi-scout-section-title">Technical SEO</h4>
            <div className="mochi-scout-audit-group">
              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">HTTPS Security</span>
                <span className={`mochi-scout-audit-value ${data.seo.isHttps ? 'mochi-status-good' : 'mochi-status-error'}`}>
                  {data.seo.isHttps ? 'Secure (HTTPS)' : 'Insecure (HTTP)'}
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Schema.org JSON-LD</span>
                <span className={`mochi-scout-audit-value ${data.seo.schemaOrg ? 'mochi-status-good' : 'mochi-status-warning'}`}>
                  {data.seo.schemaOrg ? 'Detected' : 'Missing'}
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Email Privacy</span>
                <span className={`mochi-scout-audit-value ${data.seo.emailsFound === 0 ? 'mochi-status-good' : 'mochi-status-warning'}`}>
                  {data.seo.emailsFound === 0 ? 'No emails exposed' : `${data.seo.emailsFound} emails found in text`}
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">iFrames Used</span>
                <span className={`mochi-scout-audit-value ${!data.seo.hasIframes ? 'mochi-status-good' : 'mochi-status-warning'}`}>
                  {!data.seo.hasIframes ? 'None detected' : 'iFrames present'}
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Inline CSS Styles</span>
                <span className={`mochi-scout-audit-value ${!data.seo.hasInlineCss ? 'mochi-status-good' : 'mochi-status-warning'}`}>
                  {!data.seo.hasInlineCss ? 'Clean' : 'Inline styles found'}
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Canonical URL</span>
                <a
                  href={data.seo.canonical !== 'Missing' ? data.seo.canonical : undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="mochi-scout-audit-value code-style mochi-scout-link"
                  title={data.seo.canonical}
                >
                  {data.seo.canonical}
                </a>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Robots</span>
                <span className="mochi-scout-audit-value code-style">
                  {data.seo.robots}
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Viewport</span>
                <span className="mochi-scout-audit-value code-style">
                  {data.seo.viewport}
                </span>
              </div>
            </div>

            <h4 className="mochi-scout-section-title">Performance</h4>
            <div className="mochi-scout-audit-group">
              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Server Response Time</span>
                <span className="mochi-scout-audit-value code-style">
                  {data.seo.timing.serverRes}
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">DOM Loaded</span>
                <span className="mochi-scout-audit-value code-style">
                  {data.seo.timing.domLoaded}
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Total Load Event</span>
                <span className="mochi-scout-audit-value code-style">
                  {data.seo.loadTime}
                </span>
              </div>
            </div>

            <h4 className="mochi-scout-section-title">Social Tags</h4>
            <div className="mochi-scout-audit-group">
              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Facebook Open Graph</span>
                <span className={`mochi-scout-audit-value ${data.seo.hasOpenGraph ? 'mochi-status-good' : 'mochi-status-error'}`}>
                  {data.seo.hasOpenGraph ? 'Configured' : 'Missing (og:*)'}
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Twitter Cards</span>
                <span className={`mochi-scout-audit-value ${data.seo.hasTwitterCards ? 'mochi-status-good' : 'mochi-status-error'}`}>
                  {data.seo.hasTwitterCards ? 'Configured' : 'Missing (twitter:*)'}
                </span>
              </div>
            </div>

            <h4 className="mochi-scout-section-title">Assets & Links</h4>
            <div className="mochi-scout-audit-group">
              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Image Alt Tags</span>
                <span className={`mochi-scout-audit-value ${data.seo.imagesWithoutAlt === 0 ? 'mochi-status-good' : 'mochi-status-error'}`}>
                  {data.seo.imagesWithoutAlt} of {data.seo.totalImages} missing alt
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Page Links</span>
                <span className="mochi-scout-audit-value">
                  {data.seo.links.total} total ({data.seo.links.internal} internal, {data.seo.links.external} external, {data.seo.links.empty} empty)
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Favicon</span>
                <span className={`mochi-scout-audit-value ${data.seo.favicon ? 'mochi-status-good' : 'mochi-status-error'}`}>
                  {data.seo.favicon ? (
                    <div className="mochi-scout-favicon-row">
                      <img src={data.seo.favicon} alt="Favicon" width="16" height="16" />
                      <a href={data.seo.favicon} target="_blank" rel="noreferrer" className="code-style mochi-scout-link" title={data.seo.favicon}>
                        {data.seo.favicon}
                      </a>
                    </div>
                  ) : 'Missing'}
                </span>
              </div>
            </div>

            <h4 className="mochi-scout-section-title">Privacy & Storage</h4>
            <div className="mochi-scout-audit-group">
              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Client-Visible Cookies</span>
                <span className={`mochi-scout-audit-value ${data.seo.storage.cookies === 0 ? 'mochi-status-good' : 'mochi-status-warning'}`}>
                  {data.seo.storage.cookies} cookies
                </span>
                {data.seo.storage.cookiesList?.length > 0 && (
                  <div className="mochi-scout-keywords-container" style={{ marginTop: '4px' }}>
                    {data.seo.storage.cookiesList.map((c, idx) => (
                      <span key={idx} className="mochi-scout-keyword-pill">{c}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Local Storage Items</span>
                <span className="mochi-scout-audit-value code-style">
                  {data.seo.storage.localStorage} items
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Session Storage Items</span>
                <span className="mochi-scout-audit-value code-style">
                  {data.seo.storage.sessionStorage} items
                </span>
              </div>
            </div>

            <h4 className="mochi-scout-section-title">Accessibility (a11y)</h4>
            <div className="mochi-scout-audit-group">
              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Inputs Missing Labels</span>
                <span className={`mochi-scout-audit-value ${data.seo.a11y.inputsWithoutLabels === 0 ? 'mochi-status-good' : 'mochi-status-error'}`}>
                  {data.seo.a11y.inputsWithoutLabels} inputs
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Buttons Missing Text</span>
                <span className={`mochi-scout-audit-value ${data.seo.a11y.buttonsWithoutText === 0 ? 'mochi-status-good' : 'mochi-status-error'}`}>
                  {data.seo.a11y.buttonsWithoutText} buttons
                </span>
              </div>
            </div>

            <h4 className="mochi-scout-section-title">GEO / Localization</h4>
            <div className="mochi-scout-audit-group">
              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">HTML Language</span>
                <span className="mochi-scout-audit-value code-style">
                  {data.seo.language}
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Geo Region</span>
                <span className="mochi-scout-audit-value code-style">
                  {data.seo.geoRegion}
                </span>
              </div>

              <div className="mochi-scout-audit-item">
                <span className="mochi-scout-audit-label">Geo Placename</span>
                <span className="mochi-scout-audit-value code-style">
                  {data.seo.geoPlacename}
                </span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );

  return createPortal(panelContent, document.body);
}
