import React from 'react';
import { 
  Sun, Contrast, Layers, Thermometer, Palette, Droplets, 
  Sparkles, ImageIcon, Wand2, Aperture, Film, Focus, 
  Compass, Minus, Plus, RotateCcw, RotateCw, FlipHorizontal, FlipVertical 
} from 'lucide-react';
import useEditorStore from '../../stores/useEditorStore';

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

const AdjustmentPanel = () => {
  const {
    mainCategory,
    activeSubTool,
    setActiveSubTool,
    filters,
    setFilter,
    activePreset,
    setPreset,
    fineAngle,
    setFineAngle,
    rotation90,
    setRotation90,
    flipH,
    toggleFlipH,
    flipV,
    toggleFlipV
  } = useEditorStore();

  const handleFineAngleChange = (delta) => {
    const prev = fineAngle;
    const next = typeof delta === 'function' ? delta(prev) : Number(delta);
    const clamped = Math.max(-45, Math.min(45, Math.round(next)));
    setFineAngle(clamped);
  };

  const handleRotate90 = (delta) => {
    const nextRot = (rotation90 + delta + 360) % 360;
    setRotation90(nextRot);
  };

  return (
    <div className="bg-slate-900 border-t border-slate-800 flex flex-col z-20 shadow-2xl flex-shrink-0">
      <div className="px-3 py-2 bg-slate-950/70 border-b border-slate-800/60 min-h-[48px] flex flex-col justify-center flex-shrink-0">
        
        {mainCategory === 'presets' && (
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Choose from 15 Pro Looks:</span>
            <span className="text-emerald-400 font-bold capitalize">
              {PRESETS.find(p => p.id === activePreset)?.name || 'Custom Look'}
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
                  onClick={() => setFineAngle(0)}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded transition-all"
                >
                  Reset Angle
                </button>
                <span className="text-white font-mono bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-xs">
                  {fineAngle > 0 ? \`+\${fineAngle}°\` : \`\${fineAngle}°\`}
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
                min="-45" max="45" step="1"
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
                {activeSubTool === 'exposure' && (filters.exposure > 0 ? \`+\${filters.exposure}\` : \`\${filters.exposure}\`)}
                {activeSubTool === 'brightness' && \`\${filters.brightness}%\`}
                {activeSubTool === 'contrast' && \`\${filters.contrast}%\`}
                {activeSubTool === 'highlights' && (filters.highlights > 0 ? \`+\${filters.highlights}\` : \`\${filters.highlights}\`)}
                {activeSubTool === 'shadows' && (filters.shadows > 0 ? \`+\${filters.shadows}\` : \`\${filters.shadows}\`)}
                {activeSubTool === 'whites' && (filters.whites > 0 ? \`+\${filters.whites}\` : \`\${filters.whites}\`)}
                {activeSubTool === 'blacks' && (filters.blacks > 0 ? \`+\${filters.blacks}\` : \`\${filters.blacks}\`)}
                {activeSubTool === 'temp' && (filters.temp > 0 ? \`+\${filters.temp} (Warm)\` : filters.temp < 0 ? \`\${filters.temp} (Cool)\` : '0')}
                {activeSubTool === 'tint' && (filters.tint > 0 ? \`+\${filters.tint} (Magenta)\` : filters.tint < 0 ? \`\${filters.tint} (Green)\` : '0')}
                {activeSubTool === 'saturation' && \`\${filters.saturation}%\`}
                {activeSubTool === 'sepia' && \`\${filters.sepia}%\`}
                {activeSubTool === 'grayscale' && \`\${filters.grayscale}%\`}
                {activeSubTool === 'hueRotate' && \`\${filters.hueRotate}°\`}
                {activeSubTool === 'clarity' && (filters.clarity > 0 ? \`+\${filters.clarity}\` : \`\${filters.clarity}\`)}
                {activeSubTool === 'vignette' && (filters.vignette > 0 ? \`+\${filters.vignette} (White)\` : filters.vignette < 0 ? \`\${filters.vignette} (Dark)\` : '0')}
                {activeSubTool === 'grain' && \`\${filters.grain}%\`}
                {activeSubTool === 'sharpness' && \`+\${filters.sharpness}%\`}
                {activeSubTool === 'unsharp' && \`+\${filters.unsharp}%\`}
                {activeSubTool === 'blur' && \`\${filters.blur}px\`}
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
              onChange={e => setFilter(activeSubTool, Number(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>

      <div className="px-2 py-2 overflow-x-auto flex gap-1.5 no-scrollbar bg-slate-900/90 flex-shrink-0">
        
        {mainCategory === 'presets' && PRESETS.map(preset => {
          const isSelected = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => setPreset(preset.id, preset.filters)}
              className={\`flex-shrink-0 px-3.5 py-2 rounded-xl text-left border transition-all flex flex-col items-center justify-center min-w-[95px] \${
                isSelected 
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500' 
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
              }\`}
            >
              <span className="text-xs font-bold whitespace-nowrap">{preset.name}</span>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">{preset.desc}</span>
            </button>
          );
        })}

        {mainCategory === 'light' && (
          <>
            <button onClick={() => setActiveSubTool('exposure')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'exposure' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Sun size={14} className="text-yellow-400" />
              <span>Exposure</span>
            </button>
            <button onClick={() => setActiveSubTool('brightness')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'brightness' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Sun size={14} />
              <span>Brightness</span>
            </button>
            <button onClick={() => setActiveSubTool('contrast')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'contrast' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Contrast size={14} />
              <span>Contrast</span>
            </button>
            <button onClick={() => setActiveSubTool('highlights')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'highlights' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Sun size={14} className="text-amber-300" />
              <span>Highlights</span>
            </button>
            <button onClick={() => setActiveSubTool('shadows')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'shadows' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Layers size={14} className="text-blue-300" />
              <span>Shadows</span>
            </button>
            <button onClick={() => setActiveSubTool('whites')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'whites' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Sun size={14} className="text-white" />
              <span>Whites</span>
            </button>
            <button onClick={() => setActiveSubTool('blacks')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'blacks' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Layers size={14} className="text-slate-500" />
              <span>Blacks</span>
            </button>
          </>
        )}

        {mainCategory === 'color' && (
          <>
            <button onClick={() => setActiveSubTool('temp')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'temp' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Thermometer size={14} className="text-amber-400" />
              <span>Temp</span>
            </button>
            <button onClick={() => setActiveSubTool('tint')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'tint' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Palette size={14} className="text-pink-400" />
              <span>Tint</span>
            </button>
            <button onClick={() => setActiveSubTool('saturation')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'saturation' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Droplets size={14} />
              <span>Vibrance</span>
            </button>
            <button onClick={() => setActiveSubTool('sepia')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'sepia' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Sparkles size={14} />
              <span>Warmth</span>
            </button>
            <button onClick={() => setActiveSubTool('grayscale')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'grayscale' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <ImageIcon size={14} />
              <span>B&W</span>
            </button>
          </>
        )}

        {mainCategory === 'effects' && (
          <>
            <button onClick={() => setActiveSubTool('clarity')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'clarity' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Wand2 size={14} className="text-emerald-400" />
              <span>Clarity (Dehaze)</span>
            </button>
            <button onClick={() => setActiveSubTool('vignette')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'vignette' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Aperture size={14} className="text-purple-400" />
              <span>Vignette</span>
            </button>
            <button onClick={() => setActiveSubTool('grain')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'grain' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Film size={14} className="text-amber-300" />
              <span>Film Grain</span>
            </button>
          </>
        )}

        {mainCategory === 'detail' && (
          <>
            <button onClick={() => setActiveSubTool('sharpness')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'sharpness' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Focus size={14} className="text-emerald-400" />
              <span>Sharpness</span>
            </button>
            <button onClick={() => setActiveSubTool('unsharp')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'unsharp' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <Sparkles size={14} className="text-pink-400" />
              <span>Unsharp Mask</span>
            </button>
            <button onClick={() => setActiveSubTool('blur')} className={\`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all \${activeSubTool === 'blur' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
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
            <button onClick={() => toggleFlipH()} className={\`flex-shrink-0 px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 active:scale-95 \${flipH ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <FlipHorizontal size={14} />
              <span>Flip H</span>
            </button>
            <button onClick={() => toggleFlipV()} className={\`flex-shrink-0 px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 active:scale-95 \${flipV ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'}\`}>
              <FlipVertical size={14} />
              <span>Flip V</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdjustmentPanel;
