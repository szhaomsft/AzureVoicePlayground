import React, { useEffect, useRef } from 'react';

interface VoiceActivityAnimationProps {
  micVolume: number; // 0-1 range
  ttsVolume: number; // 0-1 range
  isActive: boolean;
}

export function VoiceActivityAnimation({ micVolume, ttsVolume, isActive }: VoiceActivityAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const size = Math.min(canvas.parentElement?.clientWidth || 200, 200);
      canvas.width = size;
      canvas.height = size;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) / 4;

    let currentMicRadius = baseRadius * 0.5;
    let currentTtsRadius = baseRadius * 1.2;
    const smoothingFactor = 0.15;

    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isActive) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Smooth transitions
      const targetMicRadius = baseRadius * (0.5 + micVolume * 0.5);
      const targetTtsRadius = baseRadius * (1.2 + ttsVolume * 0.3);

      currentMicRadius += (targetMicRadius - currentMicRadius) * smoothingFactor;
      currentTtsRadius += (targetTtsRadius - currentTtsRadius) * smoothingFactor;

      // Ensure outer circle is always bigger than inner
      if (currentTtsRadius < currentMicRadius + 10) {
        currentTtsRadius = currentMicRadius + 10;
      }

      // Draw outer circle (TTS) - gradient from purple to blue
      const outerGradient = ctx.createRadialGradient(
        centerX, centerY, currentTtsRadius * 0.3,
        centerX, centerY, currentTtsRadius
      );
      outerGradient.addColorStop(0, 'rgba(147, 51, 234, 0.4)'); // Purple center
      outerGradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');  // Blue edge

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentTtsRadius, 0, Math.PI * 2);
      ctx.fillStyle = outerGradient;
      ctx.fill();

      // Add outer glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(147, 51, 234, 0.5)';
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw inner circle (Mic) - gradient from green to cyan
      const innerGradient = ctx.createRadialGradient(
        centerX, centerY, currentMicRadius * 0.3,
        centerX, centerY, currentMicRadius
      );
      innerGradient.addColorStop(0, 'rgba(34, 197, 94, 0.6)');   // Green center
      innerGradient.addColorStop(1, 'rgba(6, 182, 212, 0.3)');   // Cyan edge

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentMicRadius, 0, Math.PI * 2);
      ctx.fillStyle = innerGradient;
      ctx.fill();

      // Add inner glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(34, 197, 94, 0.6)';
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [micVolume, ttsVolume, isActive]);

  return (
    <div className="flex items-center justify-center w-full h-48">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
      />
    </div>
  );
}
