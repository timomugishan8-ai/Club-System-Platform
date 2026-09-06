import {
  FileCode2, PieChart, GitBranch, Star, Trophy, Users,
  Code2, Award, BarChart3, Cpu, Medal, Lock,
} from 'lucide-react'

// Maps the badge's `icon` key (stored in the badges table) to a distinctive
// glyph so each badge is visually unique instead of a generic trophy.
const ICON_MAP = {
  python: FileCode2,
  chart: PieChart,
  'git-branch': GitBranch,
  star: Star,
  trophy: Trophy,
  users: Users,
  code: Code2,
  award: Award,
  'bar-chart': BarChart3,
  cpu: Cpu,
}

// size: lucide className, e.g. "h-6 w-6".
// Earned: the badge glyph in its own color. Locked: the same glyph shows
// faintly (like a silhouette behind frosted glass) with a padlock on top.
export default function BadgeIcon({ icon, color, size = 'h-6 w-6', earned = true, className = '' }) {
  const Icon = ICON_MAP[icon] || Medal
  if (!earned) {
    return (
      <span className={`relative inline-flex items-center justify-center ${className}`}>
        <Icon
          className={size}
          style={{ color: 'var(--color-text-muted)', opacity: 0.22 }}
        />
        <Lock
          className="absolute text-text-muted drop-shadow-sm"
          style={{ width: '55%', height: '55%' }}
        />
      </span>
    )
  }
  return <Icon className={size} style={{ color }} />
}