import { useMemo } from 'react'

const GH_COLORS = [
  '#FFFFFF', // 0 contributions (empty)
  '#0E4429',
  '#006D32',
  '#26A641',
  '#39D353',
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const getColor = (count) => {
  if (!count || count === 0) return GH_COLORS[0]
  if (count <= 2) return GH_COLORS[1]
  if (count <= 5) return GH_COLORS[2]
  if (count <= 9) return GH_COLORS[3]
  return GH_COLORS[4]
}

const localDateKey = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const buildGrid = (activity) => {
  const map = {}
  for (const row of activity) {
    // Rows may be "YYYY-MM-DD" strings or legacy ISO timestamps; normalize
    // to a local calendar-day key so lookups match the grid exactly.
    map[String(row.activity_date).slice(0, 10)] = row.count
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from the Sunday of the week ~1 year ago
  const end = new Date(today)
  const start = new Date(today)
  start.setDate(start.getDate() - 364)
  start.setDate(start.getDate() - start.getDay()) // snap to Sunday

  const weeks = []
  let cursor = new Date(start)

  while (cursor <= end) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(cursor)
      date.setDate(date.getDate() + d)
      const key = localDateKey(date)
      const count = map[key] || 0
      week.push({ date: new Date(date), count, key })
    }
    weeks.push(week)
    cursor.setDate(cursor.getDate() + 7)
  }

  return weeks
}

export default function GitHubHeatmap({ activity = [], cellSize = 11, gap = 3 }) {
  const grid = useMemo(() => buildGrid(activity), [activity])

  if (!activity || activity.length === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center rounded-lg bg-card-2 text-sm text-text-muted">
        No GitHub activity yet. Link your handle and refresh.
      </div>
    )
  }

  // Compute month labels: for each week, check if the first day's month changed
  const monthPositions = []
  let lastMonth = -1
  grid.forEach((week, col) => {
    const month = week[0].date.getMonth()
    if (month !== lastMonth) {
      monthPositions.push({ col, label: MONTH_LABELS[month] })
      lastMonth = month
    }
  })

  const gridWidth = grid.length * (cellSize + gap)

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Month labels */}
        <div className="relative mb-1 ml-8" style={{ height: 16, width: gridWidth }}>
          {monthPositions.map(({ col, label }) => (
            <span
              key={`${col}-${label}`}
              className="absolute text-[10px] text-text-muted"
              style={{ left: col * (cellSize + gap) }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="mr-1 flex flex-col" style={{ gap }}>
            {DAY_LABELS.map((day, i) => (
              <div
                key={day}
                className="text-[10px] leading-none text-text-muted"
                style={{ height: cellSize, lineHeight: `${cellSize}px`, visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
              >
                {i % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex" style={{ gap }}>
            {grid.map((week, col) => (
              <div key={col} className="flex flex-col" style={{ gap }}>
                {week.map((cell) => (
                  <div
                    key={cell.key}
                    title={`${cell.key}: ${cell.count} contribution${cell.count !== 1 ? 's' : ''}`}
                    className="rounded-[2px] transition-colors"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: getColor(cell.count),
                      border: '1px solid #000000',
                      boxSizing: 'border-box',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-text-muted">
          <span>Less</span>
          {GH_COLORS.map((c) => (
            <div
              key={c}
              className="rounded-[2px]"
              style={{ width: cellSize, height: cellSize, backgroundColor: c, border: '1px solid #000000', boxSizing: 'border-box' }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}