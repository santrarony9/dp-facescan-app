import React from 'react';
import { 
  X, Undo2, Redo2, Eye, Download, 
  Sparkles, Scissors, Sun, Palette, Wand2, Focus, Compass 
} from 'lucide-react';
import useEditorStore from '../../stores/useEditorStore';

const EditorToolbar = ({ onClose, onSave }) => {
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    isComparing,
    setIsComparing,
    saving,
    mainCategory,
    setMainCategory,
    setActiveSubTool
  } = useEditorStore();

  return (
    <div className="flex flex-col flex-shrink-0 z-20 shadow-lg">
      <div className="h-12 px-2 sm:px-4 bg-slate-900/95 border-b border-slate-800/80 flex items-center justify-between backdrop-blur-md">
        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-all flex items-center gap-1.5 text-xs font-semibold"
          title="Cancel and Exit"
        >
          <X size={18} />
          <span className="hidden sm:inline">Cancel</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={\`p-2 rounded-xl transition-all \${
              canUndo() ? 'text-slate-200 hover:bg-slate-800 active:scale-95' : 'text-slate-600 opacity-40 cursor-not-allowed'
            }\`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>

          <button
            onClick={redo}
            disabled={!canRedo()}
            className={\`p-2 rounded-xl transition-all \${
              canRedo() ? 'text-slate-200 hover:bg-slate-800 active:scale-95' : 'text-slate-600 opacity-40 cursor-not-allowed'
            }\`}
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
            className={\`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 \${
              isComparing 
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95'
            }\`}
            title="Press and hold to compare with original"
          >
            <Eye size={14} />
            <span className="text-[11px]">{isComparing ? 'Original' : 'Compare'}</span>
          </button>
        </div>

        <button 
          onClick={onSave}
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
      
      <div className="grid grid-cols-7 border-b border-slate-800/80 bg-slate-950 py-0.5 px-0.5">
        <button onClick={() => setMainCategory('presets')} className={\`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all \${mainCategory === 'presets' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}\`}>
          <Sparkles size={14} />
          <span className="text-[8px] sm:text-[9px]">Looks</span>
        </button>
        <button onClick={() => setMainCategory('cutout')} className={\`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all \${mainCategory === 'cutout' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}\`}>
          <Scissors size={14} />
          <span className="text-[8px] sm:text-[9px]">Cutout</span>
        </button>
        <button onClick={() => { setMainCategory('light'); setActiveSubTool('exposure'); }} className={\`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all \${mainCategory === 'light' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}\`}>
          <Sun size={14} />
          <span className="text-[8px] sm:text-[9px]">Light</span>
        </button>
        <button onClick={() => { setMainCategory('color'); setActiveSubTool('temp'); }} className={\`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all \${mainCategory === 'color' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}\`}>
          <Palette size={14} />
          <span className="text-[8px] sm:text-[9px]">Color</span>
        </button>
        <button onClick={() => { setMainCategory('effects'); setActiveSubTool('clarity'); }} className={\`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all \${mainCategory === 'effects' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}\`}>
          <Wand2 size={14} />
          <span className="text-[8px] sm:text-[9px]">Effects</span>
        </button>
        <button onClick={() => { setMainCategory('detail'); setActiveSubTool('sharpness'); }} className={\`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all \${mainCategory === 'detail' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}\`}>
          <Focus size={14} />
          <span className="text-[8px] sm:text-[9px]">Detail</span>
        </button>
        <button onClick={() => setMainCategory('rotate')} className={\`py-2 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-all \${mainCategory === 'rotate' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'}\`}>
          <Compass size={14} />
          <span className="text-[8px] sm:text-[9px]">Rotate</span>
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;
