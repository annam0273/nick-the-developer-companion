import React from 'react';
import { createPortal } from 'react-dom';
import { useXRay } from './useXRay';
import './TypographerPanel.css';

export default function XRayTooltip({ isActive }) {
  const xrayData = useXRay(isActive);

  if (!isActive || !xrayData) return null;

  // Keep tooltip on screen
  const tooltipWidth = 220;
  const tooltipHeight = 150;
  let left = xrayData.x + 15;
  let top = xrayData.y + 15;

  if (left + tooltipWidth > window.innerWidth) {
    left = xrayData.x - tooltipWidth - 15;
  }
  if (top + tooltipHeight > window.innerHeight) {
    top = xrayData.y - tooltipHeight - 15;
  }

  return createPortal(
    <div 
      className="mochi-xray-tooltip"
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        zIndex: 2147483647,
        pointerEvents: 'none'
      }}
    >
      <div className="mochi-xray-tooltip-header">
        <span className="mochi-xray-tag">{xrayData.tag}</span>
        <span className="mochi-xray-classes">{xrayData.id}{xrayData.classes}</span>
      </div>
      <div className="mochi-xray-tooltip-grid">
        <div className="mochi-xray-stat"><span>Size</span> {xrayData.width} × {xrayData.height}</div>
        <div className="mochi-xray-stat"><span>Margin</span> {xrayData.margin}</div>
        <div className="mochi-xray-stat"><span>Padding</span> {xrayData.padding}</div>
        <div className="mochi-xray-stat"><span>Font</span> {xrayData.font}</div>
        <div className="mochi-xray-stat"><span>Color</span> {xrayData.color}</div>
        <div className="mochi-xray-stat"><span>Bg</span> {xrayData.bg}</div>
      </div>
    </div>,
    document.body
  );
}
