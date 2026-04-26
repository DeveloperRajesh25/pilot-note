"use client";

import React, { useRef, useEffect } from 'react';

export const SketchCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number, dpr: number;
    let animationFrameId: number;
    let startTime: number | null = null;
    const currentScene = 0;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize);

    function drawPathProgressive(points: number[][], progress: number) {
      if (!ctx || progress <= 0 || points.length < 2) return;
      const totalLen: number[] = [];
      let cumLen = 0;
      totalLen.push(0);
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
          const segLen = totalLen[i] - totalLen[i - 1];
          const frac = (targetLen - totalLen[i - 1]) / segLen;
          const x = points[i - 1][0] + (points[i][0] - points[i - 1][0]) * frac;
          const y = points[i - 1][1] + (points[i][1] - points[i - 1][1]) * frac;
          ctx.lineTo(x, y);
          break;
        }
      }
      ctx.stroke();
    }

    function bezierPoints(p0: number[], cp1: number[], cp2: number[], p3: number[], n: number) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const inv = 1 - t;
        const x = inv * inv * inv * p0[0] + 3 * inv * inv * t * cp1[0] + 3 * inv * t * t * cp2[0] + t * t * t * p3[0];
        const y = inv * inv * inv * p0[1] + 3 * inv * inv * t * cp1[1] + 3 * inv * t * t * cp2[1] + t * t * t * p3[1];
        pts.push([x, y]);
      }
      return pts;
    }

    function drawArrow(x1: number, y1: number, x2: number, y2: number, progress: number, headSize: number) {
      if (!ctx || progress <= 0) return;
      const p = Math.min(1, progress);
      const ex = x1 + (x2 - x1) * p;
      const ey = y1 + (y2 - y1) * p;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      if (p > 0.85) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const sz = headSize || 8;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - sz * Math.cos(angle - 0.4), ey - sz * Math.sin(angle - 0.4));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - sz * Math.cos(angle + 0.4), ey - sz * Math.sin(angle + 0.4));
        ctx.stroke();
      }
    }

    function drawText(text: string, x: number, y: number, size: number, color?: string, align?: CanvasTextAlign, weight?: string) {
      if (!ctx) return;
      ctx.save();
      ctx.font = (weight || '600') + ' ' + size + 'px "Outfit","Inter",sans-serif';
      ctx.fillStyle = color || '#2a2a3e';
      ctx.textAlign = align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
      ctx.restore();
    }

    function drawCessna(cx: number, cy: number, s: number, p: number) {
      if (!ctx) return;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#2a2a3e';
      ctx.lineWidth = 1.8 * s;

      // Simplifed Cessna drawing for brevity, matching the core logic
      // Cowl & Spinner
      if (p > 0.05) {
        const cp = Math.min(1, (p - 0.05) / 0.15);
        const spinner = bezierPoints([cx - 6 * s, cy - 148 * s], [cx - 4 * s, cy - 155 * s], [cx + 4 * s, cy - 155 * s], [cx + 6 * s, cy - 148 * s], 10);
        drawPathProgressive(spinner, cp);
      }

      // Wings
      if (p > 0.2) {
        const wp = Math.min(1, (p - 0.2) / 0.3);
        const wingL = bezierPoints([cx - 26 * s, cy - 88 * s], [cx - 100 * s, cy - 90 * s], [cx - 150 * s, cy - 92 * s], [cx - 155 * s, cy - 94 * s], 20);
        drawPathProgressive(wingL, wp);
        const wingR = bezierPoints([cx + 26 * s, cy - 88 * s], [cx + 100 * s, cy - 90 * s], [cx + 150 * s, cy - 92 * s], [cx + 155 * s, cy - 94 * s], 20);
        drawPathProgressive(wingR, wp);
      }

      // Fuselage
      if (p > 0.4) {
        const fp = Math.min(1, (p - 0.4) / 0.4);
        const fuseL = bezierPoints([cx - 16 * s, cy - 120 * s], [cx - 26 * s, cy - 80 * s], [cx - 26 * s, cy - 40 * s], [cx - 8 * s, cy + 80 * s], 20);
        drawPathProgressive(fuseL, fp);
        const fuseR = bezierPoints([cx + 16 * s, cy - 120 * s], [cx + 26 * s, cy - 80 * s], [cx + 26 * s, cy - 40 * s], [cx + 8 * s, cy + 80 * s], 20);
        drawPathProgressive(fuseR, fp);
      }
    }

    const scenes = [
      (progress: number) => {
        const cx = W * 0.5;
        const cy = H * 0.5;
        const s = Math.min(W, H) / 450;
        
        drawText('Forces of Flight', cx, H * 0.1, W * 0.04, '#1a1a2e');
        drawCessna(cx, cy, s, Math.min(1, progress * 1.2));

        if (progress > 0.6) {
          const ap = Math.min(1, (progress - 0.6) / 0.3);
          ctx.strokeStyle = '#3b82f6';
          drawArrow(cx, cy - 100 * s, cx, cy - 180 * s, ap, 10);
          drawText('THRUST', cx, cy - 195 * s, W * 0.025, '#3b82f6');
        }
      }
    ];

    function animate(time: number) {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = (elapsed % 5000) / 5000;
      
      ctx!.clearRect(0, 0, W, H);
      scenes[currentScene](progress);

      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full h-full bg-[#f8f7f4] rounded-xl overflow-hidden shadow-inner">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
