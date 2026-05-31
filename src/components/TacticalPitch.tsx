import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppState, Coordinate, Line, Player } from '../types';

type TacticalPitchProps = {
  appState: AppState;
  onPlayerMove: (id: string, x: number, y: number) => void;
  onLineComplete: (line: Line) => void;
};

type DragState = {
  playerId: string;
  offsetX: number;
  offsetY: number;
  pointerId: number;
};

type CanvasSize = {
  width: number;
  height: number;
};

const PITCH_ASPECT_RATIO = 105 / 68;
const PLAYER_DIAMETER_PX = 42;
const clampPercentage = (value: number): number => Math.min(100, Math.max(0, value));
const normalizeCoordinate = (coordinate: Coordinate): Coordinate => ({ x: clampPercentage(coordinate.x), y: clampPercentage(coordinate.y) });

const getPlayerClassName = (team: Player['team']): string => {
  if (team === 'red') {
    return 'border-red-200 bg-gradient-to-br from-red-400 to-red-700 text-white shadow-red-950/60';
  }

  if (team === 'blue') {
    return 'border-cyan-100 bg-gradient-to-br from-sky-300 to-blue-700 text-white shadow-blue-950/60';
  }

  return 'border-white bg-gradient-to-br from-white via-zinc-200 to-zinc-500 text-slate-950 shadow-black/50';
};

const getNormalizedPoint = (event: PointerEvent | ReactPointerEvent, element: HTMLElement): Coordinate => {
  const rect = element.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  return normalizeCoordinate({ x, y });
};

const toPixelPoint = (point: Coordinate, size: CanvasSize): Coordinate => ({
  x: (point.x / 100) * size.width,
  y: (point.y / 100) * size.height,
});

const drawArrowHead = (context: CanvasRenderingContext2D, from: Coordinate, to: Coordinate, color: string): void => {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const spread = (120 * Math.PI) / 180;
  const arrowLength = 18;
  const firstWing = angle + Math.PI - spread / 2;
  const secondWing = angle + Math.PI + spread / 2;

  context.save();
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(to.x, to.y);
  context.lineTo(to.x + Math.cos(firstWing) * arrowLength, to.y + Math.sin(firstWing) * arrowLength);
  context.lineTo(to.x + Math.cos(secondWing) * arrowLength, to.y + Math.sin(secondWing) * arrowLength);
  context.closePath();
  context.fill();
  context.restore();
};

const drawPitch = (context: CanvasRenderingContext2D, size: CanvasSize): void => {
  const { width, height } = size;
  const lineColor = 'rgba(255,255,255,0.86)';
  const lineWidth = Math.max(2, width * 0.003);
  const goalDepth = width * 0.018;
  const penaltyBoxWidth = width * (16.5 / 105);
  const penaltyBoxHeight = height * (40.32 / 68);
  const sixYardWidth = width * (5.5 / 105);
  const sixYardHeight = height * (18.32 / 68);
  const goalHeight = height * (7.32 / 68);
  const centerCircleRadius = width * 0.0915;
  const penaltySpotDistance = width * (11 / 105);

  context.clearRect(0, 0, width, height);

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#116530');
  gradient.addColorStop(0.5, '#0a4d2a');
  gradient.addColorStop(1, '#06391f');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  for (let stripe = 0; stripe < 10; stripe += 1) {
    context.fillStyle = stripe % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.045)';
    context.fillRect((stripe / 10) * width, 0, width / 10, height);
  }

  context.save();
  context.strokeStyle = lineColor;
  context.lineWidth = lineWidth;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  context.strokeRect(lineWidth / 2, lineWidth / 2, width - lineWidth, height - lineWidth);

  context.beginPath();
  context.moveTo(width / 2, 0);
  context.lineTo(width / 2, height);
  context.stroke();

  context.beginPath();
  context.arc(width / 2, height / 2, centerCircleRadius, 0, Math.PI * 2);
  context.stroke();

  context.beginPath();
  context.arc(width / 2, height / 2, lineWidth * 1.2, 0, Math.PI * 2);
  context.fillStyle = lineColor;
  context.fill();

  const penaltyY = (height - penaltyBoxHeight) / 2;
  const sixYardY = (height - sixYardHeight) / 2;
  context.strokeRect(0, penaltyY, penaltyBoxWidth, penaltyBoxHeight);
  context.strokeRect(width - penaltyBoxWidth, penaltyY, penaltyBoxWidth, penaltyBoxHeight);
  context.strokeRect(0, sixYardY, sixYardWidth, sixYardHeight);
  context.strokeRect(width - sixYardWidth, sixYardY, sixYardWidth, sixYardHeight);

  context.beginPath();
  context.arc(penaltySpotDistance, height / 2, lineWidth * 1.2, 0, Math.PI * 2);
  context.arc(width - penaltySpotDistance, height / 2, lineWidth * 1.2, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.arc(penaltySpotDistance, height / 2, centerCircleRadius, -0.92, 0.92);
  context.stroke();
  context.beginPath();
  context.arc(width - penaltySpotDistance, height / 2, centerCircleRadius, Math.PI - 0.92, Math.PI + 0.92);
  context.stroke();

  context.strokeStyle = 'rgba(255,255,255,0.9)';
  context.lineWidth = lineWidth * 1.4;
  context.beginPath();
  context.moveTo(-goalDepth, height / 2 - goalHeight / 2);
  context.lineTo(0, height / 2 - goalHeight / 2);
  context.lineTo(0, height / 2 + goalHeight / 2);
  context.lineTo(-goalDepth, height / 2 + goalHeight / 2);
  context.stroke();

  context.beginPath();
  context.moveTo(width + goalDepth, height / 2 - goalHeight / 2);
  context.lineTo(width, height / 2 - goalHeight / 2);
  context.lineTo(width, height / 2 + goalHeight / 2);
  context.lineTo(width + goalDepth, height / 2 + goalHeight / 2);
  context.stroke();

  context.restore();
};

const drawStrategyLine = (context: CanvasRenderingContext2D, line: Line, size: CanvasSize): void => {
  if (line.points.length < 2) {
    return;
  }

  const pixelPoints = line.points.map((point) => toPixelPoint(point, size));

  context.save();
  context.strokeStyle = line.color;
  context.lineWidth = Math.max(3, size.width * 0.005);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.shadowColor = line.color;
  context.shadowBlur = 8;
  context.setLineDash(line.style === 'dashed' ? [14, 12] : []);

  context.beginPath();
  context.moveTo(pixelPoints[0].x, pixelPoints[0].y);
  for (let index = 1; index < pixelPoints.length; index += 1) {
    context.lineTo(pixelPoints[index].x, pixelPoints[index].y);
  }
  context.stroke();
  context.setLineDash([]);

  const end = pixelPoints[pixelPoints.length - 1];
  const previous = pixelPoints[pixelPoints.length - 2];
  drawArrowHead(context, previous, end, line.color);
  context.restore();
};

function TacticalPitch({ appState, onPlayerMove, onLineComplete }: TacticalPitchProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pitchRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 800, height: 800 / PITCH_ASPECT_RATIO });
  const [activeLine, setActiveLine] = useState<Line | null>(null);

  const renderedLines = useMemo(() => (activeLine ? [...appState.lines, activeLine] : appState.lines), [activeLine, appState.lines]);

  useEffect(() => {
    const pitchElement = pitchRef.current;
    if (!pitchElement) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry || entry.contentRect.width <= 0) {
        return;
      }

      const width = entry.contentRect.width;
      setCanvasSize({ width, height: width / PITCH_ASPECT_RATIO });
    });

    resizeObserver.observe(pitchElement);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvasSize.width * pixelRatio);
    canvas.height = Math.round(canvasSize.height * pixelRatio);
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    drawPitch(context, canvasSize);
    renderedLines.forEach((line) => drawStrategyLine(context, line, canvasSize));
  }, [canvasSize, renderedLines]);

  const handlePlayerPointerDown = useCallback(
    (player: Player, event: ReactPointerEvent<HTMLButtonElement>) => {
      if (appState.currentMode !== 'drag' || !pitchRef.current) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const point = getNormalizedPoint(event, pitchRef.current);
      dragRef.current = {
        playerId: player.id,
        offsetX: point.x - player.x,
        offsetY: point.y - player.y,
        pointerId: event.pointerId,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [appState.currentMode],
  );

  const handlePlayerPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const dragState = dragRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId || !pitchRef.current) {
        return;
      }

      event.preventDefault();
      const point = getNormalizedPoint(event, pitchRef.current);
      onPlayerMove(dragState.playerId, clampPercentage(point.x - dragState.offsetX), clampPercentage(point.y - dragState.offsetY));
    },
    [onPlayerMove],
  );

  const endPlayerDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      dragRef.current = null;
    }
  }, []);

  const handleDrawPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (appState.currentMode !== 'draw' || !pitchRef.current) {
        return;
      }

      event.preventDefault();
      const start = getNormalizedPoint(event, pitchRef.current);
      const line: Line = {
        id: `line-${Date.now()}-${Math.round(event.clientX)}-${Math.round(event.clientY)}`,
        points: [start],
        color: appState.lineColor,
        style: appState.lineStyle,
      };
      setActiveLine(line);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [appState.currentMode, appState.lineColor, appState.lineStyle],
  );

  const handleDrawPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (appState.currentMode !== 'draw' || !pitchRef.current) {
        return;
      }

      event.preventDefault();
      const nextPoint = getNormalizedPoint(event, pitchRef.current);

      setActiveLine((currentLine) => {
        if (!currentLine) {
          return currentLine;
        }

        const lastPoint = currentLine.points[currentLine.points.length - 1];
        const lastPixel = toPixelPoint(lastPoint, canvasSize);
        const nextPixel = toPixelPoint(nextPoint, canvasSize);
        const distance = Math.hypot(nextPixel.x - lastPixel.x, nextPixel.y - lastPixel.y);

        if (distance <= 3) {
          return currentLine;
        }

        return { ...currentLine, points: [...currentLine.points, nextPoint] };
      });
    },
    [appState.currentMode, canvasSize],
  );

  const finishDrawing = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (appState.currentMode !== 'draw') {
        return;
      }

      const endPoint = pitchRef.current ? getNormalizedPoint(event, pitchRef.current) : null;

      setActiveLine((currentLine) => {
        if (!currentLine) {
          return null;
        }

        const lastPoint = currentLine.points[currentLine.points.length - 1];
        const completedPoints = endPoint
          ? (() => {
              const lastPixel = toPixelPoint(lastPoint, canvasSize);
              const endPixel = toPixelPoint(endPoint, canvasSize);
              return Math.hypot(endPixel.x - lastPixel.x, endPixel.y - lastPixel.y) > 3 ? [...currentLine.points, endPoint] : currentLine.points;
            })()
          : currentLine.points;
        const completedLine = { ...currentLine, points: completedPoints };

        if (completedLine.points.length >= 2) {
          onLineComplete(completedLine);
        }
        return null;
      });

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [appState.currentMode, canvasSize, onLineComplete],
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black tracking-tight">Tactical Pitch</h2>
          <p className="text-sm text-slate-400">{appState.currentMode === 'drag' ? 'Drag player markers to reshape the phase.' : 'Draw runs directly on the pitch.'}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-300">
          {appState.players.length} assets · {appState.lines.length} lines
        </div>
      </div>

      <div className="mx-auto w-full max-w-[800px]">
        <div
          ref={pitchRef}
          className={`relative w-full touch-none overflow-visible rounded-2xl border border-white/20 shadow-2xl ${
            appState.currentMode === 'draw' ? 'cursor-crosshair' : 'cursor-default'
          }`}
          style={{ aspectRatio: `${PITCH_ASPECT_RATIO}` }}
          onPointerDown={handleDrawPointerDown}
          onPointerMove={handleDrawPointerMove}
          onPointerUp={finishDrawing}
          onPointerCancel={finishDrawing}
          onPointerLeave={finishDrawing}
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full rounded-2xl" aria-label="Soccer pitch strategy canvas" />

          <div className="absolute inset-0">
            {appState.players.map((player) => {
              const isBall = player.team === 'ball';
              return (
                <button
                  key={player.id}
                  type="button"
                  aria-label={`${player.name} ${isBall ? '' : `number ${player.number}`}`}
                  title={player.name}
                  onPointerDown={(event) => handlePlayerPointerDown(player, event)}
                  onPointerMove={handlePlayerPointerMove}
                  onPointerUp={endPlayerDrag}
                  onPointerCancel={endPlayerDrag}
                  className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 select-none items-center justify-center rounded-full border-2 text-sm font-black shadow-xl transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-lime-300/50 ${
                    appState.currentMode === 'draw' ? 'pointer-events-none' : 'pointer-events-auto'
                  } ${getPlayerClassName(player.team)}`}
                  style={{
                    left: `${player.x}%`,
                    top: `${player.y}%`,
                    width: isBall ? PLAYER_DIAMETER_PX * 0.72 : PLAYER_DIAMETER_PX,
                    height: isBall ? PLAYER_DIAMETER_PX * 0.72 : PLAYER_DIAMETER_PX,
                  }}
                >
                  {isBall ? '●' : player.number}
                  {!isBall && (
                    <span className="pointer-events-none absolute top-full mt-1 max-w-24 truncate rounded-full bg-slate-950/85 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
                      {player.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TacticalPitch;
