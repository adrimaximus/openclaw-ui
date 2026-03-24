'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSessionMessages } from '@/lib/useBridgeStatus'

type Message = {
  id: string; role: 'user' | 'assistant' | 'system';
  content: string; message_type: string; created_at: string;
  metadata?: Record<string, unknown>
}

const BRIDGE = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001'

export default function ChatSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const decoded = decodeURIComponent(sessionId)
  const { messages, thinking } = useSessionMessages(decoded)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function send() {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await fetch(`${BRIDGE}/api/sessions/${encodeURIComponent(decoded)}/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      })
      setText('')
    } catch (_) {}
    setSending(false)
  }

  const phone = decoded.split('@')[0]

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Chat header */}
      <div className="px-6 py-4 bg-white border-b border-[#e0e3e5] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/chat" className="p-1.5 hover:bg-[#f2f4f6] rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px] text-[#6f797a]">arrow_back</span>
          </Link>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
            {phone[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-[#191c1e]">{phone}</div>
            <div className="text-xs text-[#6f797a]">{decoded}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {thinking && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#cce8ed] text-[#051f23] text-xs font-semibold">
              <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
              Agent thinking
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scroll">
        {(messages as Message[]).map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}

        {/* Agent thinking bubble */}
        {thinking && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-lg bg-[#cef0f5] flex-shrink-0 flex items-center justify-center text-primary text-xs font-bold">AI</div>
            <div className="bg-[#f2f4f6] px-4 py-3 rounded-xl rounded-tl-none flex items-center gap-1.5">
              <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 bg-white border-t border-[#e0e3e5] shrink-0">
        <div className="flex items-end gap-3 bg-[#f2f4f6] rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <textarea
            rows={1}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Type a message…"
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none py-1.5 text-[#191c1e] placeholder:text-[#6f797a]"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="bg-primary text-white p-2 rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
        <p className="text-[10px] text-center text-[#6f797a] mt-2">Messages sync in real-time with WhatsApp</p>
      </div>
    </div>
  )
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser      = msg.role === 'user'
  const isSystem    = msg.role === 'system'
  const isCommand   = msg.message_type === 'command_output'
  const status      = (msg.metadata as any)?.status

  if (isSystem && isCommand) {
    return (
      <div className="mx-auto max-w-2xl w-full">
        <div className={`rounded-xl overflow-hidden border ${status === 'running' ? 'border-amber-200' : status === 'error' ? 'border-red-200' : 'border-[#e0e3e5]'}`}>
          <div className={`px-4 py-2 flex items-center gap-2 text-xs font-bold
            ${status === 'running' ? 'bg-amber-50 text-amber-700' : status === 'error' ? 'bg-red-50 text-red-700' : 'bg-[#f2f4f6] text-[#6f797a]'}`}>
            {status === 'running' ? (
              <><span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" /> Executing…</>
            ) : (
              <><span className="material-symbols-outlined text-[14px]">{status === 'error' ? 'error' : 'terminal'}</span>
              {(msg.metadata as any)?.command || 'Command output'}</>
            )}
          </div>
          {status !== 'running' && (
            <div className="p-0">
              <pre>{msg.content.replace(/^```\n?/, '').replace(/\n?```$/, '')}</pre>
            </div>
          )}
        </div>
        <div className="text-[10px] text-[#6f797a] mt-1 text-center">
          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-3 max-w-xl ${!isUser ? '' : 'flex-row-reverse ml-auto'}`}>
      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold
        ${isUser ? 'bg-[#e0e3e5] text-[#3f484a]' : 'bg-[#cef0f5] text-primary'}`}>
        {isUser ? msg.content[0]?.toUpperCase() ?? 'U' : 'AI'}
      </div>
      <div className="space-y-1">
        <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed
          ${isUser
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-[#f2f4f6] text-[#191c1e] rounded-tl-none border border-[#e0e3e5]'}`}>
          {msg.content}
        </div>
        <div className={`text-[10px] text-[#6f797a] ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
