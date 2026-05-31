import type { AppState } from '../types';

type ControlPanelProps = {
  currentMode: AppState['currentMode'];
  lineColor: string;
  lineStyle: AppState['lineStyle'];
  shareStatus: 'idle' | 'copied' | 'error';
  setMode: (mode: AppState['currentMode']) => void;
  setLineColor: (color: string) => void;
  setLineStyle: (style: AppState['lineStyle']) => void;
  clearLines: () => void;
  resetField: () => void;
  generateShareLink: () => Promise<void>;
};

const colors = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Neon Yellow', value: '#CCFF00' },
  { name: 'Light Blue', value: '#00E5FF' },
  { name: 'Crimson', value: '#FF3B30' },
];

function ControlPanel({
  currentMode,
  lineColor,
  lineStyle,
  shareStatus,
  setMode,
  setLineColor,
  setLineStyle,
  clearLines,
  resetField,
  generateShareLink,
}: ControlPanelProps) {
  return (
    <aside className="rounded-3xl border border-white/10 bg-slate-900/85 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:sticky lg:top-5">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight">Control Center</h2>
          <p className="mt-1 text-sm text-slate-400">Build, annotate, and share a tactical phase.</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-lime-300 text-center text-2xl font-black leading-[3rem] text-slate-950 shadow-glow">T</div>
      </div>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Mode</p>
          <h3 className="mt-1 font-bold">Interaction Mode</h3>
        </div>
        <div className="grid grid-cols-2 rounded-2xl bg-slate-950/80 p-1">
          <button
            type="button"
            onClick={() => setMode('drag')}
            className={`rounded-xl px-3 py-3 text-sm font-bold transition ${
              currentMode === 'drag' ? 'bg-lime-300 text-slate-950 shadow-glow' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Move Players
          </button>
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`rounded-xl px-3 py-3 text-sm font-bold transition ${
              currentMode === 'draw' ? 'bg-lime-300 text-slate-950 shadow-glow' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Draw Strategy
          </button>
        </div>
      </section>

      <section className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Pen</p>
          <h3 className="mt-1 font-bold">Line Customizer</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              aria-label={`Use ${color.name} line color`}
              onClick={() => setLineColor(color.value)}
              className={`h-10 w-10 rounded-full border-2 transition hover:scale-105 ${
                lineColor === color.value ? 'border-white ring-4 ring-lime-300/30' : 'border-white/20'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setLineStyle('solid')}
            className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
              lineStyle === 'solid' ? 'border-lime-300 bg-lime-300/15 text-lime-100' : 'border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            Solid
          </button>
          <button
            type="button"
            onClick={() => setLineStyle('dashed')}
            className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
              lineStyle === 'dashed' ? 'border-lime-300 bg-lime-300/15 text-lime-100' : 'border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            Dashed
          </button>
        </div>
      </section>

      <section className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Actions</p>
          <h3 className="mt-1 font-bold">Canvas Management</h3>
        </div>
        <button
          type="button"
          onClick={clearLines}
          className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-100 transition hover:border-cyan-300/60 hover:bg-slate-700"
        >
          Clear Lines
        </button>
        <button
          type="button"
          onClick={resetField}
          className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-100 transition hover:border-red-300/60 hover:bg-slate-700"
        >
          Reset Field
        </button>
      </section>

      <section className="mt-4 rounded-2xl border border-lime-300/20 bg-lime-300/10 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-200">Share</p>
        <h3 className="mt-1 font-bold text-lime-50">URL State Engine</h3>
        <p className="mt-2 text-sm leading-6 text-lime-100/80">Serializes player coordinates and drawings into a URL-safe payload with no backend dependency.</p>
        <div className="relative mt-4">
          <button
            type="button"
            onClick={() => void generateShareLink()}
            className="w-full rounded-2xl bg-lime-300 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-glow transition hover:-translate-y-0.5 hover:bg-lime-200 active:translate-y-0"
          >
            Generate Share Link
          </button>
          <div
            className={`pointer-events-none absolute inset-x-8 -top-11 rounded-full px-3 py-2 text-center text-sm font-bold transition ${
              shareStatus === 'idle' ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100'
            } ${shareStatus === 'copied' ? 'bg-lime-300 text-slate-950' : 'bg-red-500 text-white'}`}
          >
            {shareStatus === 'copied' ? 'Link Copied!' : 'Copy blocked by browser'}
          </div>
        </div>
      </section>
    </aside>
  );
}

export default ControlPanel;
