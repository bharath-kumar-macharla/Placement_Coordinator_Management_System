/**
 * Animated circular score ring.
 * @param {number} score - 0 to 100
 * @param {number} [size=80]
 */
export default function ScoreRing({ score, size = 80 }) {
  const radius    = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress  = Math.min(Math.max(score ?? 0, 0), 100);
  const offset    = circumference - (progress / 100) * circumference;

  const color =
    progress >= 75 ? "#10b981" :
    progress >= 50 ? "#f59e0b" :
    "#ef4444";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="img"
      aria-label={`Match score: ${progress}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          className="score-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={7}
        />
        <circle
          className="score-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={7}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className="absolute text-sm font-bold"
        style={{ color }}
      >
        {progress}%
      </span>
    </div>
  );
}
