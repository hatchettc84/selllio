'use client'

interface Props {
  scores: Record<string, number>
  limit?: number
}

export function HumeExpressions({ scores, limit = 3 }: Props) {
  if (!scores || Object.keys(scores).length === 0) {
    return null
  }

  // Convert to array and sort by score
  const sortedEmotions = Object.entries(scores)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  if (sortedEmotions.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium opacity-70">Detected Emotions:</p>
      {sortedEmotions.map(({ name, score }) => (
        <div key={name} className="flex items-center gap-2">
          <span className="text-xs capitalize min-w-[80px]">{name}</span>
          <div className="flex-1 h-2 bg-background/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/70 rounded-full transition-all"
              style={{ width: `${score * 100}%` }}
            />
          </div>
          <span className="text-xs opacity-50 min-w-[40px] text-right">
            {Math.round(score * 100)}%
          </span>
        </div>
      ))}
    </div>
  )
}
