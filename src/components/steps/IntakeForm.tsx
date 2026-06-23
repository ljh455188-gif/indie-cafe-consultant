import type { IntakeData } from '../../lib/types'

export default function IntakeForm({ onSubmit }: { onSubmit: (data: IntakeData) => void }) {
  return <div onClick={() => onSubmit({} as IntakeData)}>IntakeForm stub</div>
}
