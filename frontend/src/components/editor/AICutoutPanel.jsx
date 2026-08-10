import React from 'react';
import { Scissors } from 'lucide-react';
import useEditorStore from '../../stores/useEditorStore';

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

const AICutoutPanel = () => {
  const {
    image,
    bgMode,
    setBgMode,
    cutoutImage,
    setCutoutImage,
    setIsRemovingBg,
    setBgProgress,
  } = useEditorStore();

  const handleRemoveBackground = async (selectedBgMode = 'transparent') => {
    if (cutoutImage) {
      setBgMode(selectedBgMode);
      return;
    }

    if (!image) {
      alert('Photo is still loading. Please wait a moment.');
      return;
    }

    try {
      setIsRemovingBg(true);
      setBgProgress('Preparing image for AI analysis...');

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

      const worker = new Worker(new URL('../../workers/aiCutoutWorker.js', import.meta.url), { type: 'module' });
      worker.postMessage({ type: 'process', imageBlob: aiInputBlob });
      
      worker.onmessage = (e) => {
        const { type, progress, result, error } = e.data;
        if (type === 'progress') {
          setBgProgress(progress);
        } else if (type === 'result') {
          setBgProgress('Finalizing cutout...');
          const cutoutUrl = URL.createObjectURL(result);
          const cImg = new Image();
          cImg.onload = () => {
            setCutoutImage(cImg);
            setBgMode(selectedBgMode);
            setIsRemovingBg(false);
            setBgProgress('');
            worker.terminate();
          };
          cImg.onerror = () => {
            setIsRemovingBg(false);
            setBgProgress('');
            alert('Failed to decode cutout preview.');
            worker.terminate();
          };
          cImg.src = cutoutUrl;
        } else if (type === 'error') {
          console.error('Worker AI background removal error:', error);
          setIsRemovingBg(false);
          setBgProgress('');
          alert('AI Cutout could not process this image.');
          worker.terminate();
        }
      };

    } catch (e) {
      console.error('AI background removal setup error:', e);
      setIsRemovingBg(false);
      setBgProgress('');
      alert('AI Cutout failed to initialize. ' + (e.message || 'Please check network connection and try again.'));
    }
  };

  return (
    <div className="bg-slate-900 border-t border-slate-800 flex flex-col z-20 shadow-2xl flex-shrink-0">
      <div className="px-3 py-2 bg-slate-950/70 border-b border-slate-800/60 min-h-[48px] flex flex-col justify-center flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Scissors size={14} />
            Select AI Backdrop / Studio Cutout:
          </span>
          <span className="text-white font-bold capitalize">
            {BG_OPTIONS.find(b => b.id === bgMode)?.name || 'Original'}
          </span>
        </div>
      </div>

      <div className="px-2 py-2 overflow-x-auto flex gap-1.5 no-scrollbar bg-slate-900/90 flex-shrink-0">
        {BG_OPTIONS.map(bg => {
          const isSelected = bgMode === bg.id;
          return (
            <button
              key={bg.id}
              onClick={() => {
                if (bg.id === 'none') {
                  setBgMode('none');
                } else {
                  handleRemoveBackground(bg.id);
                }
              }}
              className={\`flex-shrink-0 px-3.5 py-2 rounded-xl text-left border transition-all flex flex-col items-center justify-center min-w-[100px] \${
                isSelected 
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500' 
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
              }\`}
            >
              <span className="text-xs font-bold whitespace-nowrap">{bg.name}</span>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">{bg.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AICutoutPanel;
