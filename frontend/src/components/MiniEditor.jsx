import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Download, X, Palette, RotateCw, RotateCcw, 
  FlipHorizontal, FlipVertical, Sparkles, Sliders, Sun, 
  Contrast, Droplets, Image as ImageIcon, Check, Eye,
  Compass, Minus, Plus, Undo2, Redo2, Focus, Layers,
  Thermometer, Film, Aperture, Wand2, Scissors, ShieldAlert
} from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';

const PRESETS = [
  { id: 'original', name: 'Original', desc: 'No Filter', filters: { exposure: 0, brightness: 100, contrast: 100, highlights: 0, shadows: 0, whites: 0, blacks: 0, temp: 0, tint: 0, saturation: 100, sepia: 0, grayscale: 0, hueRotate: 0, clarity: 0, sharpness: 0, unsharp: 0, vignette: 0, grain: 0, blur: 0 } },
  { id: 'golden_hour', name: 'Golden Hour', desc: 'Warm Sunset Glow', filters: { exposure: 5, brightness: 104, contrast: 108, highlights: 15, shadows: 20, whites: 10, blacks: -5, temp: 35, tint: -5, saturation: 120, sepia: 20, grayscale: 0, hueRotate: -8, clarity: 15, sharpness: 15, unsharp: 0, vignette: -20, grain: 10, blur: 0 } },
  { id: 'cinematic', name: 'Cinematic', desc: 'Teal & Orange', filters: { exposure: 0, brightness: 102, contrast: 118, highlights: -15, shadows: -10, whites: 5, blacks: -15, temp: 15, tint: 10, saturation: 95, sepia: 5, grayscale: 0, hueRotate: 25, clarity: 30, sharpness: 30, unsharp: 0, vignette: -35, grain: 20, blur: 0 } },
  { id: 'vivid_pop', name: 'Vivid Pop', desc: 'Crisp & Punchy', filters: { exposure: 8, brightness: 106, contrast: 120, highlights: 10, shadows: 10, whites: 15, blacks: -10, temp: 5, tint: 0, saturation: 140, sepia: 0, grayscale: 0, hueRotate: 0, clarity: 25, sharpness: 35, unsharp: 0, vignette: -15, grain: 0, blur: 0 } },
  { id: 'moody_noir', name: 'Moody Film', desc: 'Analog 35mm Grain', filters: { exposure: -5, brightness: 96, contrast: 125, highlights: -25, shadows: 20, whites: -10, blacks: 15, temp: 20, tint: -5, saturation: 75, sepia: 30, grayscale: 0, hueRotate: 0, clarity: 10, sharpness: 15, unsharp: 0, vignette: -40, grain: 45, blur: 0 } },
  { id: 'bw_portrait', name: 'B&W Fine Art', desc: 'Deep Silver Contrast', filters: { exposure: 5, brightness: 105, contrast: 135, highlights: 20, shadows: -15, whites: 25, blacks: -20, temp: 0, tint: 0, saturation: 0, sepia: 0, grayscale: 100, hueRotate: 0, clarity: 30, sharpness: 25, unsharp: 0, vignette: -25, grain: 15, blur: 0 } },
  { id: 'pastel_dream', name: 'Pastel Dream', desc: 'Soft Highlight Roll-off', filters: { exposure: 12, brightness: 110, contrast: 90, highlights: 30, shadows: 30, whites: 15, blacks: 10, temp: 10, tint: 15, saturation: 110, sepia: 10, grayscale: 0, hueRotate: 5, clarity: -15, sharpness: 0, unsharp: 25, vignette: 15, grain: 0, blur: 0 } },
  { id: 'royal_gold', name: 'Royal Gold', desc: 'Wedding Luxury Warmth', filters: { exposure: 6, brightness: 106, contrast: 112, highlights: 20, shadows: 15, whites: 15, blacks: -5, temp: 40, tint: -8, saturation: 125, sepia: 25, grayscale: 0, hueRotate: -12, clarity: 15, sharpness: 20, unsharp: 0, vignette: -20, grain: 8, blur: 0 } },
  { id: 'portrait_pro', name: 'Studio Portrait', desc: 'Flattering Skin Tone', filters: { exposure: 4, brightness: 103, contrast: 105, highlights: 10, shadows: 15, whites: 10, blacks: -5, temp: 10, tint: 5, saturation: 106, sepia: 5, grayscale: 0, hueRotate: -3, clarity: 5, sharpness: 20, unsharp: 10, vignette: -10, grain: 0, blur: 0 } },
  { id: 'warm_mocha', name: 'Warm Mocha', desc: 'Cozy Espresso Tone', filters: { exposure: -4, brightness: 96, contrast: 115, highlights: -20, shadows: -10, whites: -5, blacks: -10, temp: 35, tint: -10, saturation: 85, sepia: 40, grayscale: 10, hueRotate: -12, clarity: 15, sharpness: 15, unsharp: 0, vignette: -30, grain: 15, blur: 0 } },
  { id: 'earthy_matte', name: 'Earthy Matte', desc: 'Editorial Film Fade', filters: { exposure: 0, brightness: 102, contrast: 88, highlights: -10, shadows: 35, whites: -15, blacks: 30, temp: 15, tint: -5, saturation: 88, sepia: 15, grayscale: 0, hueRotate: 10, clarity: -10, sharpness: 10, unsharp: 0, vignette: -15, grain: 25, blur: 0 } },
  { id: 'urban_cyber', name: 'Urban Cool', desc: 'Crisp Blue Contrast', filters: { exposure: 5, brightness: 105, contrast: 125, highlights: 15, shadows: -20, whites: 20, blacks: -15, temp: -35, tint: 10, saturation: 120, sepia: 0, grayscale: 0, hueRotate: 45, clarity: 35, sharpness: 35, unsharp: 0, vignette: -30, grain: 10, blur: 0 } },
  { id: 'airy_light', name: 'Airy Clean', desc: 'High-Key Aesthetic', filters: { exposure: 15, brightness: 114, contrast: 96, highlights: 25, shadows: 25, whites: 20, blacks: 5, temp: -5, tint: 5, saturation: 105, sepia: 0, grayscale: 0, hueRotate: 0, clarity: 10, sharpness: 10, unsharp: 0, vignette: 10, grain: 0, blur: 0 } },
  { id: 'dramatic_bw', name: 'Dramatic Noir', desc: 'Deep Blacks & Clarity', filters: { exposure: 0, brightness: 100, contrast: 155, highlights: 25, shadows: -40, whites: 30, blacks: -35, temp: 0, tint: 0, saturation: 0, sepia: 0, grayscale: 100, hueRotate: 0, clarity: 45, sharpness: 40, unsharp: 0, vignette: -50, grain: 30, blur: 0 } },
  { id: 'autumn_amber', name: 'Autumn Amber', desc: 'Rich Red & Gold Foliage', filters: { exposure: 4, brightness: 104, contrast: 115, highlights: 10, shadows: 15, whites: 10, blacks: -5, temp: 45, tint: 10, saturation: 130, sepia: 30, grayscale: 0, hueRotate: -20, clarity: 20, sharpness: 20, unsharp: 0, vignette: -20, grain: 10, blur: 0 } },
];

const BG_OPTIONS = [
  { id: 'none', name: 'Original', desc: 'Natural Background', color: null },
  { id: 'transparent', name: 'Transparent PNG', desc: 'No Background', color: 'transparent' },
  { id: 'white', name: 'Studio White', desc: 'Clean High-Key', color: '#ffffff' },
  { id: 'black', name: 'Dark Luxury', desc: 'Deep Studio Black', color: '#09090b' },
  { id: 'gold_gradient', name: 'Royal Gold', desc: 'Luxury Wedding Gold', color: 'linear-gradient(135deg, #1c1917, #78350f)' },
  { id: 'midnight', name: 'Midnight Blue', desc: 'Deep Sapphire Studio', color: 'linear-gradient(135deg, #020617, #1e1b4b)' },
  { id: 'rose', name: 'Blush Rose', desc: 'Soft Romantic Pastel', color: 'linear-gradient(135deg, #2a0817, #831843)' },
  { id: 'bokeh_blur', name: 'Portrait Blur', desc: 'Bokeh Background', color: 'blur' },
];

const DEFAULT_FILTERS = {
  exposure: 0,
  brightness: 100,
  contrast: 100,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temp: 0,
  tint: 0,
  saturation: 100,
  sepia: 0,
  grayscale: 0,
  hueRotate: 0,
  clarity: 0,
  sharpness: 0,
  unsharp: 0,
  vignette: 0,
  grain: 0,
  blur: 0
};

const MiniEditor = ({ imageUrl, onClose, onSave }) => {
  // Navigation State
  const [mainCategory, setMainCategory] = useState('presets'); // 'presets' | 'light' | 'color' | 'effects' | 'detail' | 'cutout' | 'rotate'
  const [activeSubTool, setActiveSubTool] = useState('brightness');
  const [activePreset, setActivePreset] = useState('original');
  const [isComparing, setIsComparing] = useState(false);
  
  // Current Active State
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [fineAngle, setFineAngle] = useState(0);
  const [rotation90, setRotation90] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Background Removal & Cutout State
  const [bgMode, setBgMode] = useState('none'); // 'none' | 'transparent' | 'white' | 'black' | 'gold_gradient' | 'midnight' | 'rose' | 'bokeh_blur'
  const [cutoutImage, setCutoutImage] = useState(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgProgress, setBgProgress] = useState('');
  const [rawImageBlob, setRawImageBlob] = useState(null);

  // History Stack
  const [history, setHistory] = useState([{
    filters: DEFAULT_FILTERS,
    fineAngle: 0,
    rotation90: 0,
    flipH: false,
    flipV: false,
    activePreset: 'original',
    bgMode: 'none'
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportPreviewUrl, setExportPreviewUrl] = useState(null);

  // Load Image via Blob
  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    const loadImage = async () => {
      try {
        setLoading(true);
        const response = await fetch(imageUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (cancelled) return;

        setRawImageBlob(blob);
        objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          if (!cancelled) {
            setImage(img);
            setLoading(false);
          }
        };
        img.onerror = () => {
          if (!cancelled) {
            alert("Failed to decode image data.");
            onClose();
          }
        };
        img.src = objectUrl;
      } catch (err) {
        if (cancelled) return;
        console.error('Editor fetch error:', err);
        alert("Failed to load image for editing.");
        onClose();
      }
    };

    loadImage();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageUrl, onClose]);

  // Execute In-Browser AI Background Removal with Memory Safety & Progress
  const handleRemoveBackground = async (selectedBgMode = 'transparent') => {
    // If cutout is already cached, instantly switch backdrop mode without recomputing
    if (cutoutImage) {
      setBgMode(selectedBgMode);
      recordHistory(filters, fineAngle, rotation90, flipH, flipV, activePreset, selectedBgMode);
      return;
    }

    if (!image) {
      alert('Photo is still loading. Please wait a moment.');
      return;
    }

    try {
      setIsRemovingBg(true);
      setBgProgress('Preparing image for AI analysis...');

      // Scale to max 1024px to prevent WebAssembly OOM crashes and ensure fast 2-3s processing
      const maxDim = 1024;
      const w = image.width;
      const h = image.height;
      let targetW = w;
      let targetH = h;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        targetW = Math.round(w * scale);
        targetH = Math.round(h * scale);
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetW;
      tempCanvas.height = targetH;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(image, 0, 0, targetW, targetH);

      const aiInputBlob = await new Promise((resolve) => {
        tempCanvas.toBlob(resolve, 'image/jpeg', 0.88);
      });

      if (!aiInputBlob) {
        throw new Error('Failed to prepare image frame');
      }

      setBgProgress('Loading AI neural engine...');

      // Execute imgly background removal with configured CDN and quantized model
      const cutoutBlob = await removeBackground(aiInputBlob, {
        model: 'medium', // Use standard medium model instead of isnet_quint8 which might not exist on all CDNs
        output: {
          format: 'image/png',
          quality: 0.9,
          type: 'foreground'
        },
        progress: (key, current, total) => {
          if (total > 0) {
            const pct = Math.round((current / total) * 100);
            if (key.includes('fetch')) {
              setBgProgress(`Downloading AI model (${pct}%)...`);
            } else if (key.includes('compute') || key.includes('inference')) {
              setBgProgress(`Extracting subject (${pct}%)...`);
            } else {
              setBgProgress(`Processing (${pct}%)...`);
            }
          }
        }
      });

      setBgProgress('Finalizing cutout...');
      const cutoutUrl = URL.createObjectURL(cutoutBlob);
      
      const cImg = new Image();
      cImg.onload = () => {
        setCutoutImage(cImg);
        setBgMode(selectedBgMode);
        setIsRemovingBg(false);
        setBgProgress('');
        recordHistory(filters, fineAngle, rotation90, flipH, flipV, activePreset, selectedBgMode);
      };
      cImg.onerror = () => {
        setIsRemovingBg(false);
        setBgProgress('');
        alert('Failed to decode cutout preview.');
      };
      cImg.src = cutoutUrl;

    } catch (e) {
      console.error('AI background removal error:', e);
      setIsRemovingBg(false);
      setBgProgress('');
      alert('AI Cutout could not process this image. ' + (e.message || 'Please check network connection and try again.'));
    }
  };

  // Push new state into history
  const recordHistory = useCallback((newFilters, newAngle, newRot, newH, newV, newPreset, newBgMode) => {
    const nextState = {
      filters: { ...(newFilters || filters) },
      fineAngle: newAngle !== undefined ? newAngle : fineAngle,
      rotation90: newRot !== undefined ? newRot : rotation90,
      flipH: newH !== undefined ? newH : flipH,
      flipV: newV !== undefined ? newV : flipV,
      activePreset: newPreset !== undefined ? newPreset : activePreset,
      bgMode: newBgMode !== undefined ? newBgMode : bgMode
    };

    setHistory(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      if (sliced.length >= 35) sliced.shift();
      return [...sliced, nextState];
    });
    setHistoryIndex(prev => prev + 1);
  }, [filters, fineAngle, rotation90, flipH, flipV, activePreset, bgMode, historyIndex]);

  // Undo / Redo Actions
  const handleUndo = () => {
    if (historyIndex > 0) {
      const target = history[historyIndex - 1];
      setFilters(target.filters);
      setFineAngle(target.fineAngle);
      setRotation90(target.rotation90);
      setFlipH(target.flipH);
      setFlipV(target.flipV);
      setActivePreset(target.activePreset);
      setBgMode(target.bgMode || 'none');
      setHistoryIndex(prev => prev - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const target = history[historyIndex + 1];
      setFilters(target.filters);
      setFineAngle(target.fineAngle);
      setRotation90(target.rotation90);
      setFlipH(target.flipH);
      setFlipV(target.flipV);
      setActivePreset(target.activePreset);
      setBgMode(target.bgMode || 'none');
      setHistoryIndex(prev => prev + 1);
    }
  };

  const totalAngle = (rotation90 + fineAngle) % 360;

  // Process Lightroom Tone Curve & Pixel Engine
  const processPixelTones = (ctx, w, h) => {
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
        if (data[i + 3] === 0) continue; // Skip transparent pixels in cutout mode

        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Exposure
        if (expFactor !== 0) {
          const mult = Math.pow(2, expFactor * 1.5);
          r *= mult; g *= mult; b *= mult;
        }

        // Temperature
        if (tempFactor !== 0) {
          r += tempFactor * 0.35;
          b -= tempFactor * 0.35;
        }

        // Tint
        if (tintFactor !== 0) {
          g -= tintFactor * 0.3;
          r += tintFactor * 0.15;
          b += tintFactor * 0.15;
        }

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // Highlights & Whites
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

        // Shadows & Blacks
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

        // Clarity
        if (clarityFactor !== 0) {
          const midDist = 1 - Math.abs(lum - 128) / 128;
          const cDelta = (lum - 128) * clarityFactor * midDist * 0.4;
          r += cDelta; g += cDelta; b += cDelta;
        }

        // Grain
        if (grainAmount > 0) {
          const noise = (Math.random() - 0.5) * grainAmount;
          r += noise; g += noise; b += noise;
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      // Sharpness convolution
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

      // Unsharp Mask
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

      // Vignette Layer
      if (filters.vignette !== 0 && bgMode !== 'transparent') {
        ctx.save();
        const vRadius = Math.sqrt(Math.pow(w / 2, 2) + Math.pow(h / 2, 2));
        const gradient = ctx.createRadialGradient(w / 2, h / 2, vRadius * 0.4, w / 2, h / 2, vRadius);
        
        if (filters.vignette < 0) {
          const alpha = Math.abs(filters.vignette) / 100 * 0.85;
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);
        } else {
          const alpha = (filters.vignette / 100) * 0.7;
          gradient.addColorStop(0, 'rgba(255,255,255,0)');
          gradient.addColorStop(1, `rgba(255,255,255,${alpha})`);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

    } catch (e) {
      console.warn('Canvas pixel processing warning:', e);
    }
  };

  // Render on Canvas — uses a FIXED CSS display size to prevent layout jumps
  const renderCanvas = useCallback((exportMode = false, showOriginal = false) => {
    if (!image) return null;

    const srcW = image.width;
    const srcH = image.height;
    const rad = ((showOriginal ? 0 : totalAngle) * Math.PI) / 180;
    const absSin = Math.abs(Math.sin(rad));
    const absCos = Math.abs(Math.cos(rad));
    
    const unscaledTargetW = Math.round(srcW * absCos + srcH * absSin);
    const unscaledTargetH = Math.round(srcW * absSin + srcH * absCos);

    // Limit maximum dimensions for smooth mobile rendering & fast export
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

      // Watermark in bottom right with 50% opacity: "Dreamline Production"
      const fontSize = Math.max(16, Math.round(targetW * 0.025));
      offCtx.save();
      offCtx.font = `600 ${fontSize}px "Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      offCtx.textAlign = 'right';
      offCtx.textBaseline = 'bottom';
      
      const paddingX = Math.max(16, Math.round(targetW * 0.03));
      const paddingY = Math.max(16, Math.round(targetH * 0.03));
      const textX = targetW - paddingX;
      const textY = targetH - paddingY;
      
      // Shadow for high readability over light and dark backgrounds
      offCtx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      offCtx.shadowBlur = Math.round(fontSize * 0.3);
      offCtx.shadowOffsetX = 1;
      offCtx.shadowOffsetY = 1;

      // 50% opacity white text
      offCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      offCtx.fillText('Dreamline Production', textX, textY);
      offCtx.restore();

      return offscreenCanvas;
    }

    // Preview render — set internal resolution and fit into container
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    canvas.width = targetW;
    canvas.height = targetH;

    // Set stable CSS display size based on container
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
      canvas.style.width = `${Math.round(cssW)}px`;
      canvas.style.height = `${Math.round(cssH)}px`;
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
    }

    drawToContext(ctx, targetW, targetH, drawW, drawH, rad, showOriginal);
    if (!showOriginal) {
      processPixelTones(ctx, targetW, targetH);
    }
    return null;
  }, [image, filters, totalAngle, flipH, flipV, bgMode, cutoutImage]);

  const drawToContext = (ctx, canvasW, canvasH, drawW, drawH, rad, showOriginal) => {
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.save();

    const isCutoutActive = !showOriginal && bgMode !== 'none' && cutoutImage;

    // 1. Draw Backdrop if Cutout is Active
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
        // Draw heavily blurred background
        ctx.save();
        ctx.filter = 'blur(16px) brightness(95%)';
        ctx.translate(canvasW / 2, canvasH / 2);
        ctx.rotate(rad);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }
    }

    // 2. Draw Subject / Image
    if (!showOriginal) {
      ctx.filter = `
        brightness(${filters.brightness}%) 
        contrast(${filters.contrast}%) 
        saturate(${filters.saturation}%) 
        sepia(${filters.sepia}%) 
        grayscale(${filters.grayscale}%)
        hue-rotate(${filters.hueRotate}deg)
        blur(${filters.blur}px)
      `;
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
  };

  useEffect(() => {
    renderCanvas(false, isComparing);
  }, [renderCanvas, isComparing]);

  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    setFilters(preset.filters);
    recordHistory(preset.filters, fineAngle, rotation90, flipH, flipV, preset.id, bgMode);
  };

  const handleFilterChange = (key, value) => {
    setActivePreset('');
    setFilters(prev => ({ ...prev, [key]: Number(value) }));
  };

  const handleFilterCommit = () => {
    recordHistory(filters, fineAngle, rotation90, flipH, flipV, activePreset, bgMode);
  };

  const handleFineAngleChange = (delta) => {
    setFineAngle(prev => {
      const next = typeof delta === 'function' ? delta(prev) : Number(delta);
      const clamped = Math.max(-45, Math.min(45, Math.round(next)));
      recordHistory(filters, clamped, rotation90, flipH, flipV, activePreset, bgMode);
      return clamped;
    });
  };

  const handleRotate90 = (delta) => {
    const nextRot = (rotation90 + delta + 360) % 360;
    setRotation90(nextRot);
    recordHistory(filters, fineAngle, nextRot, flipH, flipV, activePreset, bgMode);
  };

  const handleToggleFlip = (axis) => {
    if (axis === 'H') {
      const next = !flipH;
      setFlipH(next);
      recordHistory(filters, fineAngle, rotation90, next, flipV, activePreset, bgMode);
    } else {
      const next = !flipV;
      setFlipV(next);
      recordHistory(filters, fineAngle, rotation90, flipH, next, activePreset, bgMode);
    }
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setFineAngle(0);
    setRotation90(0);
    setFlipH(false);
    setFlipV(false);
    setActivePreset('original');
    setBgMode('none');
    recordHistory(DEFAULT_FILTERS, 0, 0, false, false, 'original', 'none');
  };

  // Universal Export Engine — always shows save modal for reliable mobile saving
  const handleSave = async () => {
    try {
      setSaving(true);
      const offscreen = renderCanvas(true, false);
      if (!offscreen) throw new Error('Canvas render failed');

      const isTransparent = bgMode === 'transparent';
      const mimeType = isTransparent ? 'image/png' : 'image/jpeg';
      const fileExt = isTransparent ? 'png' : 'jpg';

      offscreen.toBlob(async (blob) => {
        if (!blob) {
          alert('Export failed — not enough memory. Try closing other apps.');
          setSaving(false);
          return;
        }

        const fileName = `dreamline-enhanced-${Date.now()}.${fileExt}`;
        const blobUrl = URL.createObjectURL(blob);

        // On mobile: try Web Share API first (Save to Gallery / WhatsApp / Files)
        if (navigator.share && navigator.canShare) {
          try {
            const file = new File([blob], fileName, { type: mimeType });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'Dreamline Enhanced Photo',
              });
              URL.revokeObjectURL(blobUrl);
              setSaving(false);
              onClose();
              return;
            }
          } catch (shareErr) {
            if (shareErr.name === 'AbortError') {
              // User dismissed share sheet — show fallback modal
              console.log('Share dismissed by user');
            }
          }
        }

        // Fallback: Show save modal with long-press image + download button
        setExportPreviewUrl(blobUrl);
        setSaving(false);
      }, mimeType, isTransparent ? undefined : 0.92);

    } catch (e) {
      console.error('Error saving image:', e);
      alert('Export failed. Please try again.');
      setSaving(false);
    }
  };

  const stopProp = (e) => e.stopPropagation();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  if (loading) {
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white rounded-2xl p-6 select-none"
        onTouchStart={stopProp} onTouchMove={stopProp} onTouchEnd={stopProp}
      >
        <div className="animate-spin text-emerald-400 mb-3">
          <Sparkles size={36} />
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-200">Opening Dreamline Image Studio...</p>
        <p className="text-xs text-slate-400 mt-1">Calibrating tones & high-res tools</p>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col w-full h-full bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 select-none relative"
      onTouchStart={stopProp}
      onTouchMove={stopProp}
      onTouchEnd={stopProp}
      onKeyDown={stopProp}
      onClick={stopProp}
    >
      {/* AI BG REMOVAL LOADING OVERLAY */}
      {isRemovingBg && (
        <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center"></div>
            <Scissors size={24} className="text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">AI Subject Cutout</h3>
          <p className="text-xs text-emerald-400 font-semibold mb-2">
            {bgProgress || 'Segmenting photo on device...'}
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Free on-device AI neural matting. No image is sent to any external server.
          </p>
        </div>
      )}

      {/* 1. TOP APP BAR WITH UNDO / REDO / COMPARE / EXPORT */}
      <div className="h-12 px-2 sm:px-4 bg-slate-900/95 border-b border-slate-800/80 flex items-center justify-between z-20 backdrop-blur-md flex-shrink-0">
        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-all flex items-center gap-1.5 text-xs font-semibold"
          title="Cancel and Exit"
        >
          <X size={18} />
          <span className="hidden sm:inline">Cancel</span>
        </button>

        {/* Center: Undo, Redo, Hold to Compare */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-2 rounded-xl transition-all ${
              canUndo ? 'text-slate-200 hover:bg-slate-800 active:scale-95' : 'text-slate-600 opacity-40 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>

          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-2 rounded-xl transition-all ${
              canRedo ? 'text-slate-200 hover:bg-slate-800 active:scale-95' : 'text-slate-600 opacity-40 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </button>

          <div className="w-[1px] h-4 bg-slate-800 mx-0.5"></div>

          <button
            onMouseDown={() => setIsComparing(true)}
            onMouseUp={() => setIsComparing(false)}
            onTouchStart={(e) => { e.stopPropagation(); setIsComparing(true); }}
            onTouchEnd={(e) => { e.stopPropagation(); setIsComparing(false); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isComparing 
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95'
            }`}
            title="Press and hold to compare with original"
          >
            <Eye size={14} />
            <span className="text-[11px]">{isComparing ? 'Original' : 'Compare'}</span>
          </button>
        </div>

        {/* Right: Export Button */}
        <button 
          onClick={handleSave}
          disabled={saving}
          className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-950/60 flex items-center gap-1.5 disabled:opacity-50"
        >
          {saving ? (
            <span className="inline-block animate-spin">⏳</span>
          ) : (
            <Download size={16} />
          )}
          <span>{saving ? 'Exporting...' : 'Export'}</span>
        </button>
      </div>

      {/* 2. MAIN VIEWPORT - fills ALL remaining space */}
      <div ref={containerRef} className={`flex-1 min-h-0 relative flex items-center justify-center p-1 sm:p-3 bg-slate-950/90 overflow-hidden ${bgMode === 'transparent' ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]' : ''}`}>
        {mainCategory === 'rotate' && (
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

        {mainCategory === 'rotate' && (
          <div className="absolute top-3 left-3 bg-emerald-500/90 text-black text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-md">
            Angle: {fineAngle > 0 ? `+${fineAngle}°` : `${fineAngle}°`} {rotation90 !== 0 && `(+${rotation90}°)`}
          </div>
        )}
      </div>

      {/* 3. LIGHTROOM BOTTOM CONTROL DECK */}
      <div className="bg-slate-900 border-t border-slate-800 flex flex-col z-20 shadow-2xl flex-shrink-0">
        
        {/* 3A. ACTIVE ADJUSTMENT SLIDER */}
        <div className="px-3 py-2 bg-slate-950/70 border-b border-slate-800/60 min-h-[48px] flex flex-col justify-center flex-shrink-0">
          
          {mainCategory === 'presets' && (
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Choose from 15 Pro Looks:</span>
              <span className="text-emerald-400 font-bold capitalize">
                {PRESETS.find(p => p.id === activePreset)?.name || 'Custom Look'}
              </span>
            </div>
          )}

          {mainCategory === 'cutout' && (
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Scissors size={14} />
                Select AI Backdrop / Studio Cutout:
              </span>
              <span className="text-white font-bold capitalize">
                {BG_OPTIONS.find(b => b.id === bgMode)?.name || 'Original'}
              </span>
            </div>
          )}

          {mainCategory === 'rotate' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Compass size={14} />
                  Fine Straighten (1° steps)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setFineAngle(0); recordHistory(filters, 0, rotation90, flipH, flipV, activePreset, bgMode); }}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded transition-all"
                  >
                    Reset Angle
                  </button>
                  <span className="text-white font-mono bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-xs">
                    {fineAngle > 0 ? `+${fineAngle}°` : `${fineAngle}°`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleFineAngleChange(prev => Math.max(-45, prev - 1))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-xs"
                >
                  <Minus size={14} />
                </button>

                <input 
                  type="range" 
                  min="-45" 
                  max="45" 
                  step="1"
                  value={fineAngle} 
                  onChange={e => handleFineAngleChange(e.target.value)}
                  className="flex-1 accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />

                <button
                  onClick={() => handleFineAngleChange(prev => Math.min(45, prev + 1))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-xs"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {['light', 'color', 'effects', 'detail'].includes(mainCategory) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="capitalize text-emerald-400">
                  {activeSubTool === 'temp' ? 'Temperature (Cool/Warm)' : 
                   activeSubTool === 'tint' ? 'Tint (Green/Magenta)' : 
                   activeSubTool === 'unsharp' ? 'Unsharp Mask (Soft Glow)' : 
                   activeSubTool === 'vignette' ? 'Vignette Edge' : 
                   activeSubTool === 'grain' ? 'Film Grain' : 
                   activeSubTool}
                </span>
                <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded text-xs">
                  {activeSubTool === 'exposure' && (filters.exposure > 0 ? `+${filters.exposure}` : `${filters.exposure}`)}
                  {activeSubTool === 'brightness' && `${filters.brightness}%`}
                  {activeSubTool === 'contrast' && `${filters.contrast}%`}
                  {activeSubTool === 'highlights' && (filters.highlights > 0 ? `+${filters.highlights}` : `${filters.highlights}`)}
                  {activeSubTool === 'shadows' && (filters.shadows > 0 ? `+${filters.shadows}` : `${filters.shadows}`)}
                  {activeSubTool === 'whites' && (filters.whites > 0 ? `+${filters.whites}` : `${filters.whites}`)}
                  {activeSubTool === 'blacks' && (filters.blacks > 0 ? `+${filters.blacks}` : `${filters.blacks}`)}
                  {activeSubTool === 'temp' && (filters.temp > 0 ? `+${filters.temp} (Warm)` : filters.temp < 0 ? `${filters.temp} (Cool)` : '0')}
                  {activeSubTool === 'tint' && (filters.tint > 0 ? `+${filters.tint} (Magenta)` : filters.tint < 0 ? `${filters.tint} (Green)` : '0')}
                  {activeSubTool === 'saturation' && `${filters.saturation}%`}
                  {activeSubTool === 'sepia' && `${filters.sepia}%`}
                  {activeSubTool === 'grayscale' && `${filters.grayscale}%`}
                  {activeSubTool === 'hueRotate' && `${filters.hueRotate}°`}
                  {activeSubTool === 'clarity' && (filters.clarity > 0 ? `+${filters.clarity}` : `${filters.clarity}`)}
                  {activeSubTool === 'vignette' && (filters.vignette > 0 ? `+${filters.vignette} (White)` : filters.vignette < 0 ? `${filters.vignette} (Dark)` : '0')}
                  {activeSubTool === 'grain' && `${filters.grain}%`}
                  {activeSubTool === 'sharpness' && `+${filters.sharpness}%`}
                  {activeSubTool === 'unsharp' && `+${filters.unsharp}%`}
                  {activeSubTool === 'blur' && `${filters.blur}px`}
                </span>
              </div>

              <input 
                type="range" 
                min={
                  ['exposure', 'highlights', 'shadows', 'whites', 'blacks', 'temp', 'tint', 'clarity', 'vignette'].includes(activeSubTool) ? -100 :
                  activeSubTool === 'hueRotate' ? -180 : 
                  activeSubTool === 'brightness' || activeSubTool === 'contrast' ? 30 : 0
                } 
                max={
                  ['exposure', 'highlights', 'shadows', 'whites', 'blacks', 'temp', 'tint', 'clarity', 'vignette'].includes(activeSubTool) ? 100 :
                  activeSubTool === 'hueRotate' ? 180 : 
                  activeSubTool === 'saturation' ? 200 : 
                  activeSubTool === 'brightness' || activeSubTool === 'contrast' ? 180 : 
                  activeSubTool === 'blur' ? 8 : 100
                }
                step={activeSubTool === 'blur' ? 0.5 : 1}
                value={filters[activeSubTool] !== undefined ? filters[activeSubTool] : 0} 
                onChange={e => handleFilterChange(activeSubTool, e.target.value)}
                onPointerUp={handleFilterCommit}
                onTouchEnd={handleFilterCommit}
                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* 3B. HORIZONTAL SUB-TOOLS CAROUSEL */}
        <div className="px-2 py-2 overflow-x-auto flex gap-1.5 no-scrollbar bg-slate-900/90 flex-shrink-0">
          
          {mainCategory === 'presets' && PRESETS.map(preset => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-left border transition-all flex flex-col items-center justify-center min-w-[95px] ${
                  isSelected 
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500' 
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold whitespace-nowrap">{preset.name}</span>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{preset.desc}</span>
              </button>
            );
          })}

          {mainCategory === 'cutout' && BG_OPTIONS.map(bg => {
            const isSelected = bgMode === bg.id;
            return (
              <button
                key={bg.id}
                onClick={() => {
                  if (bg.id === 'none') {
                    setBgMode('none');
                    recordHistory(filters, fineAngle, rotation90, flipH, flipV, activePreset, 'none');
                  } else {
                    handleRemoveBackground(bg.id);
                  }
                }}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-left border transition-all flex flex-col items-center justify-center min-w-[100px] ${
                  isSelected 
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500' 
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold whitespace-nowrap">{bg.name}</span>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{bg.desc}</span>
              </button>
            );
          })}

          {mainCategory === 'light' && (
            <>
              <button onClick={() => setActiveSubTool('exposure')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'exposure' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Sun size={14} className="text-yellow-400" />
                <span>Exposure</span>
              </button>
              <button onClick={() => setActiveSubTool('brightness')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'brightness' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Sun size={14} />
                <span>Brightness</span>
              </button>
              <button onClick={() => setActiveSubTool('contrast')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'contrast' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Contrast size={14} />
                <span>Contrast</span>
              </button>
              <button onClick={() => setActiveSubTool('highlights')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'highlights' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Sun size={14} className="text-amber-300" />
                <span>Highlights</span>
              </button>
              <button onClick={() => setActiveSubTool('shadows')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'shadows' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Layers size={14} className="text-blue-300" />
                <span>Shadows</span>
              </button>
              <button onClick={() => setActiveSubTool('whites')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'whites' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Sun size={14} className="text-white" />
                <span>Whites</span>
              </button>
              <button onClick={() => setActiveSubTool('blacks')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'blacks' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Layers size={14} className="text-slate-500" />
                <span>Blacks</span>
              </button>
            </>
          )}

          {mainCategory === 'color' && (
            <>
              <button onClick={() => setActiveSubTool('temp')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'temp' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Thermometer size={14} className="text-amber-400" />
                <span>Temp</span>
              </button>
              <button onClick={() => setActiveSubTool('tint')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'tint' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Palette size={14} className="text-pink-400" />
                <span>Tint</span>
              </button>
              <button onClick={() => setActiveSubTool('saturation')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'saturation' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Droplets size={14} />
                <span>Vibrance</span>
              </button>
              <button onClick={() => setActiveSubTool('sepia')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'sepia' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Sparkles size={14} />
                <span>Warmth</span>
              </button>
              <button onClick={() => setActiveSubTool('grayscale')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'grayscale' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <ImageIcon size={14} />
                <span>B&W</span>
              </button>
            </>
          )}

          {mainCategory === 'effects' && (
            <>
              <button onClick={() => setActiveSubTool('clarity')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'clarity' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Wand2 size={14} className="text-emerald-400" />
                <span>Clarity (Dehaze)</span>
              </button>
              <button onClick={() => setActiveSubTool('vignette')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'vignette' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Aperture size={14} className="text-purple-400" />
                <span>Vignette</span>
              </button>
              <button onClick={() => setActiveSubTool('grain')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'grain' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Film size={14} className="text-amber-300" />
                <span>Film Grain</span>
              </button>
            </>
          )}

          {mainCategory === 'detail' && (
            <>
              <button onClick={() => setActiveSubTool('sharpness')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'sharpness' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Focus size={14} className="text-emerald-400" />
                <span>Sharpness</span>
              </button>
              <button onClick={() => setActiveSubTool('unsharp')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'unsharp' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Sparkles size={14} className="text-pink-400" />
                <span>Unsharp Mask</span>
              </button>
              <button onClick={() => setActiveSubTool('blur')} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${activeSubTool === 'blur' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <Droplets size={14} className="text-blue-400" />
                <span>Soft Focus</span>
              </button>
            </>
          )}

          {mainCategory === 'rotate' && (
            <>
              <button onClick={() => handleRotate90(-90)} className="flex-shrink-0 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 active:scale-95">
                <RotateCcw size={14} className="text-emerald-400" />
                <span>-90°</span>
              </button>
              <button onClick={() => handleRotate90(90)} className="flex-shrink-0 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 active:scale-95">
                <RotateCw size={14} className="text-emerald-400" />
                <span>+90°</span>
              </button>
              <button onClick={() => handleToggleFlip('H')} className={`flex-shrink-0 px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 active:scale-95 ${flipH ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <FlipHorizontal size={14} />
                <span>Flip H</span>
              </button>
              <button onClick={() => handleToggleFlip('V')} className={`flex-shrink-0 px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 active:scale-95 ${flipV ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <FlipVertical size={14} />
                <span>Flip V</span>
              </button>
            </>
          )}
        </div>

        {/* 3C. MAIN CATEGORY NAVIGATION BAR */}
        <div className="grid grid-cols-7 border-t border-slate-800/80 bg-slate-950 py-0.5 px-0.5 flex-shrink-0">
          <button onClick={() => setMainCategory('presets')} className={`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all ${mainCategory === 'presets' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
            <Sparkles size={14} />
            <span className="text-[8px] sm:text-[9px]">Looks</span>
          </button>
          <button onClick={() => { setMainCategory('cutout'); }} className={`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all ${mainCategory === 'cutout' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
            <Scissors size={14} />
            <span className="text-[8px] sm:text-[9px]">Cutout</span>
          </button>
          <button onClick={() => { setMainCategory('light'); setActiveSubTool('exposure'); }} className={`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all ${mainCategory === 'light' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
            <Sun size={14} />
            <span className="text-[8px] sm:text-[9px]">Light</span>
          </button>
          <button onClick={() => { setMainCategory('color'); setActiveSubTool('temp'); }} className={`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all ${mainCategory === 'color' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
            <Palette size={14} />
            <span className="text-[8px] sm:text-[9px]">Color</span>
          </button>
          <button onClick={() => { setMainCategory('effects'); setActiveSubTool('clarity'); }} className={`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all ${mainCategory === 'effects' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
            <Wand2 size={14} />
            <span className="text-[8px] sm:text-[9px]">Effects</span>
          </button>
          <button onClick={() => { setMainCategory('detail'); setActiveSubTool('sharpness'); }} className={`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all ${mainCategory === 'detail' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
            <Focus size={14} />
            <span className="text-[8px] sm:text-[9px]">Detail</span>
          </button>
          <button onClick={() => setMainCategory('rotate')} className={`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all ${mainCategory === 'rotate' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
            <Compass size={14} />
            <span className="text-[8px] sm:text-[9px]">Rotate</span>
          </button>
        </div>
      </div>

      {/* 4. EXPORT PREVIEW MODAL */}
      {exportPreviewUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md select-text"
          onClick={() => setExportPreviewUrl(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 flex flex-col items-center text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Check size={26} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Photo Export Ready!</h3>
            <p className="text-xs text-slate-400 mb-4">
              Your high-resolution enhanced photo is ready. Tap Download or long-press the photo to save.
            </p>

            <div className={`w-full max-h-56 overflow-hidden rounded-xl bg-black mb-4 border border-slate-800 ${bgMode === 'transparent' ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px]' : ''}`}>
              <img src={exportPreviewUrl} alt="Exported Photo" className="w-full h-full object-contain" />
            </div>

            <div className="flex gap-2.5 w-full">
              <a
                href={exportPreviewUrl}
                download={`dreamline-enhanced.${bgMode === 'transparent' ? 'png' : 'jpg'}`}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg"
              >
                <Download size={16} />
                Download {bgMode === 'transparent' ? 'PNG' : 'JPG'}
              </a>
              <button
                onClick={() => {
                  setExportPreviewUrl(null);
                  onClose();
                }}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniEditor;
