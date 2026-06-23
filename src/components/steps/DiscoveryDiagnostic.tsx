import type { IntakeData, DiscoveryResult, NeighborhoodBenchmark } from '../../lib/types'
import Button from '../ui/Button'

const LABEL_COLORS: Record<DiscoveryResult['label'], string> = {
  Struggling: 'text-red-600',
  'Below Average': 'text-orange-600',
  'On Par': 'text-yellow-600',
  Strong: 'text-green-600',
  Exceptional: 'text-emerald-600',
}

export default function DiscoveryDiagnostic({
  intake: _intake,
  result,
  neighborhood,
  onNext,
}: {
  intake: IntakeData
  result: DiscoveryResult
  neighborhood: NeighborhoodBenchmark
  onNext: () => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-900 mb-1">Discovery Diagnostic</h2>
        <p className="text-stone-500">How easy is it for customers to find your cafe online?</p>
      </div>

      {/* Score circle */}
      <div className="flex flex-col items-center py-4">
        <div className="w-36 h-36 rounded-full border-8 border-amber-400 flex items-center justify-center mb-3">
          <div className="text-center">
            <div data-testid="discovery-score" className="text-4xl font-bold text-stone-900">{result.score}</div>
            <div className="text-sm text-stone-400">/ 100</div>
          </div>
        </div>
        <div className={`text-xl font-semibold ${LABEL_COLORS[result.label]}`}>{result.label}</div>
        <div className="text-sm text-stone-400 mt-1">vs. cafes in {neighborhood.name}</div>
      </div>

      {/* Gap table */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Factor</th>
              <th className="text-right px-4 py-3 text-stone-500 font-medium">Yours</th>
              <th className="text-right px-4 py-3 text-stone-500 font-medium">Avg</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Gap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {result.gaps.map(gap => (
              <tr key={gap.factor}>
                <td className="px-4 py-3 text-stone-900">{gap.factor}</td>
                <td className="px-4 py-3 text-right font-medium text-stone-900">{gap.yours}</td>
                <td className="px-4 py-3 text-right text-stone-400">{gap.avg}</td>
                <td className="px-4 py-3 text-stone-600 text-xs">{gap.delta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={onNext}>See Your Competitive Strengths →</Button>
    </div>
  )
}
