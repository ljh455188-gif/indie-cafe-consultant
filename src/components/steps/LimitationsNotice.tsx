export default function LimitationsNotice({ onReset }: { onReset: () => void }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-900 mb-1">One More Thing</h2>
        <p className="text-stone-500">An honest note about what this tool can and cannot do.</p>
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 text-stone-700 leading-relaxed space-y-4">
        <p>
          This tool can help you get found online, sharpen your positioning, and compete smarter
          on the things you control.
        </p>
        <p>
          What it cannot do is solve rising rents or reverse gentrification. Those are structural
          problems that require policy — not a better Naver profile.
        </p>
        <p className="font-medium text-stone-900">
          We believe you deserve honesty about that.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="font-semibold text-amber-900 mb-2">Our Mission</h3>
        <p className="text-amber-800 text-sm leading-relaxed">
          Independent cafes make neighborhoods worth living in. This tool exists to give small
          owners the same analytical edge that franchise chains pay data teams for — for free.
          The playing field isn't level, but this is one way to tilt it a little.
        </p>
      </div>

      <button
        onClick={onReset}
        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        ← Start Over
      </button>
    </div>
  )
}
