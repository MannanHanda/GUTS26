import type { SceneVariant } from './error-catalog';

// Animated Glasgow Subway loop: one circular line, 15 stations, an orange train.
// Styles live inside the SVG (prefixed `uwe-`) because next.config.ts routes every
// *.css file, including CSS modules, through the Tailwind loader as global CSS,
// which leaves CSS-module class names undefined.

const C = 120; // centre
const R = 90; // track radius
const STATIONS = 15;

function point(deg: number, radius = R): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [C + radius * Math.sin(rad), C - radius * Math.cos(rad)];
}

function arc(fromDeg: number, toDeg: number): string {
  const [x1, y1] = point(fromDeg);
  const [x2, y2] = point(toDeg);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

const SCENE_CSS = `
.uwe-track { fill: none; stroke: #cbd5e1; stroke-width: 10; }
.uwe-track-inner { fill: none; stroke: #f1f5f9; stroke-width: 2; }
.uwe-track-offline { fill: none; stroke: #cbd5e1; stroke-width: 10; stroke-dasharray: 3 9; }
.uwe-station { fill: #ffffff; stroke: #94a3b8; stroke-width: 2; }
.uwe-label { font: 600 10px var(--font-inter), system-ui, sans-serif; fill: #64748b; letter-spacing: 0.06em; }
.uwe-train { transform-origin: 120px 120px; }
.uwe-train-body { fill: #f97316; stroke: #c2410c; stroke-width: 1.5; }
.uwe-train-window { fill: #fff7ed; }
.uwe-moving { animation: uwe-orbit 6s linear infinite; }
.uwe-halted { animation: uwe-nudge 1.6s ease-in-out infinite; }
.uwe-fading { animation: uwe-fade 2.4s ease-in-out infinite; }
.uwe-ghost { fill: #f0fdfa; stroke: #0f766e; stroke-width: 2; stroke-dasharray: 4 3;
  transform-box: fill-box; transform-origin: center; animation: uwe-blink 1.8s ease-in-out infinite; }
.uwe-ghost-mark { font: 800 13px var(--font-inter), system-ui, sans-serif; fill: #0f766e;
  animation: uwe-fade-soft 1.8s ease-in-out infinite; }
.uwe-signal-post { stroke: #475569; stroke-width: 3; }
.uwe-signal-light { fill: #e11d48; animation: uwe-signal 1s steps(2, jump-none) infinite; }
.uwe-badge { fill: #e11d48; animation: uwe-shake 0.9s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite; }
.uwe-badge-mark { stroke: #ffffff; stroke-width: 4; stroke-linecap: round; }
.uwe-suspended { fill: none; stroke: #f59e0b; stroke-width: 10; stroke-dasharray: 8 7;
  animation: uwe-march 1.2s linear infinite; }
.uwe-flicker { animation: uwe-flicker 2.2s linear infinite; }
@keyframes uwe-orbit { to { transform: rotate(360deg); } }
@keyframes uwe-nudge { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(-1deg); } }
@keyframes uwe-fade { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.8; } }
@keyframes uwe-fade-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes uwe-blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.82); } }
@keyframes uwe-signal { 0% { opacity: 1; } 100% { opacity: 0.2; } }
@keyframes uwe-shake { 0%, 60%, 100% { transform: translateX(0); } 10%, 30%, 50% { transform: translateX(-5px); }
  20%, 40% { transform: translateX(5px); } }
@keyframes uwe-march { to { stroke-dashoffset: -30; } }
@keyframes uwe-flicker { 0%, 18%, 22%, 62%, 64%, 100% { opacity: 1; } 20%, 63% { opacity: 0.25; } }
@media (prefers-reduced-motion: reduce) {
  .uwe-moving, .uwe-halted, .uwe-fading, .uwe-ghost, .uwe-ghost-mark, .uwe-signal-light,
  .uwe-badge, .uwe-suspended, .uwe-flicker { animation: none; }
}
`;

const TRAIN_ANIMATION: Record<SceneVariant, string> = {
  lost: 'uwe-moving',
  signal: 'uwe-halted',
  barrier: '',
  suspended: '',
  failure: '',
  offline: 'uwe-fading',
};

// Resting angle of the train when no rotation animation is running.
const TRAIN_ANGLE: Record<SceneVariant, number> = {
  lost: 0, // animated
  signal: 0, // animated
  barrier: -48,
  suspended: -72,
  failure: -28,
  offline: -120,
};

/** `compact` hides the centre label, which is unreadable at thumbnail size. */
export function SubwayScene({ variant, compact = false }: { variant: SceneVariant; compact?: boolean }) {
  const showSignal = variant === 'signal' || variant === 'failure';
  const animatesRotation = variant === 'lost' || variant === 'signal'; // CSS animation owns the transform
  const [sigX, sigY] = point(14, 112);
  const [postX, postY] = point(14, 100);

  return (
    <svg viewBox="0 0 240 240" className="h-auto w-full max-w-[280px] overflow-visible" aria-hidden="true" focusable="false">
      <style>{SCENE_CSS}</style>

      <g className={variant === 'failure' ? 'uwe-flicker' : undefined}>
        {variant === 'offline' ? (
          <circle cx={C} cy={C} r={R} className="uwe-track-offline" />
        ) : (
          <>
            <circle cx={C} cy={C} r={R} className="uwe-track" />
            <circle cx={C} cy={C} r={R} className="uwe-track-inner" />
          </>
        )}

        {variant === 'suspended' && <path d={arc(40, 150)} className="uwe-suspended" />}

        {Array.from({ length: STATIONS }, (_, i) => {
          if (variant === 'lost' && i === 0) return null; // the missing stop
          const [x, y] = point((360 / STATIONS) * i);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={5}
              className="uwe-station"
              opacity={variant === 'offline' ? 0.45 : 1}
            />
          );
        })}
      </g>

      {variant === 'lost' && (
        <g>
          <circle cx={C} cy={C - R} r={11} className="uwe-ghost" />
          <text x={C} y={C - R + 4.5} textAnchor="middle" className="uwe-ghost-mark">
            ?
          </text>
        </g>
      )}

      {showSignal && (
        <g>
          <line x1={postX} y1={postY} x2={sigX} y2={sigY} className="uwe-signal-post" />
          <circle cx={sigX} cy={sigY} r={6} className="uwe-signal-light" />
        </g>
      )}

      <g
        className={`uwe-train ${TRAIN_ANIMATION[variant]}`}
        style={animatesRotation ? undefined : { transform: `rotate(${TRAIN_ANGLE[variant]}deg)` }}
      >
        <rect x={C - 17} y={C - R - 7.5} width={34} height={15} rx={7} className="uwe-train-body" />
        <rect x={C - 11} y={C - R - 3.5} width={6} height={5} rx={1.5} className="uwe-train-window" />
        <rect x={C - 3} y={C - R - 3.5} width={6} height={5} rx={1.5} className="uwe-train-window" />
        <rect x={C + 5} y={C - R - 3.5} width={6} height={5} rx={1.5} className="uwe-train-window" />
      </g>

      {variant === 'barrier' ? (
        <g className="uwe-badge">
          <circle cx={C} cy={C} r={22} />
          <line x1={C - 8} y1={C - 8} x2={C + 8} y2={C + 8} className="uwe-badge-mark" />
          <line x1={C + 8} y1={C - 8} x2={C - 8} y2={C + 8} className="uwe-badge-mark" />
        </g>
      ) : compact ? null : (
        <text x={C} y={C + 4} textAnchor="middle" className="uwe-label">
          {variant === 'suspended' ? 'SERVICE SUSPENDED' : 'GLASGOW SUBWAY'}
        </text>
      )}
    </svg>
  );
}
