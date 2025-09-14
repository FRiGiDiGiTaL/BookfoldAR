import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface ParticleEffectsProps {
  triggerAlignment?: boolean;
  containerWidth: number;
  containerHeight: number;
  alignmentPoint?: { x: number; y: number };
}

export const ParticleEffects: React.FC<ParticleEffectsProps> = ({
  triggerAlignment = false,
  containerWidth,
  containerHeight,
  alignmentPoint = { x: containerWidth / 2, y: containerHeight / 2 }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Create particles at alignment point
  const createAlignmentParticles = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    const particleCount = 12;
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const velocity = 2 + Math.random() * 3;
      
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        maxLife: 1,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    return newParticles;
  };

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      // Update particle
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity
      particle.life -= 0.016; // ~60fps decay

      // Draw particle
      if (particle.life > 0) {
        const alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      return particle.life > 0;
    });

    ctx.globalAlpha = 1;
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Trigger particles on alignment
  useEffect(() => {
    if (triggerAlignment && alignmentPoint) {
      const newParticles = createAlignmentParticles(alignmentPoint.x, alignmentPoint.y);
      particlesRef.current = [...particlesRef.current, ...newParticles];
    }
  }, [triggerAlignment, alignmentPoint]);

  // Start animation
  useEffect(() => {
    animate();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={containerWidth}
      height={containerHeight}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: containerWidth, height: containerHeight }}
    />
  );
};