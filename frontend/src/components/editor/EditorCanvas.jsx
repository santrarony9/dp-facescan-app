import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import useEditorStore from '../../stores/useEditorStore';

const EditorCanvas = forwardRef((props, ref) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const {
    image,
    filters,
    fineAngle,
    rotation90,
    flipH,
    flipV,
    bgMode,
    cutoutImage,
    isComparing,
    setIsComparing,
  } = useEditorStore();

  const totalAngle = (rotation90 + fineAngle) % 360;

  const processPixelTones = useCallback((ctx, w, h) => {
    const hasPixelEdits = 
      filters.exposure !== 0 || 
      filters.highlights !== 0 || 
      filters.shadows !== 0 || 
      filters.whites !== 0 || 
      filters.blacks !== 0 || 
      filters.temp !== 0 || 
      filters.tint !== 0 || 
      filters.clarity !== 0 || 
      filters.sharpness > 0 || 
      filters.unsharp > 0 || 
      filters.grain > 0 || 
      filters.vignette !== 0;

    if (!hasPixelEdits) return;

    try {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const len = data.length;

      const expFactor = filters.exposure / 100;
      const hlFactor = filters.highlights / 100;
      const shFactor = filters.shadows / 100;
      const whFactor = filters.whites / 100;
      const blFactor = filters.blacks / 100;
      const tempFactor = filters.temp;
      const tintFactor = filters.tint;
      const clarityFactor = filters.clarity / 100;
      const grainAmount = (filters.grain / 100) * 32;

      for (let i = 0; i < len; i += 4) {
        if (data[i + 3] === 0) continue; 

        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if (expFactor !== 0) {
          const mult = Math.pow(2, expFactor * 1.5);
          r *= mult; g *= mult; b *= mult;
        }
        if (tempFactor !== 0) {
          r += tempFactor * 0.35;
          b -= tempFactor * 0.35;
        }
        if (tintFactor !== 0) {
          g -= tintFactor * 0.3;
          r += tintFactor * 0.15;
          b += tintFactor * 0.15;
        }

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (hlFactor !== 0 && lum > 115) {
          const wH = Math.min(1, (lum - 115) / 140);
          const delta = hlFactor > 0 ? (255 - lum) * hlFactor * wH : (lum - 115) * hlFactor * wH;
          r += delta; g += delta; b += delta;
        }
        if (whFactor !== 0 && lum > 160) {
          const wW = Math.min(1, (lum - 160) / 95);
          const delta = whFactor * 40 * wW;
          r += delta; g += delta; b += delta;
        }
        if (shFactor !== 0 && lum < 140) {
          const wS = Math.min(1, (140 - lum) / 140);
          const delta = shFactor > 0 ? (140 - lum) * shFactor * wS : (lum) * shFactor * wS;
          r += delta; g += delta; b += delta;
        }
        if (blFactor !== 0 && lum < 90) {
          const wB = Math.min(1, (90 - lum) / 90);
          const delta = blFactor * 35 * wB;
          r += delta; g += delta; b += delta;
        }
        if (clarityFactor !== 0) {
          const midDist = 1 - Math.abs(lum - 128) / 128;
          const cDelta = (lum - 128) * clarityFactor * midDist * 0.4;
          r += cDelta; g += cDelta; b += cDelta;
        }
        if (grainAmount > 0) {
          const noise = (Math.random() - 0.5) * grainAmount;
          r += noise; g += noise; b += noise;
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      if (filters.sharpness > 0) {
        const sharpAmount = (filters.sharpness / 100) * 1.3;
        const copy = new Uint8ClampedArray(data);
        const stride = w * 4;

        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * stride + x * 4;
            if (data[idx + 3] === 0) continue;

            for (let c = 0; c < 3; c++) {
              const center = copy[idx + c];
              const up = copy[idx - stride + c];
              const down = copy[idx + stride + c];
              const left = copy[idx - 4 + c];
              const right = copy[idx + 4 + c];

              const sharpened = center + sharpAmount * (4 * center - up - down - left - right);
              data[idx + c] = Math.max(0, Math.min(255, sharpened));
            }
          }
        }
      }

      if (filters.unsharp > 0) {
        const unsharpFactor = (filters.unsharp / 100) * 0.45;
        const copy = new Uint8ClampedArray(data);
        const stride = w * 4;

        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * stride + x * 4;
            if (data[idx + 3] === 0) continue;

            for (let c = 0; c < 3; c++) {
              const avg = (
                copy[idx - stride - 4 + c] + copy[idx - stride + c] + copy[idx - stride + 4 + c] +
                copy[idx - 4 + c]          + copy[idx + c]          + copy[idx + 4 + c] +
                copy[idx + stride - 4 + c] + copy[idx + stride + c] + copy[idx + stride + 4 + c]
              ) / 9;

              const original = data[idx + c];
              data[idx + c] = Math.max(0, Math.min(255, original * (1 - unsharpFactor) + avg * unsharpFactor));
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      if (filters.vignette !== 0 && bgMode !== 'transparent') {
        ctx.save();
        const vRadius = Math.sqrt(Math.pow(w / 2, 2) + Math.pow(h / 2, 2));
        const gradient = ctx.createRadialGradient(w / 2, h / 2, vRadius * 0.4, w / 2, h / 2, vRadius);
        
        if (filters.vignette < 0) {
          const alpha = Math.abs(filters.vignette) / 100 * 0.85;
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, \`rgba(0,0,0,\${alpha})\`);
        } else {
          const alpha = (filters.vignette / 100) * 0.7;
          gradient.addColorStop(0, 'rgba(255,255,255,0)');
          gradient.addColorStop(1, \`rgba(255,255,255,\${alpha})\`);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

    } catch (e) {
      console.warn('Canvas pixel processing warning:', e);
    }
  }, [filters, bgMode]);

  const drawToContext = useCallback((ctx, canvasW, canvasH, drawW, drawH, rad, showOriginal) => {
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.save();

    const isCutoutActive = !showOriginal && bgMode !== 'none' && cutoutImage;

    if (isCutoutActive) {
      if (bgMode === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (bgMode === 'black') {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (bgMode === 'gold_gradient') {
        const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        grad.addColorStop(0, '#1c1917');
        grad.addColorStop(1, '#78350f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (bgMode === 'midnight') {
        const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        grad.addColorStop(0, '#020617');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (bgMode === 'rose') {
        const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        grad.addColorStop(0, '#2a0817');
        grad.addColorStop(1, '#831843');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (bgMode === 'bokeh_blur') {
        ctx.save();
        ctx.filter = 'blur(16px) brightness(95%)';
        ctx.translate(canvasW / 2, canvasH / 2);
        ctx.rotate(rad);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }
    }

    if (!showOriginal) {
      ctx.filter = \`
        brightness(\${filters.brightness}%) 
        contrast(\${filters.contrast}%) 
        saturate(\${filters.saturation}%) 
        sepia(\${filters.sepia}%) 
        grayscale(\${filters.grayscale}%)
        hue-rotate(\${filters.hueRotate}deg)
        blur(\${filters.blur}px)
      \`;
    } else {
      ctx.filter = 'none';
    }

    ctx.translate(canvasW / 2, canvasH / 2);

    if (!showOriginal) {
      ctx.rotate(rad);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    }

    const imgToDraw = isCutoutActive ? cutoutImage : image;
    ctx.drawImage(imgToDraw, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [bgMode, cutoutImage, image, flipH, flipV, filters]);

  const renderCanvas = useCallback((exportMode = false, showOriginal = false) => {
    if (!image) return null;

    const srcW = image.width;
    const srcH = image.height;
    const rad = ((showOriginal ? 0 : totalAngle) * Math.PI) / 180;
    const absSin = Math.abs(Math.sin(rad));
    const absCos = Math.abs(Math.cos(rad));
    
    const unscaledTargetW = Math.round(srcW * absCos + srcH * absSin);
    const unscaledTargetH = Math.round(srcW * absSin + srcH * absCos);

    const maxDim = exportMode ? 2048 : 1200;
    let scaleFactor = 1;
    if (unscaledTargetW > maxDim || unscaledTargetH > maxDim) {
      scaleFactor = maxDim / Math.max(unscaledTargetW, unscaledTargetH);
    }

    const targetW = Math.round(unscaledTargetW * scaleFactor);
    const targetH = Math.round(unscaledTargetH * scaleFactor);
    const drawW = srcW * scaleFactor;
    const drawH = srcH * scaleFactor;

    if (exportMode) {
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = targetW;
      offscreenCanvas.height = targetH;
      const offCtx = offscreenCanvas.getContext('2d');
      drawToContext(offCtx, targetW, targetH, drawW, drawH, rad, showOriginal);
      processPixelTones(offCtx, targetW, targetH);

      const fontSize = Math.max(16, Math.round(targetW * 0.025));
      offCtx.save();
      offCtx.font = \`600 \${fontSize}px "Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif\`;
      offCtx.textAlign = 'right';
      offCtx.textBaseline = 'bottom';
      
      const paddingX = Math.max(16, Math.round(targetW * 0.03));
      const paddingY = Math.max(16, Math.round(targetH * 0.03));
      const textX = targetW - paddingX;
      const textY = targetH - paddingY;
      
      offCtx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      offCtx.shadowBlur = Math.round(fontSize * 0.3);
      offCtx.shadowOffsetX = 1;
      offCtx.shadowOffsetY = 1;

      offCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      offCtx.fillText('Dreamline Production', textX, textY);
      offCtx.restore();

      return offscreenCanvas;
    }

    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    canvas.width = targetW;
    canvas.height = targetH;

    const container = containerRef.current;
    if (container) {
      const pad = 16;
      const containerW = Math.max(100, container.clientWidth - pad);
      const containerH = Math.max(100, container.clientHeight - pad);
      const aspect = targetW / targetH;
      let cssW, cssH;
      if (containerW / containerH > aspect) {
        cssH = containerH;
        cssW = containerH * aspect;
      } else {
        cssW = containerW;
        cssH = containerW / aspect;
      }
      canvas.style.width = \`\${Math.round(cssW)}px\`;
      canvas.style.height = \`\${Math.round(cssH)}px\`;
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
    }

    drawToContext(ctx, targetW, targetH, drawW, drawH, rad, showOriginal);
    if (!showOriginal) {
      processPixelTones(ctx, targetW, targetH);
    }
    return null;
  }, [image, totalAngle, drawToContext, processPixelTones]);

  useImperativeHandle(ref, () => ({
    renderCanvas
  }));

  useEffect(() => {
    renderCanvas(false, isComparing);
  }, [renderCanvas, isComparing]);

  const touchStartRef = useRef(null);

  const handlePointerDown = (e) => {
    touchStartRef.current = { x: e.clientX, y: e.clientY };
    const timer = setTimeout(() => {
      setIsComparing(true);
    }, 200);
    touchStartRef.current.timer = timer;
  };

  const handlePointerUp = () => {
    if (touchStartRef.current?.timer) {
      clearTimeout(touchStartRef.current.timer);
    }
    setIsComparing(false);
  };

  const handlePointerMove = (e) => {
    if (touchStartRef.current) {
      const dx = e.clientX - touchStartRef.current.x;
      const dy = e.clientY - touchStartRef.current.y;
      if (Math.hypot(dx, dy) >= 10) {
        if (touchStartRef.current.timer) {
          clearTimeout(touchStartRef.current.timer);
        }
        setIsComparing(false);
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={\`flex-1 min-h-0 relative flex items-center justify-center p-1 sm:p-3 bg-slate-950/90 overflow-hidden \${bgMode === 'transparent' ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]' : ''}\`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      {useEditorStore.getState().mainCategory === 'rotate' && (
        <div className="absolute inset-4 pointer-events-none grid grid-cols-3 grid-rows-3 border border-emerald-500/20 z-10 rounded-lg">
          <div className="border-r border-b border-emerald-500/15"></div>
          <div className="border-r border-b border-emerald-500/15"></div>
          <div className="border-b border-emerald-500/15"></div>
          <div className="border-r border-b border-emerald-500/15"></div>
          <div className="border-r border-b border-emerald-500/15"></div>
          <div className="border-b border-emerald-500/15"></div>
          <div className="border-r border-emerald-500/15"></div>
          <div className="border-r border-emerald-500/15"></div>
          <div></div>
        </div>
      )}
      
      <canvas 
        ref={canvasRef} 
        className="rounded-lg shadow-2xl object-contain"
        style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
      />
      
      {useEditorStore.getState().mainCategory === 'rotate' && (
        <div className="absolute top-3 left-3 bg-emerald-500/90 text-black text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-md">
          Angle: {fineAngle > 0 ? \`+\${fineAngle}°\` : \`\${fineAngle}°\`} {rotation90 !== 0 && \`(+\${rotation90}°)\`}
        </div>
      )}
    </div>
  );
});

export default EditorCanvas;
