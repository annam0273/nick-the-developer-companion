import React, { useState, useRef } from 'react';
import './Character.css';
import { useBlink, useSleep, useMouseTracking } from './character-animation';
import FoxMenu from '../../../app/components/FoxMenu';
import ForagerPanel from '../../../features/forager/ForagerPanel';
import ScoutPanel from '../../../features/scout/ScoutPanel';
import CompressorPanel from '../../../features/compressor/CompressorPanel';
import TypographerPanel from '../../../features/typographer/TypographerPanel';
import XRayTooltip from '../../../features/typographer/XRayTooltip';
import ScribePanel from '../../../features/scribe/ScribePanel';
import SketcherPanel from '../../../features/sketcher/SketcherPanel';
import { useVoiceCommand } from '../../../features/voice/useVoiceCommand';
import { useCompanionship } from './useCompanionship';

const SpeechCloud = ({ className = '', onClick, children }) => (
  <div className={`mochi-comic-cloud-wrapper ${className}`} onClick={onClick}>
    <div className="mochi-comic-cloud-base">
      <div className="mochi-cloud-bump bump1" />
      <div className="mochi-cloud-bump bump2" />
      <div className="mochi-cloud-bump bump3" />
      <div className="mochi-cloud-bump bump4" />
      <div className="mochi-cloud-bump bump5" />
      <div className="mochi-cloud-bump bump6" />
      <div className="mochi-speech-content">{children}</div>
    </div>
    <div className="mochi-cloud-tail1" />
    <div className="mochi-cloud-tail2" />
  </div>
);

export default function Character({ movementState }) {
  const containerRef = useRef(null);
  const isBlinking = useBlink();
  const isSystemSleeping = useSleep();
  const [isSleeping, setIsSleeping] = useState(false);
  const sleepTimerRef = useRef(null);
  const movementStateRef = useRef(movementState);
  React.useEffect(() => {
    movementStateRef.current = movementState;
  }, [movementState]);

  const isSystemSleepingRef = useRef(isSystemSleeping);

  React.useEffect(() => {
    isSystemSleepingRef.current = isSystemSleeping;
    if (isSystemSleeping && !isListeningRef.current) {
      if (movementStateRef.current.mode === 'peeking') {
        movementStateRef.current.triggerTaskMode(() => {
          if (isSystemSleepingRef.current) {
            sleepTimerRef.current = setTimeout(() => {
              setIsSleeping(true);
            }, 500); // Wait 0.5s after animation finishes before Zzz
          }
        });
      } else {
        setIsSleeping(true);
      }
    } else {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      setIsSleeping(false);
    }
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, [isSystemSleeping]);
  const { companionMessage, companionMood } = useCompanionship();
  const [isHovered, setIsHovered] = useState(false);
  const [isHappy] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState(null);


  const [activeFeature, setActiveFeature] = useState(null);
  const [activeFeaturePayload, setActiveFeaturePayload] = useState(null);

  const [isWireframerActive, setIsWireframerActive] = useState(false);
  const [isXRayActive, setIsXRayActive] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  React.useEffect(() => {
    document.designMode = isEditMode ? 'on' : 'off';
  }, [isEditMode]);

  const [isScribeOpen, setIsScribeOpen] = useState(false);

  const handleMenuAction = async (action, payload = null) => {
    setActiveFeaturePayload(payload);

    if (action === 'FORAGER') {
      setActiveFeature('FORAGER');
    } else if (action === 'SCOUT') {
      setActiveFeature('SCOUT');
    } else if (action === 'TYPOGRAPHER') {
      setActiveFeature('TYPOGRAPHER');
    } else if (action === 'COMPRESSOR') {
      setActiveFeature('COMPRESSOR');
    } else if (action === 'SCRIBE') {
      setIsScribeOpen(true);
    } else if (action === 'SKETCHER') {
      setIsTakingScreenshot(true);
    } else if (action === 'CLOSE') {
      setActiveFeature(null);
      setIsScribeOpen(false);
      setIsMenuOpen(false);
    } else if (action === 'TOGGLE_SLEEP') {
      setActiveFeature(null);
      setIsScribeOpen(false);
      setIsMenuOpen(false);
      setIsSleeping(prev => !prev);
    }
  };

  const { isListening, transcript, error, startListening, stopListening } = useVoiceCommand(handleMenuAction);
  const isListeningRef = useRef(isListening);
  
  React.useEffect(() => {
    isListeningRef.current = isListening;
    if (isListening) {
      // If peeking, return to comfortable position immediately
      if (movementStateRef.current.mode === 'peeking') {
        movementStateRef.current.triggerTaskMode();
      }
      // Wake up
      setIsSleeping(false);
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    }
  }, [isListening]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.code === 'KeyV' || e.key === 'v')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) return;

        if (!isListeningRef.current) {
          startListening();
        }
      }
      
      // Shortcut to call character back to den
      if (e.altKey && (e.code === 'KeyB' || e.key === 'b' || e.code === 'KeyC' || e.key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        if (movementStateRef.current.mode === 'peeking') {
          movementStateRef.current.triggerTaskMode();
        }
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'KeyV' || e.key === 'v') {
        if (isListeningRef.current) {
          stopListening();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startListening, stopListening]);



  // Global Wireframer effect
  React.useEffect(() => {
    let styleEl = document.getElementById('mochi-wireframer-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'mochi-wireframer-styles';
      document.head.appendChild(styleEl);
    }

    let css = `
      .mochi-monkey-testing {
        outline: 2px dashed #E07A3F !important;
        position: relative;
      }
      .mochi-monkey-tested {
        outline: 2px dashed #698B43 !important;
        position: relative;
      }
      .mochi-monkey-tested::after {
        content: '✓';
        position: absolute;
        top: -10px;
        right: -10px;
        background: #698B43;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      }
      .mochi-monkey-tick {
        position: absolute;
        background: #698B43;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        pointer-events: none;
      }
    `;

    if (isWireframerActive) {
      css += `
        *:not(#focus-companion-root):not(#focus-companion-root *) {
          outline: 1px solid #FF00FF !important;
          box-shadow: inset 0 0 0 1px #00FFFF !important;
        }
      `;
    }

    styleEl.textContent = css;

    return () => {
      // Don't remove the style element because we need it for mochi-monkey-tested which persists
    }
  }, [isWireframerActive]);


  const { rotation, facingRight, isDragging, mode, transitionDuration, triggerTaskMode, triggerPeekingMode } = movementState;

  const pupilOffset = useMouseTracking(containerRef, isSleeping, facingRight, rotation);

  // --- FOX IDLE PEEKING LOGIC ---
  const foxIdleTimerRef = useRef(null);

  const resetFoxIdle = React.useCallback(() => {
    if (foxIdleTimerRef.current) clearTimeout(foxIdleTimerRef.current);
    
    // Only allow peeking if no features are active, no menu is open, and not sleeping or listening
    if (activeFeature || isScribeOpen || isMenuOpen || isSleeping || isListening) {
      if (mode === 'peeking') {
        triggerTaskMode();
      }
      return; 
    }

    if (mode === 'task') {
      foxIdleTimerRef.current = setTimeout(() => {
        triggerPeekingMode();
      }, 15000); // 15 seconds of no features used = start peeking
    }
  }, [activeFeature, isScribeOpen, isMenuOpen, isSleeping, isListening, mode, triggerPeekingMode, triggerTaskMode]);

  React.useEffect(() => {
    resetFoxIdle();
    return () => { if (foxIdleTimerRef.current) clearTimeout(foxIdleTimerRef.current); }
  }, [resetFoxIdle]);



  React.useEffect(() => {
    const handleGlobalClick = (e) => {
      // Ignore clicks that happen inside our portals
      if (e.target.closest('.mochi-sketcher-overlay')) {
        return;
      }

      // If clicking outside the companion container, close active panels
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsMenuOpen(false);
        setActiveFeature(null);
      }
    };

    window.addEventListener('pointerdown', handleGlobalClick);
    return () => window.removeEventListener('pointerdown', handleGlobalClick);
  }, []);

  const handleClick = () => {
    if (isDragging) return;
    if (mode === 'peeking') {
      triggerTaskMode();
      return;
    }
    if (isSleeping) return;

    if (activeFeature) {
      setActiveFeature(null);
    } else {
      setIsMenuOpen(prev => !prev);
    }
  };



  React.useEffect(() => {
    // Clean up if component unmounts
    return () => {
      // document.designMode = 'off';
    };
  }, []);

  React.useEffect(() => {
    if (isTakingScreenshot) {
      // Wait a tiny bit for the UI to hide before taking the screenshot
      requestAnimationFrame(() => {
        setTimeout(() => {
          chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' }, (response) => {
            if (chrome.runtime.lastError) {
              alert('Error capturing screenshot: ' + chrome.runtime.lastError.message);
            } else if (response && response.dataUrl) {
              setScreenshotDataUrl(response.dataUrl);
              setActiveFeature('SKETCHER');
            } else if (response && response.error) {
              alert('Error from background: ' + response.error);
            } else {
              alert('Screenshot capture failed: No dataUrl returned');
            }
            setIsTakingScreenshot(false);
          });
        }, 50);
      });
    }
  }, [isTakingScreenshot]);



  const isDesignerActive = activeFeature === 'TYPOGRAPHER' || isEditMode || isWireframerActive || isXRayActive;

  let stateClass = '';
  if (isDragging) {
    stateClass = 'mochi-dragging';
  } else if (activeFeature === 'FORAGER') {
    stateClass = 'mochi-sniffing';
  } else if (activeFeature === 'SCOUT') {
    stateClass = 'mochi-scouting';
  } else if (activeFeature === 'SKETCHER') {
    stateClass = 'mochi-sketching';
  } else if (activeFeature === 'TYPOGRAPHER') {
    stateClass = 'mochi-typographing';
  } else if (activeFeature === 'COMPRESSOR') {
    stateClass = 'mochi-compressing';
  } else if (isScribeOpen) {
    stateClass = 'mochi-scribing';
  } else if (isSleeping) {
    stateClass = 'mochi-sleeping';
  } else if (isHappy || companionMood === 'happy') {
    stateClass = 'mochi-happy';
  } else if (isHovered) {
    stateClass = 'mochi-curious';
  }

  return (
    <div
      className="mochi-companion-container"
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        opacity: isTakingScreenshot ? 0 : 1,
        pointerEvents: isTakingScreenshot ? 'none' : 'auto'
      }}
    >
      {companionMessage && !isListening && !error && <SpeechCloud className="mochi-companion-bubble">{companionMessage}</SpeechCloud>}
      {isHappy && !companionMessage && !isListening && !error && <SpeechCloud>Hi!</SpeechCloud>}
      {isSleeping && !companionMessage && !isListening && !error && <SpeechCloud className="mochi-sleep-bubble">Zzz...</SpeechCloud>}
      {error && <SpeechCloud className="mochi-error-bubble">{error}</SpeechCloud>}
      {isListening && (
        <SpeechCloud className="mochi-listening-bubble" onClick={(e) => { e.stopPropagation(); stopListening(); }}>
          <span className="mochi-mic-icon">🎙️</span> {transcript || "Listening..."}
        </SpeechCloud>
      )}

      {isMenuOpen && !activeFeature && (
        <FoxMenu
          onClose={(e) => { e?.stopPropagation(); setIsMenuOpen(false); }}
          onAction={handleMenuAction}
        />
      )}

      {activeFeature === 'FORAGER' && (
        <ForagerPanel initialTab={activeFeaturePayload} onClose={(e) => { e?.stopPropagation(); setActiveFeature(null); }} />
      )}

      {activeFeature === 'SCOUT' && (
        <ScoutPanel onClose={(e) => { e?.stopPropagation(); setActiveFeature(null); }} />
      )}

      {activeFeature === 'TYPOGRAPHER' && (
        <TypographerPanel
          initialTab={activeFeaturePayload}
          onClose={(e) => { e?.stopPropagation(); setActiveFeature(null); }}
          isWireframerActive={isWireframerActive}
          setIsWireframerActive={setIsWireframerActive}
          isXRayActive={isXRayActive}
          setIsXRayActive={setIsXRayActive}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
        />
      )}

      {(activeFeature === 'COMPRESSOR' || activeFeature === 'compressor') && (
        <CompressorPanel onClose={(e) => { e?.stopPropagation(); setActiveFeature(null); }} />
      )}

      {isScribeOpen && (
        <ScribePanel onClose={() => setIsScribeOpen(false)} />
      )}

      {activeFeature === 'SKETCHER' && screenshotDataUrl && (
        <SketcherPanel
          imageUrl={screenshotDataUrl}
          onClose={(e) => { e?.stopPropagation(); setActiveFeature(null); setScreenshotDataUrl(null); }}
        />
      )}

      {/* X-RAY FLOATING TOOLTIP */}
      <XRayTooltip isActive={isXRayActive} />

      {/* DESIGNER ACTIVE CLOUD BUTTON */}
      {(isEditMode || isWireframerActive || isXRayActive) && (
        <div 
          className="mochi-designer-cloud-button"
          onClick={(e) => {
            e.stopPropagation();
            if (isEditMode) setIsEditMode(false);
            if (isWireframerActive) setIsWireframerActive(false);
            if (isXRayActive) setIsXRayActive(false);
          }}
        >
          <div className="mochi-cloud-bump bump1" />
          <div className="mochi-cloud-bump bump2" />
          <div className="mochi-cloud-bump bump3" />
          <div className="mochi-cloud-bump bump4" />
          <span className="mochi-cloud-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isEditMode ? (
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            ) : isWireframerActive ? (
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
                <line x1="12" y1="2" x2="12" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
              </svg>
            )}
            <span>Disable {isEditMode ? 'Illusionist' : isWireframerActive ? 'Wireframer' : 'X-Ray'}</span>
          </span>
          <div className="mochi-cloud-tail1" />
          <div className="mochi-cloud-tail2" />
        </div>
      )}

      <div
        className="mochi-flipper"
        style={{
          transform: `scaleX(${facingRight ? -1 : 1}) rotate(${rotation}deg) translateY(${isMenuOpen ? '-35px' : '0px'})`,
          transition: (transitionDuration > 0 || isMenuOpen) && !isDragging
            ? 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            : 'none',
          position: 'relative',
          zIndex: 1
        }}
      >
        <svg
          className={`mochi-svg ${stateClass}`}
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="tail" style={{ transformOrigin: '35px 75px' }}>
            <path
              d="M 35 75 C 10 75, 5 35, 20 30 C 40 25, 50 60, 35 75 Z"
              fill="#E07A3F"
            />
            {/* White tip */}
            <path d="M 18 42 C 25 32, 32 37, 28 47 C 20 47, 12 47, 18 42 Z" fill="#FFF3E3" />
          </g>

          <g id="body">
            <path
              d="M 35 50 Q 30 70 32 85 L 58 85 Q 60 70 55 50 Z"
              fill="#E07A3F"
            />
            <path
              d="M 38 50 Q 35 70 40 85 L 50 85 Q 55 70 52 50 Z"
              fill="#FFF3E3"
            />
          </g>

          <g id="paws">
            <ellipse id="paw-left" cx="35" cy="85" rx="6" ry="4" fill="#3C2B25" />
            <ellipse id="paw-right" cx="55" cy="85" rx="6" ry="4" fill="#3C2B25" />
          </g>

          <g id="bandana" style={{ display: (activeFeature === 'SCOUT' || isDesignerActive || activeFeature === 'SKETCHER' || activeFeature === 'COMPRESSOR' || isScribeOpen) ? 'none' : 'block' }}>
            <path d="M 30 48 L 45 62 L 60 48 Z" fill="#698B43" />
          </g>

          {activeFeature === 'SCOUT' && (
            <g id="scout-outfit">
              {/* Trench coat collar/base */}
              <path d="M 28 48 L 45 66 L 62 48 Z" fill="#8C7A6B" />
              {/* White Shirt Collar */}
              <path d="M 35 48 L 45 56 L 55 48 Z" fill="#FFFFFF" />
              {/* Little red tie */}
              <path d="M 43 51 L 47 51 L 45 64 Z" fill="#C0392B" />
            </g>
          )}

          {isDesignerActive && (
            <g id="designer-outfit">
              {/* Black turtleneck */}
              <path d="M 28 48 L 45 64 L 62 48 Z" fill="#2C3E50" />
              {/* Higher neck part */}
              <path d="M 35 45 L 45 52 L 55 45 Z" fill="#34495E" />
            </g>
          )}

          {activeFeature === 'SKETCHER' && (
            <g id="sketcher-outfit">
              {/* Waist Tie Straps */}
              <path d="M 31 65 L 34 65" fill="none" stroke="#E67E22" strokeWidth="2.5" />
              <path d="M 56 65 L 59 65" fill="none" stroke="#E67E22" strokeWidth="2.5" />

              {/* Apron Neck Loop */}
              <path d="M 39 49 Q 45 56 51 49" fill="none" stroke="#E67E22" strokeWidth="2.5" />
              <circle cx="39" cy="51" r="1.5" fill="#D35400" /> {/* Left Button */}
              <circle cx="51" cy="51" r="1.5" fill="#D35400" /> {/* Right Button */}
              
              {/* Apron Body */}
              <path d="M 38 52 L 52 52 C 54 58, 56 60, 56 65 L 54 82 C 45 84, 45 84, 36 82 L 34 65 C 34 60, 36 58, 38 52 Z" fill="#2980B9" />
              
              {/* White Stitching around Body */}
              <path d="M 39 53 L 51 53 C 53 59, 55 61, 55 65 L 53 81 C 45 83, 45 83, 37 81 L 35 65 C 35 61, 37 59, 39 53 Z" fill="none" stroke="#AED6F1" strokeWidth="0.8" strokeDasharray="1.5, 1.5" />
              
              {/* Apron Pocket */}
              <path d="M 38 66 L 52 66 L 51 74 C 45 77, 45 77, 39 74 Z" fill="#2471A3" />
              {/* White Stitching around Pocket */}
              <path d="M 39 67 L 51 67 L 50 73 C 45 76, 45 76, 40 73 Z" fill="none" stroke="#AED6F1" strokeWidth="0.8" strokeDasharray="1.5, 1.5" />

              {/* Paint splatters */}
              <path d="M 36 60 Q 38 62 37 65 Q 35 63 36 60 Z" fill="#F1C40F" />
              <circle cx="51" cy="58" r="2.5" fill="#E74C3C" />
              <circle cx="49" cy="55" r="1" fill="#E74C3C" />
              
              <circle cx="42" cy="78" r="3" fill="#2ECC71" />
              <circle cx="46" cy="80" r="1.5" fill="#2ECC71" />

              <path d="M 52 75 Q 54 78 51 79 Q 50 76 52 75 Z" fill="#9B59B6" />
              <circle cx="54" cy="72" r="1.5" fill="#9B59B6" />
            </g>
          )}

          {activeFeature === 'COMPRESSOR' && (
            <g id="compressor-outfit">
              {/* Base Vest (Neon Orange) */}
              <path d="M 28 48 L 45 66 L 62 48 Z" fill="#E67E22" />
              {/* Open front showing fur */}
              <path d="M 38 48 L 45 58 L 52 48 Z" fill="#E07A3F" />
              <path d="M 40 50 L 45 60 L 50 50 Z" fill="#FFF3E3" />
              {/* Reflective Stripes */}
              <path d="M 32 50 L 38 60 L 45 65 L 52 60 L 58 50" fill="none" stroke="#BDC3C7" strokeWidth="3.5" />
            </g>
          )}

          {isScribeOpen && (
            <g id="scribe-outfit">
              {/* Brown Waistcoat */}
              <path d="M 28 48 L 45 66 L 62 48 Z" fill="#8B4513" />
              {/* Open front showing white shirt */}
              <path d="M 35 48 L 45 62 L 55 48 Z" fill="#FFFFFF" />
              {/* Red Bowtie */}
              <path d="M 40 52 L 50 52 L 45 56 Z" fill="#C0392B" />
              <path d="M 40 56 L 50 56 L 45 52 Z" fill="#C0392B" />
              <circle cx="45" cy="54" r="1.5" fill="#922B21" />
            </g>
          )}

          <g id="head" style={{ transformOrigin: '45px 35px' }}>
            <g id="ears">
              <g id="ear-left" style={{ transformOrigin: '25px 25px' }}>
                <path d="M 20 25 Q 15 10 18 2 Q 28 5 35 17 Z" fill="#E07A3F" />
                <path d="M 18 2 Q 22 5 24 10 L 19 12 Q 17 8 18 2 Z" fill="#3C2B25" />
                <path d="M 23 23 Q 19 12 20 6 Q 26 10 31 18 Z" fill="#FFF3E3" />
              </g>

              <g id="ear-right" style={{ transformOrigin: '65px 25px' }}>
                <path d="M 70 25 Q 75 10 72 2 Q 62 5 55 17 Z" fill="#E07A3F" />
                <path d="M 72 2 Q 68 5 66 10 L 71 12 Q 73 8 72 2 Z" fill="#3C2B25" />
                <path d="M 67 23 Q 71 12 70 6 Q 64 10 59 18 Z" fill="#FFF3E3" />
              </g>
            </g>

            {/* Fox diamond-shaped head base */}
            <path
              d="M 45 15 C 20 15, 15 35, 20 45 C 25 55, 35 55, 45 55 C 55 55, 65 55, 70 45 C 75 35, 70 15, 45 15 Z"
              fill="#E07A3F"
            />

            {/* Cheek tufts & lower face */}
            <path
              d="M 20 45 Q 15 50 25 48 Q 20 52 28 50 Q 35 55 45 55 Q 55 55 62 50 Q 70 52 65 48 Q 75 50 70 45 Z"
              fill="#FFF3E3"
            />

            <g id="eyes-group">
              {isSleeping ? (
                <g id="eyes-sleeping">
                  <path d="M 30 33 Q 35 36 40 33" fill="none" stroke="#3C2B25" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 50 33 Q 55 36 60 33" fill="none" stroke="#3C2B25" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              ) : (
                <g id="eyes" className={isBlinking && !isHappy ? "mochi-eyes-blink" : ""}>
                  {/* Left Eye */}
                  <ellipse cx="35" cy="32" rx="5" ry="7" fill="#FFF" />
                  <ellipse cx={36 + pupilOffset.x} cy={32 + pupilOffset.y} rx="3" ry="5" fill="#8B4513" />
                  <circle cx={37 + pupilOffset.x} cy={30 + pupilOffset.y} r="1.5" fill="#FFF" />

                  {/* Right Eye */}
                  <ellipse cx="55" cy="32" rx="5" ry="7" fill="#FFF" />
                  <ellipse cx={54 + pupilOffset.x} cy={32 + pupilOffset.y} rx="3" ry="5" fill="#8B4513" />
                  <circle cx={53 + pupilOffset.x} cy={30 + pupilOffset.y} r="1.5" fill="#FFF" />
                </g>
              )}
            </g>

            {activeFeature === 'SCOUT' && (
              <g id="scout-glasses">
                {/* Glasses frame */}
                <circle cx="35" cy="32" r="8" fill="none" stroke="#2C3E50" strokeWidth="2.5" />
                <circle cx="55" cy="32" r="8" fill="none" stroke="#2C3E50" strokeWidth="2.5" />
                {/* Bridge */}
                <path d="M 43 32 L 47 32" fill="none" stroke="#2C3E50" strokeWidth="2.5" />
                {/* Arms */}
                <path d="M 27 32 L 20 28" fill="none" stroke="#2C3E50" strokeWidth="2" />
                <path d="M 63 32 L 70 28" fill="none" stroke="#2C3E50" strokeWidth="2" />
              </g>
            )}

            {isDesignerActive && (
              <g id="designer-glasses">
                {/* Thick rectangular frames */}
                <rect x="25" y="25" width="16" height="12" rx="2" fill="none" stroke="#2C3E50" strokeWidth="3" />
                <rect x="49" y="25" width="16" height="12" rx="2" fill="none" stroke="#2C3E50" strokeWidth="3" />
                {/* Bridge */}
                <path d="M 41 29 L 49 29" fill="none" stroke="#2C3E50" strokeWidth="3" />
                {/* Arms */}
                <path d="M 25 29 L 18 25" fill="none" stroke="#2C3E50" strokeWidth="2" />
                <path d="M 65 29 L 72 25" fill="none" stroke="#2C3E50" strokeWidth="2" />
              </g>
            )}

            {isDesignerActive && (
              <g id="designer-beret">
                {/* Beret puffy top (droops to the right) */}
                <path d="M 31 14 C 25 0, 55 -5, 63 8 C 65 12, 63 16, 59 14 C 50 12, 40 12, 31 14 Z" fill="#C0392B" />
                {/* Beret Band */}
                <ellipse cx="45" cy="14" rx="14" ry="2.5" fill="#922B21" />
                {/* Stalk (Cabillou) */}
                <line x1="46" y1="3" x2="48" y2="0" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" />
              </g>
            )}

            {activeFeature === 'COMPRESSOR' && (
              <g id="compressor-hardhat">
                {/* Helmet Dome */}
                <path d="M 32 20 C 32 5, 58 5, 58 20 Z" fill="#F1C40F" />
                {/* Helmet Brim */}
                <ellipse cx="45" cy="20" rx="18" ry="3" fill="#F39C12" />
                {/* Top Ridge */}
                <path d="M 45 8 L 45 18" fill="none" stroke="#F39C12" strokeWidth="2.5" strokeLinecap="round" />
                {/* Side Ridges */}
                <path d="M 38 12 L 36 19" fill="none" stroke="#F39C12" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 52 12 L 54 19" fill="none" stroke="#F39C12" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            )}

            {isScribeOpen && (
              <g id="scribe-accessories">
                {/* Half moon reading glasses resting low */}
                <path d="M 32 37 A 6 6 0 0 0 42 37 Z" fill="rgba(255, 255, 255, 0.4)" stroke="#D4AC0D" strokeWidth="1.5" />
                <path d="M 48 37 A 6 6 0 0 0 58 37 Z" fill="rgba(255, 255, 255, 0.4)" stroke="#D4AC0D" strokeWidth="1.5" />
                <path d="M 42 37 Q 45 35 48 37" fill="none" stroke="#D4AC0D" strokeWidth="1.5" />
                {/* Arms */}
                <line x1="32" y1="37" x2="25" y2="30" stroke="#D4AC0D" strokeWidth="1.5" />
                <line x1="58" y1="37" x2="65" y2="30" stroke="#D4AC0D" strokeWidth="1.5" />
              </g>
            )}

            {/* Snout/Nose */}
            <ellipse cx="45" cy="43" rx="3.5" ry="2.5" fill="#3C2B25" />

            <g id="mouth">
              {isHappy ? (
                <path d="M 40 47 Q 45 53 50 47 Z" fill="#8B4513" />
              ) : (
                <path d="M 42 47 Q 45 49 48 47" fill="none" stroke="#3C2B25" strokeWidth="1.5" />
              )}
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
