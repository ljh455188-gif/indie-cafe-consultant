import type { IntakeData, DiscoveryResult, NeighborhoodBenchmark } from '../../lib/types'

export default function DiscoveryDiagnostic({ onNext }: { intake: IntakeData; result: DiscoveryResult; neighborhood: NeighborhoodBenchmark; onNext: () => void }) {
  return <button onClick={onNext}>DiscoveryDiagnostic stub</button>
}
