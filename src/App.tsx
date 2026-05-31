import { useCallback, useEffect, useMemo, useState } from 'react';
import ControlPanel from './components/ControlPanel';
import TacticalPitch from './components/TacticalPitch';
import type { AppState, Line, Player } from './types';

const DEFAULT_LINE_COLOR = '#FFFFFF';
const DEFAULT_LINE_STYLE: AppState['lineStyle'] = 'solid';

export const createDefaultPlayers = (): Player[] => [
  { id: 'red-gk', name: 'Ramsdale', number: 1, team: 'red', x: 7, y: 50 },
  { id: 'red-lb', name: 'Tierney', number: 3, team: 'red', x: 22, y: 18 },
  { id: 'red-lcb', name: 'Gabriel', number: 6, team: 'red', x: 18, y: 39 },
  { id: 'red-rcb', name: 'Saliba', number: 2, team: 'red', x: 18, y: 61 },
  { id: 'red-rb', name: 'White', number: 4, team: 'red', x: 22, y: 82 },
  { id: 'red-lcm', name: 'Rice', number: 41, team: 'red', x: 40, y: 35 },
  { id: 'red-cm', name: 'Ødegaard', number: 8, team: 'red', x: 36, y: 50 },
  { id: 'red-rcm', name: 'Havertz', number: 29, team: 'red', x: 40, y: 65 },
  { id: 'red-lw', name: 'Martinelli', number: 11, team: 'red', x: 58, y: 18 },
  { id: 'red-st', name: 'Jesus', number: 9, team: 'red', x: 65, y: 50 },
  { id: 'red-rw', name: 'Saka', number: 7, team: 'red', x: 58, y: 82 },
  { id: 'blue-gk', name: 'Ederson', number: 31, team: 'blue', x: 93, y: 50 },
  { id: 'blue-lb', name: 'Aké', number: 6, team: 'blue', x: 78, y: 82 },
  { id: 'blue-lcb', name: 'Dias', number: 3, team: 'blue', x: 82, y: 61 },
  { id: 'blue-rcb', name: 'Stones', number: 5, team: 'blue', x: 82, y: 39 },
  { id: 'blue-rb', name: 'Walker', number: 2, team: 'blue', x: 78, y: 18 },
  { id: 'blue-lcm', name: 'Silva', number: 20, team: 'blue', x: 60, y: 65 },
  { id: 'blue-cm', name: 'Rodri', number: 16, team: 'blue', x: 64, y: 50 },
  { id: 'blue-rcm', name: 'De Bruyne', number: 17, team: 'blue', x: 60, y: 35 },
  { id: 'blue-lw', name: 'Foden', number: 47, team: 'blue', x: 42, y: 82 },
  { id: 'blue-st', name: 'Haaland', number: 9, team: 'blue', x: 35, y: 50 },
  { id: 'blue-rw', name: 'Doku', number: 11, team: 'blue', x: 42, y: 18 },
  { id: 'ball', name: 'Ball', number: 0, team: 'ball', x: 50, y: 50 },
];

const defaultState = (): AppState => ({
  players: createDefaultPlayers(),
  lines: [],
  currentMode: 'drag',
  lineColor: DEFAULT_LINE_COLOR,
  lineStyle: DEFAULT_LINE_STYLE,
});

type MinifiedPayload = {
  p?: Array<[string, string, number, Player['team'], number, number]>;
  l?: Array<[string, Array<[number, number]>, string, Line['style']]>;
};

const clampPercentage = (value: number): number => Math.min(100, Math.max(0, value));

const isTeam = (value: unknown): value is Player['team'] => value === 'red' || value === 'blue' || value === 'ball';
const isLineStyle = (value: unknown): value is Line['style'] => value === 'solid' || value === 'dashed';

const roundCoordinate = (value: number): number => Number(clampPercentage(value).toFixed(2));

const parsePlayers = (payload: MinifiedPayload): Player[] => {
  if (!Array.isArray(payload.p)) {
    return createDefaultPlayers();
  }

  const parsed = payload.p.reduce<Player[]>((players, item) => {
    if (!Array.isArray(item) || item.length !== 6) {
      return players;
    }

    const [id, name, number, team, x, y] = item;
    if (typeof id !== 'string' || typeof name !== 'string' || typeof number !== 'number' || !isTeam(team)) {
      return players;
    }

    players.push({ id, name, number, team, x: roundCoordinate(Number(x)), y: roundCoordinate(Number(y)) });
    return players;
  }, []);

  return parsed.length > 0 ? parsed : createDefaultPlayers();
};

const parseLines = (payload: MinifiedPayload): Line[] => {
  if (!Array.isArray(payload.l)) {
    return [];
  }

  return payload.l.reduce<Line[]>((lines, item) => {
    if (!Array.isArray(item) || item.length !== 4) {
      return lines;
    }

    const [id, points, color, style] = item;
    if (typeof id !== 'string' || !Array.isArray(points) || typeof color !== 'string' || !isLineStyle(style)) {
      return lines;
    }

    const parsedPoints = points.reduce<Line['points']>((acc, point) => {
      if (Array.isArray(point) && point.length === 2 && typeof point[0] === 'number' && typeof point[1] === 'number') {
        acc.push({ x: roundCoordinate(point[0]), y: roundCoordinate(point[1]) });
      }
      return acc;
    }, []);

    if (parsedPoints.length >= 2) {
      lines.push({ id, points: parsedPoints, color, style });
    }

    return lines;
  }, []);
};

const hydrateStateFromURL = (): AppState => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('playbook');

  if (!slug) {
    return defaultState();
  }

  try {
    const json = decodeURIComponent(atob(slug));
    const payload = JSON.parse(json) as MinifiedPayload;

    return {
      players: parsePlayers(payload),
      lines: parseLines(payload),
      currentMode: 'drag',
      lineColor: DEFAULT_LINE_COLOR,
      lineStyle: DEFAULT_LINE_STYLE,
    };
  } catch (error) {
    console.warn('Unable to hydrate playbook from URL.', error);
    return defaultState();
  }
};

function App() {
  const [state, setState] = useState<AppState>(() => defaultState());
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    setState(hydrateStateFromURL());
  }, []);

  const setMode = useCallback((currentMode: AppState['currentMode']) => {
    setState((currentState) => ({ ...currentState, currentMode }));
  }, []);

  const setLineColor = useCallback((lineColor: string) => {
    setState((currentState) => ({ ...currentState, lineColor }));
  }, []);

  const setLineStyle = useCallback((lineStyle: AppState['lineStyle']) => {
    setState((currentState) => ({ ...currentState, lineStyle }));
  }, []);

  const updatePlayer = useCallback((id: string, x: number, y: number) => {
    setState((currentState) => ({
      ...currentState,
      players: currentState.players.map((player) => (player.id === id ? { ...player, x, y } : player)),
    }));
  }, []);

  const addLine = useCallback((line: Line) => {
    setState((currentState) => ({ ...currentState, lines: [...currentState.lines, line] }));
  }, []);

  const clearLines = useCallback(() => {
    setState((currentState) => ({ ...currentState, lines: [] }));
  }, []);

  const resetField = useCallback(() => {
    setState((currentState) => ({ ...currentState, players: createDefaultPlayers(), lines: [] }));
  }, []);

  const generateShareLink = useCallback(async () => {
    const payload: MinifiedPayload = {
      p: state.players.map((player) => [player.id, player.name, player.number, player.team, roundCoordinate(player.x), roundCoordinate(player.y)]),
      l: state.lines.map((line) => [
        line.id,
        line.points.map((point) => [roundCoordinate(point.x), roundCoordinate(point.y)]),
        line.color,
        line.style,
      ]),
    };

    const jsonStr = JSON.stringify(payload);
    const slug = btoa(encodeURIComponent(jsonStr));
    const shareUrl = new URL(window.location.href);
    shareUrl.search = '';
    shareUrl.searchParams.set('playbook', slug);

    try {
      await navigator.clipboard.writeText(shareUrl.toString());
      setShareStatus('copied');
    } catch (error) {
      console.error('Unable to copy share link.', error);
      setShareStatus('error');
    }

    window.setTimeout(() => setShareStatus('idle'), 1800);
  }, [state.lines, state.players]);

  const controlPanelProps = useMemo(
    () => ({
      currentMode: state.currentMode,
      lineColor: state.lineColor,
      lineStyle: state.lineStyle,
      shareStatus,
      setMode,
      setLineColor,
      setLineStyle,
      clearLines,
      resetField,
      generateShareLink,
    }),
    [clearLines, generateShareLink, resetField, setLineColor, setLineStyle, setMode, shareStatus, state.currentMode, state.lineColor, state.lineStyle],
  );

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(204,255,0,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(0,229,255,0.12),transparent_32%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.45em] text-lime-300">Tactix</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Shareable Soccer Playbook Builder</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Move a full 4-3-3 setup, draw tactical runs with arrowheads, and copy the current board into a backend-free share link.
            </p>
          </div>
          <div className="rounded-2xl border border-lime-300/20 bg-lime-300/10 px-4 py-3 text-sm text-lime-100">
            Coordinates are normalized from 0–100 for identical playback on every screen.
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
          <ControlPanel {...controlPanelProps} />
          <TacticalPitch appState={state} onPlayerMove={updatePlayer} onLineComplete={addLine} />
        </section>
      </div>
    </main>
  );
}

export default App;
