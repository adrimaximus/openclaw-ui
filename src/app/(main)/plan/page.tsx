export default function PlanPage() {
  const plans = [
    { name: 'Starter', price: 'Gratis', agents: 1,  sessions: 100,  tokens: '50k',  active: false },
    { name: 'Pro',     price: 'Rp 299k', agents: 5, sessions: 1000, tokens: '500k', active: true  },
    { name: 'Scale',   price: 'Rp 799k', agents: 20, sessions: 'Unlimited', tokens: '2M', active: false },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-[#191c1e]">Plan</h2>
        <p className="text-sm text-[#6f797a] mt-1">Pilih paket yang sesuai kebutuhan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map(p => (
          <div key={p.name}
            className={`bg-white rounded-xl border p-6 flex flex-col ${
              p.active ? 'border-primary' : 'border-[#e0e3e5]'
            }`}>
            {p.active && (
              <span className="self-start px-2.5 py-0.5 bg-primary text-white text-[10px] font-bold uppercase rounded-full mb-4">
                Aktif
              </span>
            )}
            <div className="text-lg font-extrabold text-[#191c1e]">{p.name}</div>
            <div className="text-2xl font-extrabold text-primary mt-1">{p.price}
              <span className="text-xs font-normal text-[#9ca3af]">/bln</span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#3f484a] flex-1">
              <div className="flex justify-between">
                <span>Agents</span>
                <span className="font-semibold">{p.agents}</span>
              </div>
              <div className="flex justify-between">
                <span>Sessions</span>
                <span className="font-semibold">{p.sessions}</span>
              </div>
              <div className="flex justify-between">
                <span>Tokens</span>
                <span className="font-semibold">{p.tokens}</span>
              </div>
            </div>
            <button className={`mt-5 w-full py-2.5 text-sm font-semibold rounded-lg transition-all ${
              p.active
                ? 'bg-[#f2f4f6] text-[#9ca3af] cursor-default'
                : 'bg-primary text-white hover:opacity-90'
            }`}>
              {p.active ? 'Plan saat ini' : 'Pilih Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
