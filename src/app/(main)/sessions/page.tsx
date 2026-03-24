'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Session = {
  id: string
  name: string
  session_id: string
  user_id: string
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setSessions(data ?? []))
  }, [])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-[#191c1e]">Sessions</h2>
        <p className="text-sm text-[#6f797a] mt-1">View and manage active chat sessions</p>
      </div>

      <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e0e3e5] text-[#6f797a] text-xs font-semibold uppercase tracking-wide">
              <th className="text-left px-5 py-3">ID</th>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Session ID</th>
              <th className="text-left px-5 py-3">User ID</th>
              <th className="text-left px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-[#9ca3af]">
                  No sessions found
                </td>
              </tr>
            ) : (
              sessions.map(s => (
                <tr key={s.id} className="border-b border-[#f2f4f6] hover:bg-[#f7f9fb] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-[#6f797a]">{s.id}</td>
                  <td className="px-5 py-3 font-medium text-[#191c1e]">{s.name}</td>
                  <td className="px-5 py-3 text-[#6f797a]">{s.session_id}</td>
                  <td className="px-5 py-3 text-[#6f797a]">{s.user_id}</td>
                  <td className="px-5 py-3 flex items-center gap-3">
                    <button className="text-primary font-semibold hover:underline text-xs">Edit</button>
                    <button className="text-red-500 font-semibold hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
