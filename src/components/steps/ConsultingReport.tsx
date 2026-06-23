import type { IntakeData, DiscoveryResult, MoatResult, NeighborhoodBenchmark } from '../../lib/types'

export default function ConsultingReport({ onNext }: { intake: IntakeData; discoveryResult: DiscoveryResult; moatResult: MoatResult; neighborhood: NeighborhoodBenchmark; onNext: () => void }) {
  return <button onClick={onNext}>ConsultingReport stub</button>
}
