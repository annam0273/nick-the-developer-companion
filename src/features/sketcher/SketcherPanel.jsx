import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './SketcherPanel.css';

export default function SketcherPanel({ imageUrl, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#E07A3F');
  const [lineWidth, setLineWidth] = useState(4);
  const [tool, setTool] = useState('pen'); // 'pen', 'eraser', 'rect', 'circle', 'text'
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState(null);

  const [objects, setObjects] = useState([]);
  const [previewShape, setPreviewShape] = useState(null);
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [dragStart, setDragStart] = useState(null);

  // Initialize canvas native resolution
  useEffect(() => {
    const mainCanvas = canvasRef.current;
    if (!mainCanvas) return;
    
    const img = new Image();
    img.onload = () => {
      mainCanvas.width = img.width;
      mainCanvas.height = img.height;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Handle Dragging Objects
  useEffect(() => {
    if (!dragStart) return;
    const handleMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      const dx = (e.clientX - dragStart.startX) * scaleX;
      const dy = (e.clientY - dragStart.startY) * scaleY;
      
      setObjects(objs => objs.map(o => o.id === dragStart.id ? { ...o, x: dragStart.initialX + dx, y: dragStart.initialY + dy } : o));
    };
    const handleUp = () => setDragStart(null);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragStart]);

  // Handle Delete Key for Selected Object
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectId && !textInput) {
        setObjects(objs => objs.filter(o => o.id !== selectedObjectId));
        setSelectedObjectId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, textInput]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  const startDrawing = (e) => {
    if (textInput) {
      finalizeText();
      return; 
    }

    e.preventDefault();
    e.stopPropagation();
    
    // Deselect if clicking canvas
    setSelectedObjectId(null);

    const { x, y } = getCoordinates(e);
    
    if (tool === 'text') {
      const rect = containerRef.current.getBoundingClientRect();
      setTextInput({ 
        x, y, 
        value: '', 
        cssX: e.clientX - rect.left, 
        cssY: e.clientY - rect.top 
      });
      return;
    }

    setStartPos({ x, y });
    setIsDrawing(true);

    if (tool === 'pen' || tool === 'eraser') {
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.stopPropagation();
    const { x, y } = getCoordinates(e);

    if (tool === 'pen' || tool === 'eraser') {
      const mainCtx = canvasRef.current.getContext('2d');
      mainCtx.lineTo(x, y);
      if (tool === 'eraser') {
        mainCtx.globalCompositeOperation = 'destination-out';
        mainCtx.strokeStyle = 'rgba(0,0,0,1)';
        mainCtx.lineWidth = lineWidth * 4;
      } else {
        mainCtx.globalCompositeOperation = 'source-over';
        mainCtx.strokeStyle = color;
        mainCtx.lineWidth = lineWidth;
      }
      mainCtx.lineCap = 'round';
      mainCtx.lineJoin = 'round';
      mainCtx.stroke();
    } else if (tool === 'rect') {
      setPreviewShape({
        id: 'preview', type: 'rect',
        x: Math.min(startPos.x, x), y: Math.min(startPos.y, y),
        w: Math.abs(x - startPos.x), h: Math.abs(y - startPos.y),
        color, lineWidth
      });
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
      setPreviewShape({
        id: 'preview', type: 'circle',
        x: startPos.x - radius, y: startPos.y - radius,
        w: radius * 2, h: radius * 2,
        color, lineWidth
      });
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e?.stopPropagation();
    setIsDrawing(false);

    if (tool === 'pen' || tool === 'eraser') {
      canvasRef.current.getContext('2d').closePath();
    } else if (tool === 'rect' || tool === 'circle') {
      if (previewShape && previewShape.w > 0 && previewShape.h > 0) {
        setObjects(objs => [...objs, { ...previewShape, id: Date.now() }]);
      }
      setPreviewShape(null);
    }
  };

  const finalizeText = () => {
    if (textInput && textInput.value.trim() !== '') {
      setObjects(objs => [...objs, {
        id: Date.now(),
        type: 'text',
        x: textInput.x,
        y: textInput.y,
        value: textInput.value,
        color: color,
        fontSize: Math.max(24, lineWidth * 6)
      }]);
    }
    setTextInput(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setObjects([]);
    setTextInput(null);
    setSelectedObjectId(null);
  };

  const downloadScreenshot = () => {
    finalizeText();
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = canvasRef.current.width;
    downloadCanvas.height = canvasRef.current.height;
    const ctx = downloadCanvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      // 1. Draw original screenshot
      ctx.drawImage(img, 0, 0);
      
      // 2. Draw pixel layer (pen/eraser)
      ctx.drawImage(canvasRef.current, 0, 0);
      
      // 3. Draw object layer
      objects.forEach(obj => {
        if (obj.type === 'rect') {
          ctx.strokeStyle = obj.color;
          ctx.lineWidth = obj.lineWidth;
          ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
        } else if (obj.type === 'circle') {
          ctx.strokeStyle = obj.color;
          ctx.lineWidth = obj.lineWidth;
          ctx.beginPath();
          ctx.arc(obj.x + obj.w/2, obj.y + obj.h/2, obj.w/2, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (obj.type === 'text') {
          ctx.fillStyle = obj.color;
          ctx.font = `bold ${obj.fontSize}px 'Courier New', monospace`;
          ctx.textBaseline = 'top';
          const lines = obj.value.split('\n');
          lines.forEach((line, i) => {
            ctx.fillText(line, obj.x + 2, obj.y + 2 + (i * obj.fontSize * 1.2));
          });
        }
      });

      const link = document.createElement('a');
      link.download = `mochi-sketch-${Date.now()}.png`;
      link.href = downloadCanvas.toDataURL('image/png');
      link.click();
    };
    img.src = imageUrl;
  };

  const renderObject = (obj) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const scaleX = rect.width / canvasRef.current.width;
    const scaleY = rect.height / canvasRef.current.height;
    
    const cssX = obj.x * scaleX;
    const cssY = obj.y * scaleY;
    const isSelected = selectedObjectId === obj.id;
    
    const handlePointerDown = (e) => {
      e.stopPropagation();
      setSelectedObjectId(obj.id);
      setDragStart({ id: obj.id, startX: e.clientX, startY: e.clientY, initialX: obj.x, initialY: obj.y });
    };

    if (obj.type === 'text') {
      return (
        <div 
          key={obj.id}
          onPointerDown={handlePointerDown}
          onDoubleClick={() => {
            setObjects(objs => objs.filter(o => o.id !== obj.id));
            const cRect = containerRef.current.getBoundingClientRect();
            setTextInput({ x: obj.x, y: obj.y, value: obj.value, cssX: cssX + (rect.left - cRect.left), cssY: cssY + (rect.top - cRect.top) });
          }}
          style={{
            position: 'absolute', left: cssX, top: cssY,
            color: obj.color,
            fontSize: `${obj.fontSize * scaleY}px`,
            fontFamily: "'Courier New', Courier, monospace", fontWeight: 'bold',
            whiteSpace: 'pre-wrap',
            border: isSelected ? '2px dashed #E07A3F' : '2px dashed transparent',
            cursor: 'grab', userSelect: 'none', padding: '2px',
            zIndex: 10
          }}
        >
          {obj.value}
        </div>
      );
    } else if (obj.type === 'rect') {
      return (
        <div 
          key={obj.id}
          onPointerDown={handlePointerDown}
          style={{
            position: 'absolute', left: cssX, top: cssY,
            width: obj.w * scaleX, height: obj.h * scaleY,
            border: `${obj.lineWidth * scaleX}px solid ${obj.color}`,
            outline: isSelected ? '2px dashed #E07A3F' : 'none', outlineOffset: '2px',
            cursor: 'grab', zIndex: 10
          }}
        />
      );
    } else if (obj.type === 'circle') {
      return (
        <div 
          key={obj.id}
          onPointerDown={handlePointerDown}
          style={{
            position: 'absolute', left: cssX, top: cssY,
            width: obj.w * scaleX, height: obj.h * scaleY,
            borderRadius: '50%',
            border: `${obj.lineWidth * scaleX}px solid ${obj.color}`,
            outline: isSelected ? '2px dashed #E07A3F' : 'none', outlineOffset: '2px',
            cursor: 'grab', zIndex: 10
          }}
        />
      );
    }
  };

  const colors = ['#E07A3F', '#C25A24', '#3C2B25', '#698B43', '#FFD166', '#EF476F', '#118AB2'];
  const allObjects = previewShape ? [...objects, previewShape] : objects;

  return createPortal(
    <div className="mochi-sketcher-overlay" onClick={(e) => { finalizeText(); onClose(e); }}>
      <div className="mochi-sketcher-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="mochi-sketcher-header">
          <h3>The Sketcher</h3>
          <button className="mochi-sketcher-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="mochi-sketcher-toolbar">
          <div className="mochi-sketcher-colors">
            {colors.map(c => (
              <button 
                key={c} 
                className={`mochi-color-swatch ${color === c && tool !== 'eraser' ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
              />
            ))}
          </div>

          <div className="mochi-sketcher-tools">
            <button className={`mochi-tool-btn ${tool === 'pen' ? 'active' : ''}`} onClick={() => setTool('pen')}>Pen</button>
            <button className={`mochi-tool-btn ${tool === 'rect' ? 'active' : ''}`} onClick={() => setTool('rect')}>Rect</button>
            <button className={`mochi-tool-btn ${tool === 'circle' ? 'active' : ''}`} onClick={() => setTool('circle')}>Circle</button>
            <button className={`mochi-tool-btn ${tool === 'text' ? 'active' : ''}`} onClick={() => setTool('text')}>Text</button>
            <button className={`mochi-tool-btn mochi-eraser-btn ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')}>Eraser</button>
          </div>
          
          <div className="mochi-sketcher-sizes">
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B' }}>Size</span>
            <input 
              type="range" 
              min="2" max="20" 
              value={lineWidth} 
              onChange={(e) => setLineWidth(Number(e.target.value))} 
              className="mochi-size-slider"
            />
          </div>

          <div className="mochi-sketcher-actions">
            <button className="mochi-sketcher-btn outline" onClick={clearCanvas}>Reset</button>
            <button className="mochi-sketcher-btn primary" onClick={downloadScreenshot}>Download</button>
          </div>
        </div>

        <div className="mochi-sketcher-canvas-container" ref={containerRef}>
          {/* We wrap the canvas in a positioning relative div so DOM objects overlay it exactly */}
          <div className="mochi-sketcher-canvas-wrapper" style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'flex' }}>
            <img src={imageUrl} className="mochi-sketcher-bg" alt="Screenshot" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
            <canvas
              ref={canvasRef}
              className="mochi-sketcher-canvas"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              style={{ position: 'relative', zIndex: 2, pointerEvents: 'auto' }}
            />
            {allObjects.map(renderObject)}
          </div>
          
          {textInput && (
            <textarea
              className="mochi-sketcher-text-input"
              style={{
                left: textInput.cssX,
                top: textInput.cssY,
                color: color,
                fontSize: `${Math.max(16, lineWidth * 3)}px`
              }}
              ref={el => el && el.focus()}
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  finalizeText();
                }
              }}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
