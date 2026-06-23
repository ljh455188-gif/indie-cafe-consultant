import { useState } from 'react'
import IntakeForm from './components/steps/IntakeForm'
import DiscoveryDiagnostic from './components/steps/DiscoveryDiagnostic'
import MoatDiagnostic from './components/steps/MoatDiagnostic'
import ConsultingReport from './components/steps/ConsultingReport'
import LimitationsNotice from './components/steps/LimitationsNotice'
import ProgressBar from './components/ui/ProgressBar'
import { computeDiscoveryScore, computeMoatScores } from './lib/scoring'
import neighborhoodsData from './data/neighborhoods.json'
import type { IntakeData, DiscoveryResult, MoatResult, NeighborhoodBenchmark } from './lib/types'

type Step = 1 | 2 | 3 | 4 | 5

interface WizardState {
  step: Step
  intake: IntakeData | null
  discoveryResult: DiscoveryResult | null
  moatResult: MoatResult | null
}

const initialState: WizardState = {
  step: 1,
  intake: null,
  discoveryResult: null,
  moatResult: null,
}

const neighborhoods = neighborhoodsData as Record<string, NeighborhoodBenchmark>

export default function App() {
  const [state, setState] = useState<WizardState>(initialState)

  function handleIntakeSubmit(intake: IntakeData) {
    const discoveryResult = computeDiscoveryScore(intake)
    setState(s => ({ ...s, step: 2, intake, discoveryResult }))
  }

  function handleDiscoveryNext() {
    const moatResult = computeMoatScores(state.intake!, state.discoveryResult!.score)
    setState(s => ({ ...s, step: 3, moatResult }))
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-stone-900">Indie Cafe Consultant</h1>
          <p className="text-sm text-stone-500">Free business consulting for independent cafe owners</p>
        </div>
      </header>
      <ProgressBar step={state.step} totalSteps={5} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {state.step === 1 && (
          <IntakeForm onSubmit={handleIntakeSubmit} />
        )}
        {state.step === 2 && state.intake && state.discoveryResult && (
          <DiscoveryDiagnostic
            intake={state.intake}
            result={state.discoveryResult}
            neighborhood={neighborhoods[state.intake.neighborhood]}
            onNext={handleDiscoveryNext}
          />
        )}
        {state.step === 3 && state.intake && state.moatResult && (
          <MoatDiagnostic
            intake={state.intake}
            result={state.moatResult}
            neighborhood={neighborhoods[state.intake.neighborhood]}
            onNext={() => setState(s => ({ ...s, step: 4 }))}
          />
        )}
        {state.step === 4 && state.intake && state.discoveryResult && state.moatResult && (
          <ConsultingReport
            intake={state.intake}
            discoveryResult={state.discoveryResult}
            moatResult={state.moatResult}
            neighborhood={neighborhoods[state.intake.neighborhood]}
            onNext={() => setState(s => ({ ...s, step: 5 }))}
          />
        )}
        {state.step === 5 && (
          <LimitationsNotice onReset={() => setState(initialState)} />
        )}
      </main>
    </div>
  )
}
