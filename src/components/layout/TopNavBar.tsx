'use client'
import { useBridgeStatus } from '@/lib/useBridgeStatus'

export default function TopNavBar({ title }: { title?: string }) {
  const { status } = useBridgeStatus()

  const waColor = status === 'connected' ? 'bg-emerald-500'
                : status === 'connecting' ? 'bg-amber-400 animate-pulse'
                : 'bg-red-400'
  const waLabel = status === 'connected' ? 'WhatsApp Connected'
                : status === 'connecting' ? 'Connecting…'
                : 'Disconnected'

  return (
    <header className="flex justify-between items-center w-full px-6 py-3 h-16 bg-white/90 backdrop-blur sticky top-0 z-40 border-b border-[#e0e3e5]">
      <span className="text-base font-bold text-[#191c1e]">
        {title ?? 'Agent Workspace'}
      </span>

      <div className="flex items-center gap-4">
        {/* WA Status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f2f4f6] text-xs font-semibold text-[#3f484a]">
          <span className={`w-2 h-2 rounded-full ${waColor}`} />
          {waLabel}
        </div>

        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-[#6f797a]">
          <a href="#" className="hover:text-primary transition-colors">Docs</a>
          <a href="#" className="hover:text-primary transition-colors">Feedback</a>
          <a href="#" className="hover:text-primary transition-colors">Support</a>
        </nav>

        <button className="p-2 text-[#6f797a] hover:bg-[#f2f4f6] rounded-full transition-all">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>

        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
          OC
        </div>
      </div>
    </header>
  )
}
