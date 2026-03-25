'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

// TwitchCon-style particle system
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      hue: number;
      alpha: number;
      life: number;
    }[] = [];

    // Create initial particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.5 - 0.2,
        size: Math.random() * 3 + 1,
        hue: Math.random() > 0.5 ? 0 : 180, // Red or Cyan
        alpha: Math.random() * 0.5 + 0.2,
        life: Math.random() * 100,
      });
    }

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Pulse effect
        const pulse = Math.sin(frame * 0.02 + p.life * 0.1) * 0.3 + 0.7;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.alpha * pulse})`;
        ctx.fill();

        // Draw glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.alpha * 0.2 * pulse})`;
        ctx.fill();

        // Wrap around
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      });

      // Draw connections between nearby particles
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      frame++;
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}

// Glitch text component
function GlitchTitle({ text }: { text: string }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10 text-white">{text}</span>
      <span 
        className="absolute inset-0 text-cyan-400 animate-glitch-1"
        style={{ clipPath: 'inset(20% 0 60% 0)', transform: 'translate(-3px)' }}
        aria-hidden="true"
      >
        {text}
      </span>
      <span 
        className="absolute inset-0 text-red-400 animate-glitch-2"
        style={{ clipPath: 'inset(60% 0 10% 0)', transform: 'translate(3px)' }}
        aria-hidden="true"
      >
        {text}
      </span>
    </span>
  );
}

// Light streak component
function LightStreaks() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
          style={{
            width: '30%',
            top: `${20 + i * 30}%`,
            left: '-30%',
          }}
          animate={{
            x: ['0vw', '150vw'],
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 4 + i * 2,
            delay: i * 1.5,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}

// Floating geometric shapes
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Hexagons */}
      <motion.div
        className="absolute w-32 h-32 border border-red-500/10"
        style={{ 
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          top: '10%',
          left: '5%'
        }}
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Diamond */}
      <motion.div
        className="absolute w-20 h-20 border border-cyan-500/10 rotate-45"
        style={{ top: '60%', right: '10%' }}
        animate={{ 
          y: [0, -20, 0],
          rotate: [45, 55, 45],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Circle ring */}
      <motion.div
        className="absolute w-40 h-40 rounded-full border border-purple-500/5"
        style={{ bottom: '20%', left: '15%' }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Triangle */}
      <motion.div
        className="absolute w-0 h-0"
        style={{
          borderLeft: '30px solid transparent',
          borderRight: '30px solid transparent',
          borderBottom: '52px solid rgba(239, 68, 68, 0.05)',
          top: '30%',
          right: '20%'
        }}
        animate={{ 
          rotate: [0, 180, 360],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function SplashScreen() {
  const { showSplash, setShowSplash } = useAppStore();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (showSplash) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1; // 1% per interval
        });
      }, 35); // 35ms * 100 = 3.5 detik, total ~4 detik

      // Phase transitions for staggered animations
      const phaseTimer = setTimeout(() => setPhase(1), 500);
      const phase2Timer = setTimeout(() => setPhase(2), 1000);
      const phase3Timer = setTimeout(() => setPhase(3), 1500);

      return () => {
        clearInterval(interval);
        clearTimeout(phaseTimer);
        clearTimeout(phase2Timer);
        clearTimeout(phase3Timer);
      };
    }
  }, [showSplash, setShowSplash]);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"
        >
          {/* Animated particle canvas */}
          <ParticleCanvas />
          
          {/* Light streaks */}
          <LightStreaks />
          
          {/* Floating geometric shapes */}
          <FloatingShapes />
          
          {/* Scanline effect */}
          <div className="absolute inset-0 scanline pointer-events-none" />

          {/* Grid overlay */}
          <div 
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(239, 68, 68, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(239, 68, 68, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />

          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Multiple rotating rings */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute w-32 h-32 rounded-full border-2 border-red-500/20"
              style={{ boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)' }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute w-40 h-40 rounded-full border border-cyan-500/10"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute w-48 h-48 rounded-full border border-purple-500/5"
            />

            {/* Pulsing glow behind logo */}
            <motion.div
              className="absolute w-32 h-32 rounded-2xl bg-red-500/20 blur-xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Logo */}
            <div className="relative w-24 h-24 mb-6">
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.1)',
                    '0 0 40px rgba(239, 68, 68, 0.8), inset 0 0 30px rgba(239, 68, 68, 0.2)',
                    '0 0 20px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.1)',
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-full h-full rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center relative overflow-hidden"
              >
                {/* Light sweep on logo */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  style={{ transform: 'skewX(-20deg)' }}
                />
                <motion.span 
                  className="text-4xl font-bold text-white relative z-10"
                  animate={{
                    textShadow: [
                      '0 0 10px rgba(255,255,255,0.5)',
                      '0 0 20px rgba(255,255,255,0.8)',
                      '0 0 10px rgba(255,255,255,0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  IDM
                </motion.span>
              </motion.div>
            </div>

            {/* Title with glitch effect */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold mb-2"
            >
              <GlitchTitle text="Idol Meta" />
            </motion.div>
            
            {/* Animated subtitle */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2"
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-red-300/70 text-sm tracking-wider uppercase">
                Fan Made Edition
              </span>
              <motion.span
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              />
            </motion.div>
          </motion.div>

          {/* Loading bar with glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-20 w-48 h-1 bg-slate-800 rounded-full overflow-hidden"
          >
            {/* Background glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' }}
            />
            
            {/* Progress bar */}
            <motion.div
              className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-400 relative"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            >
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-300 blur-sm"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </motion.div>
            
            {/* Scanning light */}
            <motion.div
              className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>

          {/* Loading text with typing effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-12 flex items-center gap-2"
          >
            <span className="text-xs text-slate-500">Loading</span>
            <span className="text-xs text-red-400 typing-cursor" />
          </motion.div>
          
          {/* Version tag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-4 text-[10px] text-slate-600"
          >
            v1.0.0
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
