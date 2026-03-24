'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSessionMessages } from '@/lib/useBridgeStatus'
import Link from 'next/link'

const BRIDGE = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001'

type Agent   = { id: string; name: string; model: string; status: string }
type Session = { id: string; name: string; session_id: string }

export default function AgentChatPage() {
  const { id } = useParams<{ id: string }>()
  const [agent,        setAgent]       = useState<Agent | null>(null)
  const [sessions,     setSessions]    = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [input,        setInput]       = useState('')
  const [sending,      setSending]     = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, thinking } = useSessionMessages(activeSession?.session_id ?? null)

  useEffect(() => {
    supabase.from('agents').select('*').eq('id', id).single()
      .then(({ data }) => setAgent(data))
    supabase.from('sessions').select('*').order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setSessions(data ?? []))
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function sendMessage() {
    if (!input.trim() || sending || !activeSession) return
    setSending(true)
    await fetch(`${BRIDGE}/api/sessions/${encodeURIComponent(activeSession.session_id)}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input }),
    })
    setInput('')
    setSending(false)
  }

  if (!agent) return <div className="p-8 text-center text-[#9ca3af]">Loading…</div>

  return (
    <div className="flex h-full">

      {/* Session list */}
      <div className="w-56 border-r border-[#e0e3e5] bg-[#f7f9fb] flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-[#e0e3e5]">
          <p className="text-xs font-semibold text-[#6f797a] uppercase tracking-wide">Sessions</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scroll py-2">
          {sessions.length === 0 && (
            <p className="px-4 py-3 text-xs text-[#9ca3af]">Belum ada sesi.</p>
          )}
          {sessions.map(s => (
            <button key={s.id} onClick={() => setActiveSession(s)}
              className={`w-full text-left px-4 py-2.5 hover:bg-white transition-colors border-l-2 ${
                activeSession?.id === s.id
                  ? 'bg-white border-primary text-primary'
                  : 'border-transparent text-[#3f484a]'
              }`}>
              <div className="text-xs font-semibold truncate">{s.name}</div>
              <div className="text-[10px] text-[#9ca3af] font-mono truncate">{s.session_id}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e0e3e5] flex items-center gap-3 bg-white">
          <Link href={`/agents/${id}`} className="p-1 hover:bg-[#f2f4f6] rounded-lg">
            <span className="material-symbols-outlined text-[18px] text-[#6f797a]">arrow_back</span>
          </Link>
          <div className="w-8 h-8 rounded-lg bg-[#cef0f5] text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
          </div>
          <div>
            <div className="font-bold text-[#191c1e] text-sm">{agent.name}</div>
            <div className="text-[11px] text-[#9ca3af]">{agent.model}</div>
          </div>
          {activeSession && (
            <span className="ml-auto text-[10px] font-mono text-[#9ca3af] truncate max-w-[160px]">
              {activeSession.session_id}
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-4">
          {!activeSession && (
            <div className="text-center text-[#9ca3af] mt-16">
              <span className="material-symbols-outlined text-4xl block mb-2">chat</span>
              <p className="text-sm">Pilih sesi dari kiri untuk mulai chat</p>
            </div>
          )}
          {activeSession && messages.length === 0 && (
            <div className="text-center text-[#9ca3af] mt-16">
              <p className="text-sm">Belum ada pesan di sesi ini</p>
            </div>
          )}
          {(messages as { role: string; content: string }[]).map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                m.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-white border border-[#e0e3e5] text-[#191c1e] rounded-bl-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#e0e3e5] px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {activeSession && (
          <div className="px-6 py-4 border-t border-[#e0e3e5] bg-white">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ketik pesan…"
                className="flex-1 border border-[#e0e3e5] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <button onClick={sendMessage} disabled={!input.trim() || sending}
                className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all">
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
