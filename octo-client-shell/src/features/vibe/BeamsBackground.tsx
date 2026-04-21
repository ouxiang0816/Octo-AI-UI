/**
 * BeamsBackground — light-mode beam collision animation for the Vibe Design empty state.
 * Adapted from aceternity-ui, using motion/react (framer-motion v11).
 */
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface BeamOptions {
  initialX?: number;
  translateX?: number;
  duration?: number;
  delay?: number;
  repeatDelay?: number;
  className?: string;
}

const BEAMS: BeamOptions[] = [
  { initialX: 80,   translateX: 80,   duration: 8,  repeatDelay: 4, delay: 0 },
  { initialX: 200,  translateX: 200,  duration: 5,  repeatDelay: 6, delay: 2 },
  { initialX: 340,  translateX: 340,  duration: 10, repeatDelay: 3, delay: 1, className: 'h-20' },
  { initialX: 480,  translateX: 480,  duration: 6,  repeatDelay: 5, delay: 3 },
  { initialX: 620,  translateX: 620,  duration: 9,  repeatDelay: 2, delay: 0, className: 'h-10' },
  { initialX: 760,  translateX: 760,  duration: 7,  repeatDelay: 4, delay: 4 },
  { initialX: 900,  translateX: 900,  duration: 4,  repeatDelay: 7, delay: 1, className: 'h-16' },
  { initialX: 1040, translateX: 1040, duration: 11, repeatDelay: 2, delay: 2 },
];

// ─── Explosion ──────────────────────────────────────────────────────────────────
const Explosion: React.FC<React.HTMLProps<HTMLDivElement>> = ({ style, className }) => {
  const particles = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    dx: Math.floor(Math.random() * 80 - 40),
    dy: Math.floor(Math.random() * -50 - 10),
  }));

  return (
    <div className={`absolute z-50 h-2 w-2 ${className ?? ''}`} style={style}>
      {/* horizontal glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute -inset-x-10 top-0 m-auto h-1.5 w-10 rounded-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent blur-sm"
      />
      {particles.map(p => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0 }}
          transition={{ duration: Math.random() * 1.2 + 0.5, ease: 'easeOut' }}
          className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-purple-400"
        />
      ))}
    </div>
  );
};

// ─── Single beam with collision detection ───────────────────────────────────────
const Beam: React.FC<{
  options: BeamOptions;
  containerRef: React.RefObject<HTMLDivElement>;
  parentRef: React.RefObject<HTMLDivElement>;
}> = ({ options, containerRef, parentRef }) => {
  const beamRef = useRef<HTMLDivElement>(null);
  const [beamKey, setBeamKey] = useState(0);
  const [collision, setCollision] = useState<{ x: number; y: number } | null>(null);
  const [detecting, setDetecting] = useState(true);

  useEffect(() => {
    if (!detecting) return;
    const id = setInterval(() => {
      if (!beamRef.current || !containerRef.current || !parentRef.current) return;
      const beamR = beamRef.current.getBoundingClientRect();
      const contR = containerRef.current.getBoundingClientRect();
      const parR  = parentRef.current.getBoundingClientRect();
      if (beamR.bottom >= contR.top) {
        setCollision({
          x: beamR.left - parR.left + beamR.width / 2,
          y: beamR.bottom - parR.top,
        });
        setDetecting(false);
      }
    }, 50);
    return () => clearInterval(id);
  }, [detecting, containerRef, parentRef]);

  useEffect(() => {
    if (!collision) return;
    const t1 = setTimeout(() => { setCollision(null); setDetecting(true); }, 2000);
    const t2 = setTimeout(() => setBeamKey(k => k + 1), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [collision]);

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        initial={{ translateY: '-200px', translateX: options.initialX ?? 0 }}
        animate={{ translateY: '1800px', translateX: options.translateX ?? 0 }}
        transition={{
          duration: options.duration ?? 8,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
          delay: options.delay ?? 0,
          repeatDelay: options.repeatDelay ?? 0,
        }}
        className={`absolute left-0 top-10 w-px rounded-full bg-gradient-to-t from-indigo-500 via-purple-400 to-transparent h-14 ${options.className ?? ''}`}
        style={{ opacity: 0.6 }}
      />
      <AnimatePresence>
        {collision && (
          <Explosion
            key={`${collision.x}-${collision.y}`}
            style={{ left: collision.x, top: collision.y, transform: 'translate(-50%,-50%)' }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Main export ───────────────────────────────────────────────────────────────
export const BeamsBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={parentRef}
      className="absolute inset-0 overflow-hidden bg-gradient-to-b from-white via-[#f8f9fb] to-[#f4f5f7]"
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Beams */}
      {BEAMS.map((b, i) => (
        <Beam key={i} options={b} containerRef={containerRef} parentRef={parentRef} />
      ))}

      {/* Content */}
      {children}

      {/* Bottom collision surface */}
      <div
        ref={containerRef}
        className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent pointer-events-none"
        style={{ boxShadow: '0 0 24px rgba(99,102,241,0.15), 0 16px 48px rgba(99,102,241,0.08)' }}
      />
    </div>
  );
};
