import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage randomized blinking animation.
 * Returns a boolean `isBlinking` that is true for a short duration during a blink.
 */
export function useBlink() {
  const [isBlinking, setIsBlinking] = useState(false);

  const triggerBlink = useCallback(() => {
    // Start blink
    setIsBlinking(true);

    // End blink quickly (eyes closed for 150ms)
    setTimeout(() => {
      setIsBlinking(false);
    }, 150);
  }, []);

  useEffect(() => {
    let timeoutId;

    const scheduleNextBlink = () => {
      // Random interval between 2 seconds and 6 seconds
      const nextBlinkIn = Math.random() * 4000 + 2000;
      
      timeoutId = setTimeout(() => {
        triggerBlink();
        // Double blink chance (20% probability)
        if (Math.random() > 0.8) {
          setTimeout(() => triggerBlink(), 250);
        }
        scheduleNextBlink();
      }, nextBlinkIn);
    };

    scheduleNextBlink();

    return () => clearTimeout(timeoutId);
  }, [triggerBlink]);

  return isBlinking;
}

export function useSleep() {
  const [isSleeping, setIsSleeping] = useState(false);

  useEffect(() => {
    let idleTimeout;

    const resetIdle = () => {
      setIsSleeping(false);
      clearTimeout(idleTimeout);
      // Go to sleep after 60 seconds of inactivity
      idleTimeout = setTimeout(() => setIsSleeping(true), 60000);
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('click', resetIdle);

    resetIdle(); // Start timer

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('click', resetIdle);
      clearTimeout(idleTimeout);
    };
  }, []);

  return isSleeping;
}

export function useMouseTracking(containerRef, isSleeping, facingRight, rotation) {
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isSleeping) {
      setPupilOffset({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const foxCenterX = rect.left + rect.width / 2;
      const foxCenterY = rect.top + rect.height / 2;
      
      let dx = e.clientX - foxCenterX;
      let dy = e.clientY - foxCenterY;
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 2.5; 
      
      let offsetX = 0;
      let offsetY = 0;
      
      if (distance > 0) {
        offsetX = (dx / distance) * Math.min(distance * 0.05, maxOffset);
        offsetY = (dy / distance) * Math.min(distance * 0.05, maxOffset);
      }

      if (facingRight) {
        offsetX = -offsetX;
      }

      const rad = -(rotation * Math.PI) / 180;
      const finalX = offsetX * Math.cos(rad) - offsetY * Math.sin(rad);
      const finalY = offsetX * Math.sin(rad) + offsetY * Math.cos(rad);

      setPupilOffset({ x: finalX, y: finalY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isSleeping, facingRight, rotation, containerRef]);

  return pupilOffset;
}
