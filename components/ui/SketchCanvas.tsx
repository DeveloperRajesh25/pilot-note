'use client';

import React, { useRef, useEffect, useState } from 'react';

export function SketchCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sceneIndex, setSceneIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let startTime: number;
    const duration = 8000; // 8 seconds per scene

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    window.addEventListener('resize', resize);
    resize();

    // --- Drawing Helpers ---
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    
    const drawPathProgressive = (points: [number, number][], progress: number) => {
      if (progress <= 0 || points.length < 2) return;
      const totalLen: number[] = [0];
      let cumLen = 0;
      for (let i = 1; i < points.length; i++) {
        const dx = points[i][0] - points[i - 1][0];
        const dy = points[i][1] - points[i - 1][1];
        cumLen += Math.sqrt(dx * dx + dy * dy);
        totalLen.push(cumLen);
      }
      const targetLen = cumLen * Math.min(1, progress);
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        if (totalLen[i - 1] >= targetLen) break;
        if (totalLen[i] <= targetLen) {
          ctx.lineTo(points[i][0], points[i][1]);
        } else {
          const frac = (targetLen - totalLen[i - 1]) / (totalLen[i] - totalLen[i - 1]);
          ctx.lineTo(points[i - 1][0] + (points[i][0] - points[i - 1][0]) * frac, points[i - 1][1] + (points[i][1] - points[i - 1][1]) * frac);
          break;
        }
      }
      ctx.stroke();
    };

    const bezierPoints = (p0: [number, number], cp1: [number, number], cp2: [number, number], p3: [number, number], n: number): [number, number][] => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const inv = 1 - t;
        pts.push([
          inv**3 * p0[0] + 3 * inv**2 * t * cp1[0] + 3 * inv * t**2 * cp2[0] + t**3 * p3[0],
          inv**3 * p0[1] + 3 * inv**2 * t * cp1[1] + 3 * inv * t**2 * cp2[1] + t**3 * p3[1]
        ]);
      }
      return pts;
    };

    const drawArrow = (x1: number, y1: number, x2: number, y2: number, progress: number) => {
      const p = Math.min(1, progress);
      const ex = x1 + (x2 - x1) * p;
      const ey = y1 + (y2 - y1) * p;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      if (p > 0.8) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 8 * Math.cos(angle - 0.4), ey - 8 * Math.sin(angle - 0.4));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 8 * Math.cos(angle + 0.4), ey - 8 * Math.sin(angle + 0.4));
        ctx.stroke();
      }
    };

    const drawCessna = (cx: number, cy: number, s: number, p: number) => {
      const ep = easeOutCubic(p);
      ctx.strokeStyle = '#2a2a3e';
      ctx.lineWidth = 2 * s;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Simple fuselage
      const fuseL = bezierPoints([cx, cy - 80 * s], [cx - 20 * s, cy - 40 * s], [cx - 20 * s, cy + 40 * s], [cx, cy + 80 * s], 20);
      drawPathProgressive(fuseL, ep);
      const fuseR = bezierPoints([cx, cy - 80 * s], [cx + 20 * s, cy - 40 * s], [cx + 20 * s, cy + 40 * s], [cx, cy + 80 * s], 20);
      drawPathProgressive(fuseR, ep);

      // Wings
      if (p > 0.3) {
        const wp = (p - 0.3) / 0.7;
        ctx.beginPath();
        const wLen = 150 * s;
        ctx.moveTo(cx - 20 * s, cy - 10 * s);
        ctx.lineTo(cx - 20 * s - wLen * wp, cy - 10 * s);
        ctx.moveTo(cx + 20 * s, cy - 10 * s);
        ctx.lineTo(cx + 20 * s + wLen * wp, cy - 10 * s);
        ctx.stroke();
      }
    };

    // --- Scenes ---
    const render = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = (elapsed % duration) / duration;
      const currentScene = Math.floor(elapsed / duration) % 2;
      setSceneIndex(currentScene);

      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const s = Math.min(w, h) / 400;

      if (currentScene === 0) {
        // Scene 1: Forces
        drawCessna(cx, cy, s, Math.min(1, progress * 1.5));
        if (progress > 0.6) {
          ctx.strokeStyle = '#3b82f6';
          drawArrow(cx, cy - 100 * s, cx, cy - 180 * s, (progress - 0.6) * 2.5);
          ctx.strokeStyle = '#ef4444';
          drawArrow(cx, cy + 100 * s, cx, cy + 180 * s, (progress - 0.6) * 2.5);
        }
      } else {
        // Scene 2: Airfoil (simplified)
        ctx.strokeStyle = '#2a2a3e';
        ctx.lineWidth = 3;
        const pts = bezierPoints([cx - 100 * s, cy], [cx - 50 * s, cy - 60 * s], [cx + 50 * s, cy - 40 * s], [cx + 100 * s, cy], 30);
        drawPathProgressive(pts, progress * 1.5);
        const pts2 = bezierPoints([cx - 100 * s, cy], [cx - 50 * s, cy + 10 * s], [cx + 50 * s, cy + 5 * s], [cx + 100 * s, cy], 30);
        drawPathProgressive(pts2, progress * 1.5);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="w-full h-full relative group">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      <div className="absolute top-6 left-6 pointer-events-none">
        <span className="px-3 py-1 bg-violet/10 text-violet text-[10px] font-black uppercase tracking-widest rounded-full">
          {sceneIndex === 0 ? 'How Wings Create Lift' : 'Aerodynamics: Airfoil Profile'}
        </span>
      </div>
    </div>
  );
}
