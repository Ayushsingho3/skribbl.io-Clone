import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Eraser,
  Paintbrush,
  RotateCcw,
  Trash2,
  Download
} from 'lucide-react';
import { DrawStroke, StrokePoint } from '../types/game';

// 22 Classic Skribbl colors
export const COLOR_PALETTE = [
  '#000000', '#7f7f7f', '#ffffff', '#880015', '#ed1c24', '#ff7f27',
  '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#b97a57',
  '#464646', '#c3c3c3', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7',
  '#ffaec9', '#ffc90e', '#0ed145', '#1e90ff'
];

export const BRUSH_SIZES = [
  { label: 'Fine', size: 4 },
  { label: 'Medium', size: 8 },
  { label: 'Bold', size: 16 },
  { label: 'Jumbo', size: 28 },
];

interface CanvasBoardProps {
  isDrawer: boolean;
  drawerName?: string | null;
  onStrokeComplete: (stroke: DrawStroke) => void;
  onUndo: () => void;
  onClear: () => void;
  externalStrokes?: DrawStroke[];
  latestStroke?: DrawStroke | null;
  clearTrigger?: number;
  undoTrigger?: number;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  isDrawer,
  drawerName,
  onStrokeComplete,
  onUndo,
  onClear,
  externalStrokes = [],
  latestStroke = null,
  clearTrigger = 0,
  undoTrigger = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeColor, setActiveColor] = useState<string>('#000000');
  const [activeSize, setActiveSize] = useState<number>(8);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Store all drawn strokes locally for redraws
  const strokesRef = useRef<DrawStroke[]>([]);
  const currentPointsRef = useRef<StrokePoint[]>([]);

  // Redraw all strokes on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background to clean white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw all strokes
    strokesRef.current.forEach(stroke => {
      if (stroke.points.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.isEraser ? '#ffffff' : stroke.color;
      ctx.lineWidth = stroke.size * (width / 800); // Scale relative to base 800px width
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        const pt = stroke.points[0];
        const px = pt.x * width;
        const py = pt.y * height;
        ctx.arc(px, py, (stroke.size * (width / 800)) / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.isEraser ? '#ffffff' : stroke.color;
        ctx.fill();
        return;
      }

      const first = stroke.points[0];
      ctx.moveTo(first.x * width, first.y * height);

      for (let i = 1; i < stroke.points.length; i++) {
        const p1 = stroke.points[i - 1];
        const p2 = stroke.points[i];
        const midX = ((p1.x + p2.x) / 2) * width;
        const midY = ((p1.y + p2.y) / 2) * height;
        ctx.quadraticCurveTo(p1.x * width, p1.y * height, midX, midY);
      }
      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last.x * width, last.y * height);
      ctx.stroke();
    });
  }, []);

  // Update canvas pixel resolution matching parent container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Aspect ratio 16:10 or 4:3
    const displayWidth = Math.floor(rect.width);
    const displayHeight = Math.floor(rect.height);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      redrawCanvas();
    }
  }, [redrawCanvas]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Sync external full stroke history (e.g. on join or round reset)
  useEffect(() => {
    strokesRef.current = [...externalStrokes];
    redrawCanvas();
  }, [externalStrokes, redrawCanvas]);

  // Sync latest single stroke from other drawer
  useEffect(() => {
    if (latestStroke && !isDrawer) {
      strokesRef.current.push(latestStroke);
      redrawCanvas();
    }
  }, [latestStroke, isDrawer, redrawCanvas]);

  // Handle external clear
  useEffect(() => {
    if (clearTrigger > 0) {
      strokesRef.current = [];
      redrawCanvas();
    }
  }, [clearTrigger, redrawCanvas]);

  // Handle external undo
  useEffect(() => {
    if (undoTrigger > 0) {
      strokesRef.current.pop();
      redrawCanvas();
    }
  }, [undoTrigger, redrawCanvas]);

  // Coordinate helper: converts mouse/touch event into normalized 0-1 coordinates
  const getNormalizedPoint = (e: React.MouseEvent | React.TouchEvent): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    return { x, y };
  };

  // Draw current live stroke on top of canvas without full redraw
  const drawSegment = (p1: StrokePoint, p2: StrokePoint, color: string, size: number, eraser: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.beginPath();
    ctx.strokeStyle = eraser ? '#ffffff' : color;
    ctx.lineWidth = size * (width / 800);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    e.preventDefault();

    const pt = getNormalizedPoint(e);
    if (!pt) return;

    setIsDrawing(true);
    currentPointsRef.current = [pt];

    // Single point draw
    drawSegment(pt, pt, activeColor, activeSize, isEraser);
  };

  const drawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDrawing) return;
    e.preventDefault();

    const pt = getNormalizedPoint(e);
    if (!pt) return;

    const points = currentPointsRef.current;
    const lastPt = points[points.length - 1];

    if (lastPt) {
      drawSegment(lastPt, pt, activeColor, activeSize, isEraser);
    }
    points.push(pt);
  };

  const stopDrawing = () => {
    if (!isDrawer || !isDrawing) return;
    setIsDrawing(false);

    const points = currentPointsRef.current;
    if (points.length > 0) {
      const stroke: DrawStroke = {
        id: `stroke-${Date.now()}-${Math.random()}`,
        color: activeColor,
        size: activeSize,
        isEraser,
        points: [...points]
      };

      strokesRef.current.push(stroke);
      onStrokeComplete(stroke);
    }
    currentPointsRef.current = [];
  };

  const handleLocalUndo = () => {
    if (!isDrawer) return;
    strokesRef.current.pop();
    redrawCanvas();
    onUndo();
  };

  const handleLocalClear = () => {
    if (!isDrawer) return;
    strokesRef.current = [];
    redrawCanvas();
    onClear();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `skribbl-drawing-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl p-2 md:p-3 border-2 border-slate-700/50 shadow-2xl backdrop-blur-md">
      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full bg-white rounded-xl overflow-hidden shadow-inner cursor-crosshair min-h-[320px] md:min-h-[420px]"
        onMouseDown={startDrawing}
        onMouseMove={drawMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={drawMove}
        onTouchEnd={stopDrawing}
      >
        <canvas
          ref={canvasRef}
          data-testid="drawing-canvas"
          className="w-full h-full block touch-none"
        />

        {/* Overlay indicator for guessers */}
        {!isDrawer && (
          <div className="pointer-events-none absolute top-3 left-3 bg-slate-900/80 text-white text-xs md:text-sm px-3 py-1.5 rounded-full font-medium backdrop-blur-sm shadow flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{drawerName ? `${drawerName} is drawing...` : 'Waiting for drawer...'}</span>
          </div>
        )}
      </div>

      {/* Drawer Control Toolbar */}
      {isDrawer ? (
        <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
          {/* Tool toggles */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setIsEraser(false)}
              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
                !isEraser ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
              title="Pen Tool"
            >
              <Paintbrush className="w-4 h-4" />
              <span className="hidden sm:inline">Pen</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEraser(true)}
              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
                isEraser ? 'bg-amber-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
              title="Eraser Tool"
            >
              <Eraser className="w-4 h-4" />
              <span className="hidden sm:inline">Eraser</span>
            </button>
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1.5 rounded-xl border border-slate-700">
            {BRUSH_SIZES.map(b => (
              <button
                key={b.size}
                type="button"
                onClick={() => setActiveSize(b.size)}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  activeSize === b.size ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'
                }`}
                title={`${b.label} Brush (${b.size}px)`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: Math.max(6, b.size * 0.8), height: Math.max(6, b.size * 0.8) }}
                />
              </button>
            ))}
          </div>

          {/* Color Palette Grid */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 max-w-[280px] sm:max-w-none">
            {COLOR_PALETTE.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setActiveColor(color);
                  setIsEraser(false);
                }}
                className={`w-5 h-5 rounded-md transition-transform hover:scale-125 border ${
                  activeColor === color && !isEraser
                    ? 'ring-2 ring-white scale-110 z-10'
                    : 'border-black/30'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Action buttons (Undo, Clear, Save) */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={handleLocalUndo}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
              title="Undo Last Stroke"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleLocalClear}
              className="p-2 text-rose-400 hover:text-rose-200 hover:bg-rose-900/40 rounded-lg transition"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-900/40 rounded-lg transition"
              title="Download Snapshot"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Guessing mode active — Submit guesses in the chat box on the right!</span>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 hover:text-white transition px-2 py-1 rounded bg-slate-800/60 border border-slate-700"
            title="Download drawing"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      )}
    </div>
  );
};
