import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import type { IntakeData, MoatResult, NeighborhoodBenchmark } from '../../lib/types'
import Button from '../ui/Button'
import Card from '../ui/Card'

const MOAT_META = [
  { key: 'experience' as const, label: 'Experience', description: 'Craft skill that chains cannot replicate at scale' },
  { key: 'community' as const, label: 'Community', description: 'Regulars, reviews, and neighborhood presence' },
  { key: 'discovery' as const, label: 'Discovery', description: 'How easy you are to find online' },
  { key: 'menuMargin' as const, label: 'Menu & Margin', description: 'Menu uniqueness and specialization' },
]

export default function MoatDiagnostic({
  result,
  neighborhood,
  onNext,
}: {
  intake: IntakeData
  result: MoatResult
  neighborhood: NeighborhoodBenchmark
  onNext: () => void
}) {
  const radarData = MOAT_META.map(m => ({ subject: m.label, value: result[m.key] }))
  const franchisePercent = Math.round(neighborhood.franchiseRatio * 100)
  const closurePercent = Math.round(neighborhood.closureRate * 100)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-900 mb-1">Competitive Strengths</h2>
        <p className="text-stone-500">Your four moats — where you're strong and where to focus.</p>
      </div>

      {/* Radar chart */}
      <div className="bg-white rounded-lg border border-stone-200 p-4">
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e7e5e4" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#78716c', fontSize: 12 }} />
            <Radar name="Your cafe" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 gap-3">
        {MOAT_META.map(m => (
          <Card key={m.key} className="p-4">
            <div className="text-3xl font-bold text-stone-900 mb-1">{result[m.key]}</div>
            <div className="text-sm font-semibold text-stone-700">{m.label}</div>
            <div className="text-xs text-stone-400 mt-1">{m.description}</div>
          </Card>
        ))}
      </div>

      {/* Focus recommendation */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-amber-900 mb-1">Where to focus</p>
        <p className="text-sm text-amber-800">{result.focusRecommendation}</p>
      </div>

      {/* Neighborhood pressure */}
      <div className="bg-stone-100 rounded-lg p-4">
        <p className="text-sm text-stone-600">
          <span className="font-medium">{neighborhood.name}</span> has a franchise ratio of{' '}
          <span className="font-semibold">{franchisePercent}%</span> and an annual closure rate of{' '}
          <span className="font-semibold">{closurePercent}%</span>.{' '}
          {neighborhood.rentPressure === 'very high' || neighborhood.rentPressure === 'high'
            ? 'Standing out matters more here than in lower-pressure neighborhoods.'
            : 'This is a relatively lower-pressure area, but differentiation still pays.'}
        </p>
      </div>

      <Button onClick={onNext}>Generate My AI Report →</Button>
    </div>
  )
}
