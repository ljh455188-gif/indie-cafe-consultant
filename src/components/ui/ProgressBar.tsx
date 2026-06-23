export default function ProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  const percent = ((step - 1) / (totalSteps - 1)) * 100
  return (
    <div className="bg-stone-200 h-1">
      <div
        className="bg-amber-500 h-1 transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
