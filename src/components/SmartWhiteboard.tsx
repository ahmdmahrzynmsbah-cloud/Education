import React, { useEffect, useRef, useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, getDocs } from 'firebase/firestore';
import { PenTool, Highlighter, Eraser, Move, ZoomIn, ZoomOut, Trash2, X, Download } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id?: string;
  points: Point[];
  color: string;
  size: number;
  tool: 'pen' | 'highlighter' | 'eraser';
}

interface SmartWhiteboardProps {
  streamId: string;
  isTeacher: boolean;
  onClose: () => void;
}

export default function SmartWhiteboard({ streamId, isTeacher, onClose }: SmartWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  
  // Viewport state for Pan/Zoom
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  // Tools state
  const [activeTool, setActiveTool] = useState<'pen' | 'highlighter' | 'eraser' | 'pan'>('pen');
  const [color, setColor] = useState('#00B4D8');
  const [size, setSize] = useState(4);
  
  // Drawing state
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const currentStroke = useRef<Point[]>([]);
  const lastPanPoint = useRef<Point | null>(null);

  // Fetch strokes
  useEffect(() => {
    const q = query(
      collection(db, 'live_streams', streamId, 'whiteboard_strokes'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedStrokes = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Stroke[];
      setStrokes(fetchedStrokes);
    });
    
    return () => unsubscribe();
  }, [streamId]);

  const drawStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    const renderStroke = (points: Point[], strokeColor: string, strokeSize: number, tool: string) => {
      if (points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        // Smooth curve could be implemented here with bezier, but simple line is faster
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        if (tool === 'highlighter') {
          ctx.globalAlpha = 0.4;
        } else {
          ctx.globalAlpha = 1.0;
        }
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
    };

    // Draw all saved strokes
    strokes.forEach(stroke => {
      renderStroke(stroke.points, stroke.color, stroke.size, stroke.tool);
    });

    // Draw current active stroke
    if (isDrawing.current && currentStroke.current.length > 0) {
      renderStroke(currentStroke.current, color, size, activeTool);
    }

    ctx.restore();
  }, [strokes, offset, scale, color, size, activeTool]);

  useEffect(() => {
    drawStrokes();
  }, [drawStrokes]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        drawStrokes();
      }
    };
    
    let observer: ResizeObserver;
    if (containerRef.current) {
      observer = new ResizeObserver(() => {
        handleResize();
      });
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [drawStrokes]);

  // Pointer Events
  const getPointerPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'pan' || (!isTeacher && e.pointerType !== 'mouse')) {
      isPanning.current = true;
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
    if (!isTeacher) return;
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDrawing.current = true;
    currentStroke.current = [getPointerPos(e)];
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning.current && lastPanPoint.current) {
      const dx = e.clientX - lastPanPoint.current.x;
      const dy = e.clientY - lastPanPoint.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isDrawing.current || !isTeacher) return;
    currentStroke.current.push(getPointerPos(e));
    
    // Request animation frame to draw immediately for smooth feedback
    requestAnimationFrame(drawStrokes);
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    isPanning.current = false;
    lastPanPoint.current = null;
    
    if (!isDrawing.current || !isTeacher) return;
    isDrawing.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (currentStroke.current.length > 1) {
      const newStroke = {
        points: currentStroke.current,
        color,
        size,
        tool: activeTool as any,
        createdAt: new Date().toISOString()
      };
      
      // Optimistic update
      setStrokes(prev => [...prev, newStroke]);
      currentStroke.current = [];
      
      // Save to firestore
      try {
        await addDoc(collection(db, 'live_streams', streamId, 'whiteboard_strokes'), newStroke);
      } catch (err) {
        console.error("Failed to save stroke", err);
      }
    } else {
      currentStroke.current = [];
      drawStrokes();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      // Zoom
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, scale * (1 + delta)), 5);
      
      // Zoom towards mouse position
      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);
      const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);
      
      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
    } else {
      // Pan
      setOffset(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const handleClear = async () => {
    if (!window.confirm("هل أنت متأكد من مسح الصبورة؟")) return;
    try {
      const q = collection(db, 'live_streams', streamId, 'whiteboard_strokes');
      const snap = await getDocs(q);
      const batch = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(batch);
      setStrokes([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary canvas with white background for downloading
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tCtx = tempCanvas.getContext('2d');
    if (tCtx) {
      tCtx.fillStyle = '#FFFFFF';
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tCtx.drawImage(canvas, 0, 0);
      const dataUrl = tempCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `whiteboard-${new Date().getTime()}.png`;
      a.click();
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#F8FAFC] dark:bg-[#0D0D12] overflow-hidden flex flex-col rounded-3xl" ref={containerRef}>
      
      {/* Toolbar */}
      {isTeacher && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white dark:bg-[#1E1E2F] shadow-lg rounded-2xl p-2 flex items-center gap-2 border border-gray-100 dark:border-gray-800">
          
          <button
            onClick={() => setActiveTool('pen')}
            className={`p-2 rounded-xl transition-all ${activeTool === 'pen' ? 'bg-[#00B4D8]/10 text-[#00B4D8]' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title="قلم"
          >
            <PenTool className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTool('highlighter')}
            className={`p-2 rounded-xl transition-all ${activeTool === 'highlighter' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title="قلم تمييز"
          >
            <Highlighter className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-2 rounded-xl transition-all ${activeTool === 'eraser' ? 'bg-red-500/10 text-red-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title="ممحاة"
          >
            <Eraser className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
          
          {activeTool !== 'eraser' && (
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
              title="اللون"
            />
          )}
          
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="bg-gray-50 dark:bg-[#1A1A26] rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 p-2 outline-none"
          >
            <option value="2">رفيع</option>
            <option value="4">متوسط</option>
            <option value="8">عريض</option>
            <option value="16">عريض جداً</option>
            <option value="32">عملاق</option>
          </select>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          <button
            onClick={() => setActiveTool('pan')}
            className={`p-2 rounded-xl transition-all ${activeTool === 'pan' ? 'bg-indigo-500/10 text-indigo-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title="تحريك (Pan)"
          >
            <Move className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => { setScale(1); setOffset({x:0, y:0}); }}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-xs font-bold"
            title="إعادة الضبط"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={handleClear}
            className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            title="مسح الصبورة بالكامل"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            title="حفظ الصبورة كصورة"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all bg-red-50 dark:bg-red-500/10 !text-red-500 ml-2"
            title="إغلاق الصبورة"
          >
            <X className="w-5 h-5" />
          </button>
          
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerOut={handlePointerUp}
        onWheel={handleWheel}
        className={`w-full h-full touch-none ${activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : isTeacher ? 'cursor-crosshair' : 'cursor-default'}`}
        style={{ touchAction: 'none' }}
      />
      
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: `${20 * scale}px ${20 * scale}px`, backgroundPosition: `${offset.x}px ${offset.y}px` }}></div>
    </div>
  );
}
