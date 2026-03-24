'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSessionMessages } from '@/lib/useBridgeStatus'
import Link from 'next/link'

const BRIDGE = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001'

type Session = { id: string; name: string; session_id: string }
type Agent   = { id: string; name: string; model: string }
type Msg     = { role: string; content: string }

export default function ChatTopicPage() {
  const { id, sessionId } = useParams<{ id: string; sessionId: string }>()
  const [agent,   setAgent]   = useState<Agent | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [input,   setInput]   = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, thinking } = useSessionMessages(session?.session_id ?? null)

  useEffect(() => {
    Promise.all([
      supabase.from('agents').select('id, name, model').eq('id', id).single(),
      supabase.from('sessions').select('*').eq('id', sessionId).single(),
    ]).then(([{ data: ag }, { data: se }]) => {
      setAgent(ag)
      setSession(se)
    })
  }, [id, sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function send() {
    if (!input.trim() || sending || !session) return
    setSending(true)
    await fetch(`${BRIDGE}/api/sessions/${encodeURIComponent(session.session_id)}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input }),
    })
    setInput('')
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-6 py-4 border-b border-[#e0e3e5] bg-white flex items-center gap-3 shrink-0">
        <Link href={`/agents/${id}/chat`} className="p-1 hover:bg-[#f2f4f6] rounded-lg">
          <span className="material-symbols-outlined text-[18px] text-[#6f797a]">arrow_back</span>
        </Link>
        <div className="w-8 h-8 rounded-lg bg-[#cef0f5] text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[16px]">forum</span>
        </div>
        <div className="min-w-0">
          <div className="font-bold text-[#191c1e] text-sm truncate">{session?.name || 'Session'}</div>
          <div className="text-[10px] text-[#9ca3af] font-mono truncate">{session?.session_id}</div>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[#9ca3af]">{agent?.name}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-4">
        {(messages as Msg[]).length === 0 && !thinking && (
          <div className="text-center text-[#9ca3af] mt-20">
            <span className="material-symbols-outlined text-4xl block mb-2">chat</span>
            <p className="text-sm">Belum ada pesan di sesi ini</p>
          </div>
        )}
        {(messages as Msg[]).map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role !== 'user' && (
              <div className="w-7 h-7 rounded-full bg-[#cef0f5] text-primary flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">smart_toy</span>
              </div>
            )}
            <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-primary text-white rounded-br-sm'
                : 'bg-white border border-[#e0e3e5] text-[#191c1e] rounded-bl-sm shadow-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-[#cef0f5] text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            </div>
            <div className="bg-white border border-[#e0e3e5] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-sm">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[#e0e3e5] bg-white shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ketik pesan… (Enter kirim, Shift+Enter baris baru)"
            rows={1}
            className="flex-1 border border-[#e0e3e5] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            style={{ maxHeight: 120 }}
          />
          <button onClick={send} disabled={!input.trim() || sending}
            className="px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all shrink-0">
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </div>
  )
}
