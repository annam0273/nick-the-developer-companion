import React, { useState, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import './CompressorPanel.css';

const SIZE_PRESETS = {
  original: { label: 'Original Size', width: 0, height: 0, crop: false },
  custom: { label: 'Custom (W/H)', width: 0, height: 0, crop: false },
  insta_square: { label: 'Instagram Square', width: 1080, height: 1080, crop: true },
  hd_1080p: { label: 'HD 1080p', width: 1920, height: 1080, crop: true },
  hd_720p: { label: 'HD 720p', width: 1280, height: 720, crop: true },
  portrait_9_16: { label: 'Portrait (9:16)', width: 1080, height: 1920, crop: true }
};

export default function CompressorPanel({ onClose }) {
  const [originalFile, setOriginalFile] = useState(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [originalSize, setOriginalSize] = useState(0);

  const [compressedUrl, setCompressedUrl] = useState('');
  const [compressedSize, setCompressedSize] = useState(0);
  const [compressedBlob, setCompressedBlob] = useState(null);

  const [format, setFormat] = useState('image/webp');
  const [actualFormat, setActualFormat] = useState('image/webp');
  const [errorMsg, setErrorMsg] = useState('');
  const [quality, setQuality] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [preset, setPreset] = useState('original');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');

  // Cropper states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Calculate aspect ratio
  let targetRatio = 1;
  const p = SIZE_PRESETS[preset];
  if (preset === 'custom') {
    const w = parseInt(customWidth) || 1;
    const h = parseInt(customHeight) || 1;
    targetRatio = w / h;
  } else if (p && p.crop) {
    targetRatio = p.width / p.height;
  }

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) return;
    setOriginalFile(file);
    setOriginalSize(file.size);
    
    const url = URL.createObjectURL(file);
    setSourceUrl(url);

    const img = new Image();
    img.onload = () => {
      // Dimension tracking removed
      setCustomWidth(img.width.toString());
      setCustomHeight(img.height.toString());
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    };
    img.src = url;
  };

  // Compression Logic using Canvas API
  useEffect(() => {
    if (!sourceUrl) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const p = SIZE_PRESETS[preset];
      let tWidth, tHeight;
      let sX = 0, sY = 0, sW = img.width, sH = img.height;

      if (preset === 'original') {
        tWidth = img.width;
        tHeight = img.height;
      } else {
        if (preset === 'custom') {
          tWidth = parseInt(customWidth) || img.width;
          tHeight = parseInt(customHeight) || img.height;
        } else {
          tWidth = p.width;
          tHeight = p.height;
        }

        if (tWidth > 4000) tWidth = 4000;
        if (tHeight > 4000) tHeight = 4000;

        if (croppedAreaPixels) {
          sX = croppedAreaPixels.x;
          sY = croppedAreaPixels.y;
          sW = croppedAreaPixels.width;
          sH = croppedAreaPixels.height;
        }
      }

      canvas.width = tWidth;
      canvas.height = tHeight;

      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, sX, sY, sW, sH, 0, 0, tWidth, tHeight);

      if (format === 'image/avif') {
        setIsProcessing(true);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Convert to regular array buffer so it clones cleanly
        const buffer = imageData.data.buffer.slice(0);
        
        chrome.runtime.sendMessage({
          type: 'ENCODE_AVIF',
          payload: {
            data: Array.from(new Uint8Array(buffer)), // Fallback to array if buffer fails structure clone
            width: imageData.width,
            height: imageData.height,
            quality: quality
          }
        }, (response) => {
          setIsProcessing(false);
          if (chrome.runtime.lastError || !response || response.error) {
            const err = (chrome.runtime.lastError?.message || response?.error || 'Unknown Error');
            console.error("AVIF encoding failed:", err);
            setActualFormat('error');
            setErrorMsg(err);
            return;
          }
          const blob = new Blob([new Uint8Array(response.buffer)], { type: 'image/avif' });
          setActualFormat('image/avif');
          setCompressedSize(blob.size);
          setCompressedBlob(blob);
          setCompressedUrl(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });
        });
      } else {
        setIsProcessing(true);
        canvas.toBlob(
          (blob) => {
            setIsProcessing(false);
            if (blob) {
              setActualFormat(blob.type);
              setCompressedSize(blob.size);
              setCompressedBlob(blob);
              setCompressedUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(blob);
              });
            }
          },
          format,
          quality / 100
        );
      }
    };
    img.src = sourceUrl;
    
  }, [sourceUrl, format, quality, preset, customWidth, customHeight, croppedAreaPixels]);

  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const copyToClipboard = async (blob) => {
    try {
      if (blob.type === 'image/png') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } else {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (pngBlob) => {
            try {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
            } catch(e) { console.error("Failed to write to clipboard", e); }
          }, 'image/png');
        };
        img.src = URL.createObjectURL(blob);
      }
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  };

  const downloadCompressed = () => {
    if (!compressedUrl || !compressedBlob) return;
    const a = document.createElement('a');
    a.href = compressedUrl;
    let ext = 'png';
    if (format === 'image/jpeg') ext = 'jpg';
    else if (format === 'image/webp') ext = 'webp';
    else if (format === 'image/avif') ext = 'avif';
    a.download = `optimized_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    copyToClipboard(compressedBlob);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="mochi-compressor-panel" 
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="mochi-compressor-header">
        <h3>The Compressor</h3>
        <button className="mochi-compressor-close" onClick={onClose}>×</button>
      </div>

      <div className="mochi-compressor-content">
        {!originalFile ? (
          <div 
            className={`mochi-compressor-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>Drag & Drop an image here<br/><span>or click to browse</span></p>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{display: 'none'}} />
          </div>
        ) : (
          <div className="mochi-compressor-workspace">
            <div className={`mochi-compressor-preview ${preset !== 'original' ? 'is-cropping' : ''}`}>
              <div className="preview-card original-card">
                <span className="preview-label">Original ({formatBytes(originalSize)})</span>
                {preset === 'original' ? (
                  <img src={sourceUrl} alt="Original" />
                ) : (
                  <div className="cropper-container">
                    <Cropper
                      image={sourceUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={targetRatio}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={(area, areaPx) => setCroppedAreaPixels(areaPx)}
                    />
                  </div>
                )}
              </div>
              <div className="preview-card optimized-card">
                <span className={`preview-label ${actualFormat === 'error' ? 'error' : (isProcessing ? 'processing' : 'success')}`}>
                  {isProcessing ? 'Encoding...' : 
                    actualFormat === 'error' ? `Error: ${errorMsg}` : 
                    (actualFormat === 'image/png' && format === 'image/avif' ? 'AVIF Not Supported (PNG)' : 'Optimized')} 
                  {!isProcessing && actualFormat !== 'error' && ` (${formatBytes(compressedSize)})`} 
                  {!isProcessing && actualFormat !== 'error' && (
                    <span className={`savings ${compressedSize > originalSize ? 'negative' : ''}`}>
                      {compressedSize > originalSize ? '+' : '-'}{Math.round(Math.abs(1 - compressedSize/originalSize)*100)}%
                    </span>
                  )}
                </span>
                <img src={compressedUrl} alt="Compressed" className={isProcessing ? 'processing-blur' : ''} />
                {isProcessing && (
                  <div className="processing-overlay">
                     <div className="spinner"></div>
                     Processing...
                  </div>
                )}
              </div>
            </div>

            <div className="mochi-compressor-controls">
              <div className="control-group">
                <label>Format</label>
                <select className="mochi-select" value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="image/avif">AVIF</option>
                  <option value="image/webp">WebP</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                </select>
              </div>

              <div className="control-group">
                <label>Preset Crop</label>
                <select className="mochi-select" value={preset} onChange={(e) => setPreset(e.target.value)}>
                  {Object.entries(SIZE_PRESETS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              
              {preset === 'custom' && (
                <>
                  <div className="control-group">
                    <label>Width (px)</label>
                    <input className="mochi-input" type="number" value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} />
                  </div>
                  <div className="control-group">
                    <label>Height (px)</label>
                    <input className="mochi-input" type="number" value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} />
                  </div>
                </>
              )}

              <div className="control-group quality-group">
                <label>Quality ({quality}%)</label>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={quality} 
                  onChange={(e) => setQuality(Number(e.target.value))} 
                  disabled={format === 'image/png'}
                />
              </div>
            </div>

            <div className="mochi-compressor-actions">
              <button className="mochi-btn mochi-btn-clear" onClick={() => setOriginalFile(null)}>Back</button>
              <button className="mochi-btn mochi-btn-primary" onClick={downloadCompressed}>
                {copied ? '✓ Downloaded & Copied!' : 'Download Image'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
