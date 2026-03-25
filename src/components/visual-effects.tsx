'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================
// PARTICLE EFFECTS - TwitchCon Style
// ============================================

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  hue: number;
  life: number;
  maxLife: number;
}

export function ParticleField({ 
  count = 50, 
  className,
  color = 'cyan',
  speed = 1 
}: { 
  count?: number; 
  className?: string;
  color?: 'cyan' | 'purple' | 'red' | 'green' | 'mixed';
  speed?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const mouseRef = useRef({ x: 0, y: 0 });

  const getHue = useMemo(() => {
    switch (color) {
      case 'cyan': return 180;
      case 'purple': return 280;
      case 'red': return 0;
      case 'green': return 150;
      case 'mixed': return () => Math.random() * 360;
      default: return 180;
    }
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const hueValue = typeof getHue === 'function' ? getHue() : getHue;
    particlesRef.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5 * speed,
      speedY: (Math.random() - 0.5) * 0.5 * speed - 0.2 * speed,
      opacity: Math.random() * 0.5 + 0.2,
      hue: typeof getHue === 'function' ? Math.random() * 360 : hueValue,
      life: 0,
      maxLife: Math.random() * 200 + 100,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.life++;
        
        // Mouse attraction
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200) {
          p.speedX += (dx / dist) * 0.02;
          p.speedY += (dy / dist) * 0.02;
        }

        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Pulse opacity based on life
        const lifeRatio = p.life / p.maxLife;
        const opacity = p.opacity * (1 - Math.abs(lifeRatio - 0.5) * 2) * Math.sin(lifeRatio * Math.PI);

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${opacity})`;
        ctx.fill();

        // Draw glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${opacity * 0.2})`;
        ctx.fill();

        // Reset particle if life exceeded
        if (p.life >= p.maxLife) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 10;
          p.life = 0;
          p.speedX = (Math.random() - 0.5) * 0.5 * speed;
          p.speedY = (Math.random() - 0.5) * 0.5 * speed - 0.2 * speed;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [count, getHue, speed]);

  return (
    <canvas 
      ref={canvasRef} 
      className={cn("fixed inset-0 pointer-events-none z-0", className)}
      aria-hidden="true"
    />
  );
}

// ============================================
// FLOATING ELEMENTS
// ============================================

export function FloatingElements({ 
  children,
  intensity = 1 
}: { 
  children: React.ReactNode;
  intensity?: number;
}) {
  return (
    <div className="relative">
      {children}
      {/* Floating geometric shapes */}
      <motion.div
        className="absolute -top-20 -right-20 w-40 h-40 border border-cyan-500/10 rotate-45"
        animate={{ 
          y: [0, 20, 0],
          rotate: [45, 55, 45],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transform: `scale(${intensity})` }}
      />
      <motion.div
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full border border-purple-500/10"
        animate={{ 
          y: [0, -15, 0],
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.15, 0.1]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute top-1/2 -right-5 w-2 h-20 bg-gradient-to-b from-cyan-500/20 to-transparent"
        animate={{ 
          scaleY: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
    </div>
  );
}

// ============================================
// PARALLAX SCROLLING WRAPPER
// ============================================

export function ParallaxSection({ 
  children, 
  offset = 50,
  className 
}: { 
  children: React.ReactNode;
  offset?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  return (
    <motion.div 
      ref={ref} 
      style={{ y: springY }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// STAGGERED TEXT REVEAL
// ============================================

export function StaggeredText({ 
  text, 
  className,
  delay = 0,
  once = true
}: { 
  text: string;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-50px" });
  
  const words = text.split(' ');

  return (
    <div ref={ref} className={cn("flex flex-wrap gap-x-2", className)}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 20, rotateX: -90 }}
          animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.1,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

// ============================================
// GLITCH TEXT EFFECT
// ============================================

export function GlitchText({ 
  text, 
  className,
  intensity = 'medium'
}: { 
  text: string;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}) {
  const intensityValues = {
    low: { clipOffset: 2, duration: 4 },
    medium: { clipOffset: 5, duration: 2 },
    high: { clipOffset: 8, duration: 0.5 }
  };
  
  const { clipOffset } = intensityValues[intensity];

  return (
    <span className={cn("relative inline-block", className)}>
      <span className="relative z-10">{text}</span>
      
      {/* Glitch layers */}
      <span 
        className="absolute inset-0 text-cyan-400 animate-glitch-1"
        style={{ 
          clipPath: `inset(${clipOffset}px 0 ${clipOffset}px 0)`,
          transform: `translate(-${clipOffset}px)`
        }}
        aria-hidden="true"
      >
        {text}
      </span>
      <span 
        className="absolute inset-0 text-red-400 animate-glitch-2"
        style={{ 
          clipPath: `inset(${clipOffset * 3}px 0 ${clipOffset}px 0)`,
          transform: `translate(${clipOffset}px)`
        }}
        aria-hidden="true"
      >
        {text}
      </span>
    </span>
  );
}

// ============================================
// MOUSE FOLLOWING GLOW
// ============================================

export function MouseGlow({ 
  size = 400,
  color = 'cyan',
  opacity = 0.15,
  className
}: { 
  size?: number;
  color?: 'cyan' | 'purple' | 'red' | 'green';
  opacity?: number;
  className?: string;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const colorMap = {
    cyan: 'rgba(34, 211, 238,',
    purple: 'rgba(168, 85, 247,',
    red: 'rgba(239, 68, 68,',
    green: 'rgba(16, 185, 129,'
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <motion.div
      className={cn(
        "fixed pointer-events-none z-50 rounded-full blur-3xl transition-opacity duration-300",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${colorMap[color]} ${opacity}) 0%, transparent 70%)`,
        transform: 'translate(-50%, -50%)',
        left: position.x,
        top: position.y,
        opacity: isVisible ? 1 : 0,
      }}
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}

// ============================================
// LIGHT SWEEP EFFECT
// ============================================

export function LightSweep({ 
  children,
  color = 'white',
  duration = 3,
  className
}: { 
  children: React.ReactNode;
  color?: 'white' | 'cyan' | 'gold';
  duration?: number;
  className?: string;
}) {
  const colorMap = {
    white: 'rgba(255, 255, 255, 0.3)',
    cyan: 'rgba(34, 211, 238, 0.3)',
    gold: 'rgba(251, 191, 36, 0.3)'
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${colorMap[color]}, transparent)`,
          width: '50%',
        }}
        animate={{
          x: ['-200%', '300%']
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 5
        }}
      />
    </div>
  );
}

// ============================================
// SECTION REVEAL ANIMATION
// ============================================

export function SectionReveal({ 
  children,
  direction = 'up',
  delay = 0,
  className
}: { 
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const directionMap = {
    up: { y: 60, x: 0 },
    down: { y: -60, x: 0 },
    left: { y: 0, x: 60 },
    right: { y: 0, x: -60 },
    fade: { y: 0, x: 0 }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ 
        opacity: 0, 
        ...directionMap[direction],
        scale: direction === 'fade' ? 0.95 : 1
      }}
      animate={isInView ? { 
        opacity: 1, 
        y: 0, 
        x: 0,
        scale: 1
      } : {}}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// STREAK EFFECT (Trailing lines)
// ============================================

export function StreakEffect({ 
  count = 5,
  color = 'cyan',
  className
}: { 
  count?: number;
  color?: 'cyan' | 'purple' | 'red';
  className?: string;
}) {
  const colorMap = {
    cyan: 'from-cyan-500/50 to-transparent',
    purple: 'from-purple-500/50 to-transparent',
    red: 'from-red-500/50 to-transparent'
  };

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute h-px bg-gradient-to-r",
            colorMap[color]
          )}
          style={{
            width: `${Math.random() * 200 + 100}px`,
            top: `${Math.random() * 100}%`,
            left: '-200px',
          }}
          animate={{
            x: ['0vw', '150vw'],
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: Math.random() * 2 + 1,
            repeat: Infinity,
            repeatDelay: Math.random() * 5 + 2,
            delay: Math.random() * 5,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// CYBER GRID BACKGROUND
// ============================================

export function CyberGrid({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {/* Grid lines */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "linear-gradient(rgba(34, 211, 238, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)"
        }}
      />
      {/* Horizontal lines */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(34, 211, 238, 0.03) 1px, transparent 1px)",
          backgroundSize: "100% 60px",
          maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)"
        }}
      />
      {/* Glow spots */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl"
        animate={{
          x: ['0%', '100%', '0%'],
          y: ['0%', '100%', '0%'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full bg-purple-500/5 blur-3xl"
        animate={{
          x: ['100%', '0%', '100%'],
          y: ['0%', '100%', '0%'],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 5 }}
      />
    </div>
  );
}

// ============================================
// PULSE RING EFFECT
// ============================================

export function PulseRing({ 
  size = 100,
  color = 'cyan',
  className
}: { 
  size?: number;
  color?: 'cyan' | 'purple' | 'red';
  className?: string;
}) {
  const colorMap = {
    cyan: 'border-cyan-500',
    purple: 'border-purple-500',
    red: 'border-red-500'
  };

  return (
    <div className={cn("relative", className)}>
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          className={cn("absolute rounded-full border", colorMap[color])}
          style={{
            width: size,
            height: size,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [1, 2],
            opacity: [0.5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// ANIMATED GRADIENT TEXT
// ============================================

export function AnimatedGradientText({ 
  text,
  from = 'cyan',
  via = 'purple',
  to = 'pink',
  className
}: { 
  text: string;
  from?: string;
  via?: string;
  to?: string;
  className?: string;
}) {
  // Map color names to actual Tailwind classes (required for Tailwind purging)
  const colorClasses: Record<string, string> = {
    'cyan': 'from-cyan-400',
    'purple': 'from-purple-400', 
    'pink': 'from-pink-400',
    'red': 'from-red-400',
    'emerald': 'from-emerald-400',
  };
  
  const viaClasses: Record<string, string> = {
    'cyan': 'via-cyan-400',
    'purple': 'via-purple-400',
    'pink': 'via-pink-400',
    'red': 'via-red-400',
    'emerald': 'via-emerald-400',
  };
  
  const toClasses: Record<string, string> = {
    'cyan': 'to-cyan-400',
    'purple': 'to-purple-400',
    'pink': 'to-pink-400',
    'red': 'to-red-400',
    'emerald': 'to-emerald-400',
  };

  return (
    <motion.span
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r",
        colorClasses[from] || 'from-cyan-400',
        viaClasses[via] || 'via-purple-400',
        toClasses[to] || 'to-pink-400',
        className
      )}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "linear"
      }}
      style={{
        backgroundSize: '200% 200%'
      }}
    >
      {text}
    </motion.span>
  );
}

// ============================================
// MORPHING BLOB BACKGROUND
// ============================================

export function MorphingBlob({ 
  color = 'cyan',
  size = 300,
  className
}: { 
  color?: 'cyan' | 'purple' | 'red' | 'mixed';
  size?: number;
  className?: string;
}) {
  const colors = {
    cyan: 'bg-cyan-500/20',
    purple: 'bg-purple-500/20',
    red: 'bg-red-500/20',
    mixed: 'bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20'
  };

  return (
    <motion.div
      className={cn("absolute rounded-full blur-3xl", colors[color], className)}
      style={{ width: size, height: size }}
      animate={{
        scale: [1, 1.2, 1],
        borderRadius: ['50%', '40% 60% 60% 40%', '50%'],
        rotate: [0, 180, 360]
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}
