import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { IntakeData, DiscoveryResult, MoatResult, NeighborhoodBenchmark } from '../../lib/types'
import Button from '../ui/Button'

interface Props {
  intake: IntakeData
  discoveryResult: DiscoveryResult
  moatResult: MoatResult
  neighborhood: NeighborhoodBenchmark
  onNext: () => void
}

export default function ConsultingReport({ intake, discoveryResult, moatResult, neighborhood, onNext }: Props) {
  const [reportText, setReportText] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchReport() {
      setReportText('')
      setDone(false)
      setError(null)

      try {
        const response = await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intake, discoveryResult, moatResult, neighborhood }),
        })

        if (!response.ok || !response.body) {
          if (!cancelled) setError('Failed to generate report. Please try again.')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (!cancelled) {
          const { done: streamDone, value } = await reader.read()
          if (streamDone) break

          const text = decoder.decode(value, { stream: true })
          for (const line of text.split('\n')) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              if (!cancelled) setDone(true)
              return
            }
            try {
              const parsed = JSON.parse(data)
              if (!cancelled && parsed.error) {
                setError(parsed.error)
                return
              }
              if (!cancelled && parsed.text) setReportText(prev => prev + parsed.text)
            } catch { /* skip malformed chunk */ }
          }
        }
      } catch {
        if (!cancelled) setError('Connection error. Please try again.')
      }
    }

    fetchReport()
    return () => { cancelled = true }
  }, [retryCount]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-stone-900">Your Consulting Report</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">{error}</div>
        <Button onClick={() => setRetryCount(c => c + 1)}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-stone-900">Your Consulting Report</h2>

      {!reportText && (
        <div className="flex items-center gap-3 text-stone-500 py-12 justify-center">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Analyzing your cafe...</span>
        </div>
      )}

      {reportText && (
        <div className="bg-white rounded-lg border border-stone-200 p-6 text-stone-800 leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-stone-900 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-2 [&_strong]:font-semibold [&_p]:mb-3 [&_p:last-child]:mb-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportText}</ReactMarkdown>
        </div>
      )}

      {done && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigator.clipboard.writeText(reportText)}
          >
            Copy to Clipboard
          </Button>
          <Button className="flex-1" onClick={onNext}>
            Continue →
          </Button>
        </div>
      )}
    </div>
  )
}
