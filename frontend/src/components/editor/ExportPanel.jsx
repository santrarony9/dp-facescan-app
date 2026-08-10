import React, { forwardRef, useImperativeHandle } from 'react';
import { Check, Download } from 'lucide-react';
import useEditorStore from '../../stores/useEditorStore';

const ExportPanel = forwardRef(({ onClose, renderCanvas }, ref) => {
  const {
    bgMode,
    exportPreviewUrl,
    setExportPreviewUrl,
    setSaving,
  } = useEditorStore();

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

        const fileName = \`dreamline-enhanced-\${Date.now()}.\${fileExt}\`;
        const blobUrl = URL.createObjectURL(blob);

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
              console.log('Share dismissed by user');
            }
          }
        }

        setExportPreviewUrl(blobUrl);
        setSaving(false);
      }, mimeType, isTransparent ? undefined : 0.92);

    } catch (e) {
      console.error('Error saving image:', e);
      alert('Export failed. Please try again.');
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave
  }));

  if (!exportPreviewUrl) return null;

  return (
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

        <div className={\`w-full max-h-56 overflow-hidden rounded-xl bg-black mb-4 border border-slate-800 \${bgMode === 'transparent' ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px]' : ''}\`}>
          <img src={exportPreviewUrl} alt="Exported Photo" className="w-full h-full object-contain" />
        </div>

        <div className="flex gap-2.5 w-full">
          <a
            href={exportPreviewUrl}
            download={\`dreamline-enhanced.\${bgMode === 'transparent' ? 'png' : 'jpg'}\`}
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
  );
});

export default ExportPanel;
