import { useState, useEffect } from 'react';

export function useXRay(isActive) {
  const [hoveredElementData, setHoveredElementData] = useState(null);

  useEffect(() => {
    if (!isActive) {
      setHoveredElementData(null);
      // Clean up any lingering outlines
      document.querySelectorAll('.mochi-xray-hover').forEach(el => el.classList.remove('mochi-xray-hover'));
      return;
    }

    // Inject X-Ray hover styles if not present
    if (!document.getElementById('mochi-xray-styles')) {
      const style = document.createElement('style');
      style.id = 'mochi-xray-styles';
      style.textContent = `
        .mochi-xray-hover {
          outline: 2px dashed #E07A3F !important;
          outline-offset: -2px !important;
          cursor: crosshair !important;
        }
      `;
      document.head.appendChild(style);
    }

    let currentTarget = null;

    const handleMouseMove = (e) => {
      // Don't inspect our own extension UI
      if (e.target.closest('.mochi-companion-container') || e.target.closest('#focus-companion-root')) {
        if (currentTarget) {
          currentTarget.classList.remove('mochi-xray-hover');
          currentTarget = null;
          setHoveredElementData(null);
        }
        return;
      }

      if (e.target !== currentTarget) {
        if (currentTarget) currentTarget.classList.remove('mochi-xray-hover');
        currentTarget = e.target;
        currentTarget.classList.add('mochi-xray-hover');

        const rect = currentTarget.getBoundingClientRect();
        const style = window.getComputedStyle(currentTarget);
        
        setHoveredElementData({
          tag: currentTarget.tagName.toLowerCase(),
          id: currentTarget.id ? `#${currentTarget.id}` : '',
          classes: currentTarget.className && typeof currentTarget.className === 'string' ? `.${currentTarget.className.split(' ').join('.')}` : '',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          margin: style.margin,
          padding: style.padding,
          color: style.color,
          bg: style.backgroundColor !== 'rgba(0, 0, 0, 0)' ? style.backgroundColor : 'transparent',
          font: style.fontFamily.split(',')[0],
          x: e.clientX,
          y: e.clientY
        });
      } else if (currentTarget) {
        // Just update mouse coordinates for the tooltip
        setHoveredElementData(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
      }
    };

    const handleMouseLeave = () => {
      if (currentTarget) {
        currentTarget.classList.remove('mochi-xray-hover');
        currentTarget = null;
        setHoveredElementData(null);
      }
    };

    // Need to use capturing phase so we get the event before any stopPropagation
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      if (currentTarget) currentTarget.classList.remove('mochi-xray-hover');
    };
  }, [isActive]);

  return hoveredElementData;
}
