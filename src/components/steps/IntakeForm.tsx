import { useState, type FormEvent } from 'react'
import neighborhoodsData from '../../data/neighborhoods.json'
import type { IntakeData, NeighborhoodBenchmark } from '../../lib/types'
import Button from '../ui/Button'

const NEIGHBORHOODS = Object.entries(
  neighborhoodsData as Record<string, NeighborhoodBenchmark>
).map(([key, val]) => ({ key, label: val.name }))

const initialForm: IntakeData = {
  neighborhood: '',
  cafeType: 'drip',
  sizeSeats: 'small',
  naver: { photoCount: 0, reviewCount: 0, daysSinceLastReview: 0, hasMenu: false, hasHours: false },
  hasInstagram: false,
  strengths: '',
  biggestWorry: '',
}

export default function IntakeForm({ onSubmit }: { onSubmit: (data: IntakeData) => void }) {
  const [form, setForm] = useState<IntakeData>(initialForm)
  const [errors, setErrors] = useState<string[]>([])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs: string[] = []
    if (!form.neighborhood) errs.push('Please select your neighborhood.')
    if (!form.strengths.trim()) errs.push('Please describe your strengths.')
    if (!form.biggestWorry.trim()) errs.push('Please describe your biggest worry.')
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    onSubmit(form)
  }

  function setNaver<K extends keyof IntakeData['naver']>(key: K, value: IntakeData['naver'][K]) {
    setForm(f => ({ ...f, naver: { ...f.naver, [key]: value } }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-900 mb-1">Tell us about your cafe</h2>
        <p className="text-stone-500">Takes about 3 minutes. All fields are used to personalize your report.</p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          {errors.map(e => <p key={e} className="text-red-700 text-sm">{e}</p>)}
        </div>
      )}

      {/* Neighborhood */}
      <div className="space-y-1">
        <label htmlFor="neighborhood" className="block text-sm font-medium text-stone-700">Neighborhood</label>
        <select
          id="neighborhood"
          aria-label="Neighborhood"
          value={form.neighborhood}
          onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Select your neighborhood…</option>
          {NEIGHBORHOODS.map(n => (
            <option key={n.key} value={n.key}>{n.label}</option>
          ))}
        </select>
      </div>

      {/* Cafe type */}
      <fieldset>
        <legend className="block text-sm font-medium text-stone-700 mb-2">Cafe type</legend>
        <div className="space-y-2">
          {([
            ['drip', 'Drip specialist'],
            ['general', 'General espresso bar'],
            ['mixed', 'Mixed menu'],
          ] as const).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cafeType"
                value={val}
                aria-label={label}
                checked={form.cafeType === val}
                onChange={() => setForm(f => ({ ...f, cafeType: val }))}
                className="accent-amber-500"
              />
              <span className="text-stone-800">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Size */}
      <fieldset>
        <legend className="block text-sm font-medium text-stone-700 mb-2">Cafe size</legend>
        <div className="space-y-2">
          {([
            ['small', 'Small — fewer than 15 seats'],
            ['medium', 'Medium — 15 to 30 seats'],
            ['large', 'Large — more than 30 seats'],
          ] as const).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sizeSeats"
                value={val}
                checked={form.sizeSeats === val}
                onChange={() => setForm(f => ({ ...f, sizeSeats: val }))}
                className="accent-amber-500"
              />
              <span className="text-stone-800">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Naver Place stats */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-stone-700">Your Naver Place stats <span className="text-stone-400 font-normal">(check your Naver Place page)</span></p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            ['photoCount', 'Number of photos on Naver Place', 'Photos'],
            ['reviewCount', 'Number of reviews', 'Reviews'],
            ['daysSinceLastReview', 'Days since last review', 'Days since last review'],
          ] as const).map(([key, ariaLabel, placeholder]) => (
            <div key={key} className="space-y-1">
              <label htmlFor={key} className="block text-xs text-stone-500">{placeholder}</label>
              <input
                id={key}
                type="number"
                aria-label={ariaLabel}
                min={0}
                value={form.naver[key] === 0 ? '' : form.naver[key]}
                onChange={e => setNaver(key, parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {([
            ['hasMenu', 'Menu is listed on Naver Place'],
            ['hasHours', 'Opening hours are listed on Naver Place'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.naver[key]}
                onChange={e => setNaver(key, e.target.checked)}
                className="accent-amber-500 w-4 h-4"
              />
              <span className="text-stone-800 text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Instagram */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.hasInstagram}
          onChange={e => setForm(f => ({ ...f, hasInstagram: e.target.checked }))}
          className="accent-amber-500 w-4 h-4"
        />
        <span className="text-stone-800 text-sm">My cafe has an Instagram account</span>
      </label>

      {/* Strengths */}
      <div className="space-y-1">
        <label htmlFor="strengths" className="block text-sm font-medium text-stone-700">
          Your biggest strengths <span className="text-stone-400 font-normal">(e.g. hand-pour technique, single origin beans, regulars)</span>
        </label>
        <textarea
          id="strengths"
          aria-label="Your biggest strengths"
          value={form.strengths}
          onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))}
          rows={3}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>

      {/* Biggest worry */}
      <div className="space-y-1">
        <label htmlFor="biggestWorry" className="block text-sm font-medium text-stone-700">
          Your biggest worry right now
        </label>
        <textarea
          id="biggestWorry"
          aria-label="Your biggest worry"
          value={form.biggestWorry}
          onChange={e => setForm(f => ({ ...f, biggestWorry: e.target.value }))}
          rows={3}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>

      <Button type="submit">Get My Report →</Button>
    </form>
  )
}
