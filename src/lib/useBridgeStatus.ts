'use client'
import { useEffect, useRef, useState } from 'react'

type WaStatus = 'disconnected' | 'connecting' | 'connected'

// Singleton SSE source shared across components
let globalSource: EventSource | null = null
const listeners = new Set<(e: { type: string; data: unknown }) => void>()

function getSSE() {
  if (typeof window === 'undefined') return null
  if (globalSource && globalSource.readyState !== EventSource.CLOSED) return globalSource
  const bridgeUrl = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001'
  globalSource = new EventSource(`${bridgeUrl}/api/events`)
  const forward = (type: string) => (e: MessageEvent) => {
    try { listeners.forEach(fn => fn({ type, data: JSON.parse(e.data) })) }
    catch (_) {}
  }
  ;['status','qr','message','agent_thinking','task_update'].forEach(t => {
    globalSource!.addEventListener(t, forward(t))
  })
  return globalSource
}

export function useBridgeStatus() {
  const [status, setStatus] = useState<WaStatus>('disconnected')
  const [qr, setQr]         = useState<string | null>(null)

  useEffect(() => {
    const src = getSSE()
    const handler = ({ type, data }: { type: string; data: unknown }) => {
      const d = data as Record<string, unknown>
      if (type === 'status') setStatus(d.status as WaStatus)
      if (type === 'qr')     setQr(d.qr as string)
    }
    listeners.add(handler)
    // Fetch current status on mount
    fetch(`${process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001'}/api/status`)
      .then(r => r.json())
      .then(d => { setStatus(d.status); if (d.qr) setQr(d.qr) })
      .catch(() => {})
    return () => { listeners.delete(handler) }
  }, [])

  return { status, qr }
}

// Hook for real-time messages in a specific session
export function useSessionMessages(sessionId: string | null) {
  const [messages, setMessages] = useState<unknown[]>([])
  const [thinking, setThinking] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    // Load history
    fetch(`${process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001'}/api/sessions/${encodeURIComponent(sessionId)}/messages`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setMessages(d) })
      .catch(() => {})

    const handler = ({ type, data }: { type: string; data: unknown }) => {
      const d = data as Record<string, unknown>
      if (type === 'message' && d.session_id === sessionId) {
        setMessages(prev => [...prev, d.message])
        setThinking(false)
      }
      if (type === 'agent_thinking' && d.session_id === sessionId) {
        setThinking(d.status === 'thinking')
      }
    }
    getSSE()
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [sessionId])

  return { messages, thinking }
}
