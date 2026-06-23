import type { IntakeData, MoatResult, NeighborhoodBenchmark } from '../../lib/types'

export default function MoatDiagnostic({ onNext }: { intake: IntakeData; result: MoatResult; neighborhood: NeighborhoodBenchmark; onNext: () => void }) {
  return <button onClick={onNext}>MoatDiagnostic stub</button>
}
