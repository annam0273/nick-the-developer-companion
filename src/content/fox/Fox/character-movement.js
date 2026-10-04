import { useState, useEffect, useRef, useCallback } from 'react';
import { browserAPI } from '../../../core/browser';

export function useMovement() {
  const [cornerPos, setCornerPos] = useState({ x: 0, y: 0 }); // Corner position
  const [charOffset, setCharOffset] = useState({ x: 0, y: 0 }); // Fox offset from corner
  const [rotation, setRotation] = useState(0);
  const [facingRight, setFacingRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(0);
  const [mode, setMode] = useState('initial'); // 'initial' | 'peeking' | 'task'

  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, elementX: 0, elementY: 0 });
  const cornerPosRef = useRef(cornerPos);
  cornerPosRef.current = cornerPos;
  const charOffsetRef = useRef(charOffset);
  charOffsetRef.current = charOffset;
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Track the current hide position so we can retreat to it when entering task mode
  const currentHidePosRef = useRef({ x: 170, y: 170 }); 

  // --- DRAGGING LOGIC ---
  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    
    setIsDragging(true);
    setTransitionDuration(0);
    setRotation(0); // Upright when grabbed
    setCharOffset({ x: 0, y: 0 }); // Snap fox back to den if dragging

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      elementX: cornerPosRef.current.x,
      elementY: cornerPosRef.current.y
    };
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      const dx = e.clientX - dragStartRef.current.pointerX;
      const dy = e.clientY - dragStartRef.current.pointerY;
      
      let newX = dragStartRef.current.elementX + dx;
      let newY = dragStartRef.current.elementY + dy;

      const minX = -(window.innerWidth - 180); // width of fox corner
      const maxX = 0;
      const minY = -(window.innerHeight - 180);
      const maxY = 0;

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      setCornerPos({ x: newX, y: newY });
      
      if (Math.abs(dx) > 1) {
        setFacingRight(dx > 0);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      
      if (modeRef.current === 'task') {
        setTransitionDuration(0.5);
        setCharOffset({ x: 0, y: 0 });
        return;
      }

      // If not in task mode, pulling the character puts it back into task mode 
      // or we just switch it to task mode when dropped
      updateMode('task');
      setTransitionDuration(0.5);
      setCharOffset({ x: 0, y: 0 });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const updateMode = useCallback((newMode) => {
    setMode(newMode);
  }, []);

  // --- HIDE AND PEEK LOGIC ---
  useEffect(() => {
    if (isDragging) return; 
    if (mode === 'task') return; // Do nothing autonomous in task mode

    let scheduleTimeout;
    let peekTimeout;
    let retreatTimeout;

    if (mode === 'initial') {
      // Hang out visible at bottom right for 10 seconds, then start peeking
      scheduleTimeout = setTimeout(() => {
        if (isDraggingRef.current) return;
        setTransitionDuration(0.5);
        setCharOffset({ x: 0, y: 170 }); // slide down into the den/offscreen
        setTimeout(() => updateMode('peeking'), 500);
      }, 10000);
      return () => clearTimeout(scheduleTimeout);
    }

    const scheduleNextPeek = (instant = false) => {
      const timeHidden = instant ? 100 : Math.random() * 6000 + 4000; // Wait 4-10 seconds while hidden
      
      scheduleTimeout = setTimeout(() => {
        if (isDraggingRef.current || modeRef.current !== 'peeking') return;
        if (document.hidden) {
          // If the tab is not visible, try again in a bit to avoid weird CSS slide catch-ups
          scheduleNextPeek();
          return;
        }

        const edges = ['bottom', 'top', 'left', 'right'];
        const edge = edges[Math.floor(Math.random() * edges.length)];
        
        let absHideX = 0, absHideY = 0;
        let absPeekX = 0, absPeekY = 0;
        let rot = 0;
        let faceRight = false;

        const rangeX = -(window.innerWidth - 160);
        const rangeY = -(window.innerHeight - 160);
        const PEEK_AMT = 75; // 75px ensures the eyes and full head are visible

        // mochi-fox-corner has padding-right:10px and padding-bottom:10px, so total size is 160x160.
        // It is anchored at right: 0, bottom: 0.
        if (edge === 'bottom') {
          absHideY = 170; // 10px below screen (160 + 10)
          absPeekY = 160 - PEEK_AMT;  // Only PEEK_AMT visible
          absHideX = absPeekX = Math.random() * rangeX;
          rot = 0;
          faceRight = Math.random() > 0.5;
        } else if (edge === 'top') {
          absHideY = -(window.innerHeight) - 10; // 10px above screen
          absPeekY = -(window.innerHeight) + PEEK_AMT; // PEEK_AMT visible
          absHideX = absPeekX = Math.random() * rangeX;
          rot = 180;
          faceRight = Math.random() > 0.5;
        } else if (edge === 'left') {
          absHideX = -(window.innerWidth) - 10; // 10px left of screen
          absPeekX = -(window.innerWidth) + PEEK_AMT; // PEEK_AMT visible
          absHideY = absPeekY = Math.random() * rangeY;
          rot = 90; // Feet point left
        } else if (edge === 'right') {
          absHideX = 170; // 10px right of screen (160 + 10)
          absPeekX = 160 - PEEK_AMT;  // Only PEEK_AMT visible
          absHideY = absPeekY = Math.random() * rangeY;
          rot = -90; // Feet point right
        }

        const hideOffset = { 
          x: absHideX - cornerPosRef.current.x, 
          y: absHideY - cornerPosRef.current.y 
        };
        const peekOffset = { 
          x: absPeekX - cornerPosRef.current.x, 
          y: absPeekY - cornerPosRef.current.y 
        };

        currentHidePosRef.current = hideOffset;

        // 1. Instantly move to hide position on the new edge
        setTransitionDuration(0);
        setCharOffset(hideOffset);
        setRotation(rot);
        setFacingRight(faceRight);

        // 2. Slide out to peek
        peekTimeout = setTimeout(() => {
          if (isDraggingRef.current || modeRef.current !== 'peeking') return;
          setTransitionDuration(1.2); // Smooth, slower slide
          setCharOffset(peekOffset);
          
          // 3. Wait while peeking
          const timePeeking = Math.random() * 8000 + 8000; // Peek for 8-16 seconds
          
          retreatTimeout = setTimeout(() => {
            if (isDraggingRef.current || modeRef.current !== 'peeking') return;
            // 4. Retreat to hide
            setTransitionDuration(0.5);
            setCharOffset(hideOffset);
            
            // Loop
            scheduleNextPeek();
          }, timePeeking);
        }, 100);

      }, timeHidden);
    };

    if (mode === 'peeking') {
      scheduleNextPeek();
    }

    const handleVisibility = () => {
      if (!document.hidden && modeRef.current === 'peeking') {
        clearTimeout(scheduleTimeout);
        clearTimeout(peekTimeout);
        clearTimeout(retreatTimeout);
        scheduleNextPeek(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(scheduleTimeout);
      clearTimeout(peekTimeout);
      clearTimeout(retreatTimeout);
    };
  }, [isDragging, mode]);

  const triggerTaskMode = useCallback((onComplete) => {
    if (modeRef.current === 'task') {
      if (onComplete) onComplete();
      return;
    }
    updateMode('task');
    
    // If the tab is hidden, skip animations entirely to prevent background throttling bugs
    if (document.hidden) {
      setTransitionDuration(0);
      setRotation(0);
      setFacingRight(false);
      setCharOffset({ x: 0, y: 0 });
      if (onComplete) onComplete();
      return;
    }

    // 1. Retreat to the current hide position immediately
    setTransitionDuration(0.3);
    setCharOffset({ x: currentHidePosRef.current.x, y: currentHidePosRef.current.y });
    
    // Use requestAnimationFrame chaining instead of setTimeout to avoid background throttling glitches
    setTimeout(() => {
      // 2. Teleport into the den (bottom right of corner)
      setTransitionDuration(0);
      setRotation(0);
      setFacingRight(false);
      setCharOffset({ x: 0, y: 170 });
      
      // Wait a frame for the teleport to apply without animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // 3. Slide up to visible inside the den
          setTransitionDuration(0.8);
          setCharOffset({ x: 0, y: 0 });
          
          if (onComplete) {
            setTimeout(onComplete, 800);
          }
        });
      });
    }, 300);
  }, []);

  const triggerPeekingMode = useCallback(() => {
    if (modeRef.current === 'peeking') return;
    setTransitionDuration(0.5);
    setCharOffset({ x: 0, y: 170 }); // slide down into the den
    setTimeout(() => updateMode('peeking'), 500);
  }, []);

  return { cornerPos, charOffset, rotation, facingRight, isDragging, transitionDuration, mode, handlePointerDown, triggerTaskMode, triggerPeekingMode };
}
