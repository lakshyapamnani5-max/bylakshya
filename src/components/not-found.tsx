import { useEffect } from 'react';
import { ArrowUpRight, Layers } from 'lucide-react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { useCms } from '../context/CmsContext';
import { updatePageSeo } from '../utils/seo';

interface NotFoundProps {
  onNavigate?: (path: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundProps) {
  const { settings } = useCms();
  const shouldReduceMotion = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 120, damping: 18, mass: 0.5 });
  const smoothY = useSpring(pointerY, { stiffness: 120, damping: 18, mass: 0.5 });

  const tiltX = useTransform(smoothY, [-1, 1], [3, -3]);
  const tiltY = useTransform(smoothX, [-1, 1], [-4, 4]);
  const shiftX = useTransform(smoothX, [-1, 1], [-6, 6]);
  const shiftY = useTransform(smoothY, [-1, 1], [-5, 5]);

  useEffect(() => {
    updatePageSeo({
      title: `404 — Stop exploring | ${settings.siteName || 'Lakshya'}`,
      description:
        "You've wandered somewhere that doesn't exist. Head back home or explore Lakshya's AI skills library.",
      noIndex: true,
    });
  }, [settings.siteName]);

  const handleGo = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
      return;
    }
    window.location.href = path;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    pointerX.set(Math.max(-1, Math.min(1, nx)));
    pointerY.set(Math.max(-1, Math.min(1, ny)));
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <main
      data-testid="custom-404-page"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative overflow-x-clip bg-[#F5F5FA] text-[#18264F]"
    >
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-16 sm:pt-12 sm:pb-20 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-8 items-center">
          {/* Top-Left on Desktop / First on Mobile: 404 Kicker + Headline + Copy */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 lg:self-end text-center lg:text-left space-y-4"
          >
            <p className="font-mono tabular-nums text-base sm:text-lg font-semibold tracking-wider text-[#F57C00]">
              404
            </p>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#18264F] leading-[1.08] tracking-tight text-balance">
              Stop exploring,{' '}
              <span className="relative inline-block text-[#E86314]">
                bitch.
                <svg
                  aria-hidden="true"
                  viewBox="0 0 180 20"
                  fill="none"
                  className="absolute -bottom-2 left-0 w-full h-3.5 overflow-visible pointer-events-none"
                >
                  <motion.path
                    d="M3 12C42 4 114 3 176 11"
                    stroke="#F57C00"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.65, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <motion.path
                    d="M28 16C75 11 124 12 158 16"
                    stroke="#F2A77F"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#18264F]/80 leading-relaxed max-w-lg mx-auto lg:mx-0 pt-2">
              You&apos;ve wandered somewhere that doesn&apos;t exist. Even I don&apos;t know what
              you&apos;re looking for.
            </p>
          </motion.div>

          {/* Right on Desktop (spanning rows) / Lower Middle on Mobile: Avatar Stage */}
          <div className="lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:row-span-2 flex justify-center lg:justify-end">
            <div className="relative w-[300px] h-[300px] sm:w-[370px] sm:h-[370px] lg:w-[430px] lg:h-[430px] flex items-center justify-center select-none">
              {/* Oversized translucent 404 behind the avatar */}
              <motion.div
                aria-hidden="true"
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-x-0 -top-9 sm:-top-12 lg:-top-14 flex justify-center pointer-events-none"
              >
                <span className="font-display font-bold tabular-nums text-[6.75rem] sm:text-[9rem] lg:text-[10.25rem] leading-none tracking-tight text-[#304A96]/[0.11]">
                  404
                </span>
              </motion.div>

              {/* Soft floating orange pill shape behind top-right */}
              <motion.div
                aria-hidden="true"
                animate={
                  shouldReduceMotion
                    ? undefined
                    : { y: [0, -7, 0], rotate: [12, 16, 12] }
                }
                transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-6 right-5 sm:top-8 sm:right-6 w-14 h-7 rounded-full bg-[#F2A77F]/55 pointer-events-none"
              />

              {/* Soft floating lavender pebble behind bottom-left */}
              <motion.div
                aria-hidden="true"
                animate={
                  shouldReduceMotion
                    ? undefined
                    : { y: [0, 6, 0], rotate: [-14, -10, -14] }
                }
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-8 left-4 sm:bottom-10 sm:left-5 w-11 h-11 rounded-2xl bg-[#A5A0F5]/30 pointer-events-none"
              />

              {/* Self-drawing hand-drawn curved doodles & tiny stars */}
              <svg
                aria-hidden="true"
                viewBox="0 0 440 440"
                fill="none"
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              >
                {/* Outer dashed lavender arc */}
                <motion.path
                  d="M 52 215 A 168 168 0 0 1 255 52"
                  stroke="#A5A0F5"
                  strokeOpacity="0.6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="8 10"
                  initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
                />

                {/* Warm orange swoosh arc near bottom-left STOP hand */}
                <motion.path
                  d="M 42 292 C 28 242 42 184 74 142"
                  stroke="#F57C00"
                  strokeWidth="5"
                  strokeLinecap="round"
                  initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Navy hand-drawn squiggle bottom-right */}
                <motion.path
                  d="M 332 372 Q 368 354 388 320"
                  stroke="#304A96"
                  strokeOpacity="0.45"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.75, delay: 0.35, ease: 'easeOut' }}
                />

                {/* Tiny hand-drawn star top-left */}
                <motion.path
                  d="M 64 98 L 69 111 L 82 116 L 69 121 L 64 134 L 59 121 L 46 116 L 59 111 Z"
                  fill="#F57C00"
                  fillOpacity="0.85"
                  initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Tiny doodle sparkle right */}
                <motion.path
                  d="M 392 182 L 395 190 L 403 193 L 395 196 L 392 204 L 389 196 L 381 193 L 389 190 Z"
                  fill="#A5A0F5"
                  initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>

              {/* Playful miniature cursor doodle hovering near bottom-right edge */}
              <motion.svg
                aria-hidden="true"
                viewBox="0 0 36 36"
                fill="none"
                animate={
                  shouldReduceMotion
                    ? undefined
                    : { y: [0, -5, 0], x: [0, 3, 0], rotate: [-6, 0, -6] }
                }
                transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-5 right-6 sm:bottom-6 sm:right-8 z-20 w-8 h-8 drop-shadow-xs pointer-events-none"
              >
                <path
                  d="M7 5L28 15.5L18.5 18.8L15 28.5L7 5Z"
                  fill="#FFFFFF"
                  stroke="#18264F"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </motion.svg>

              {/* Supplied Cartoon STOP Avatar Portrait */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                style={
                  shouldReduceMotion
                    ? undefined
                    : {
                        rotateX: tiltX,
                        rotateY: tiltY,
                        x: shiftX,
                        y: shiftY,
                        transformPerspective: 900,
                      }
                }
                className="relative z-10 w-[84%] h-[84%] flex items-center justify-center"
              >
                <motion.div
                  animate={shouldReduceMotion ? undefined : { y: [0, -6, 0] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-full h-full rounded-full bg-[#EAECFB] border-4 border-white shadow-[0_24px_60px_-15px_rgba(24,38,79,0.16)] overflow-hidden flex items-center justify-center p-2"
                >
                  <img
                    src="/assets/aistudio/Dismissive_Stop_Gesture_Avatar_14116e93.png"
                    alt="Cartoon portrait of Lakshya raising a raised eyebrow and holding up one hand in a playful stop gesture"
                    width={430}
                    height={430}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded-full"
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Bottom-Left on Desktop / Below Avatar on Mobile: Primary Home Pill CTA + Secondary Skills Link */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 lg:self-start flex flex-wrap items-center justify-center lg:justify-start gap-4"
          >
            <button
              type="button"
              data-testid="404-home-btn"
              onClick={() => handleGo('/')}
              className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#18264F] text-white text-sm font-semibold shadow-sm hover:bg-[#304A96] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F57C00] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Take Me Home</span>
              <ArrowUpRight
                aria-hidden="true"
                className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>

            <button
              type="button"
              data-testid="404-skills-btn"
              onClick={() => handleGo('/skills')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white border border-[#18264F]/15 text-[#18264F] text-sm font-semibold hover:border-[#304A96] hover:text-[#304A96] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#304A96] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Layers aria-hidden="true" className="w-4 h-4" />
              <span>Browse Skills Library</span>
            </button>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

export default NotFoundPage;
