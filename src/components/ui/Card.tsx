import type { ReactNode } from 'react'

export default function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-stone-200 p-6 ${className}`}>
      {children}
    </div>
  )
}
