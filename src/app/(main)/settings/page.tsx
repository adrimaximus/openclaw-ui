'use client'
import { useState } from 'react'

type Provider = {
  id: string
  name: string
  type: 'Built-in' | 'Custom'
  status: 'ready' | 'not-ready'
  statusLabel: string
  baseUrl: string | null
  apiKey: string | null
  modelCount: string
}

const PROVIDERS: Provider[] = [
  {
    id: 'modelscope',
    name: 'ModelScope',
    type: 'Built-in',
    status: 'not-ready',
    statusLabel: 'Not Ready (not configured)',
    baseUrl: 'https://api-inference.modelscope.cn/v1',
    apiKey: null,
    modelCount: '2 models',
  },
  {
    id: 'dashscope',
    name: 'DashScope',
    type: 'Built-in',
    status: 'not-ready',
    statusLabel: 'Not Ready (not configured)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: null,
    modelCount: '3 models',
  },
  {
    id: 'minimax',
    name: 'Aliyun / MiniMax Coding Plan',
    type: 'Built-in',
    status: 'ready',
    statusLabel: 'Ready (with models)',
    baseUrl: 'https://api.minimax.io/v1',
    apiKey: 'sk-sp / sk-cp******',
    modelCount: '8 models',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'Built-in',
    status: 'not-ready',
    statusLabel: 'Not Ready (not configured)',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: null,
    modelCount: '11 models',
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    type: 'Built-in',
    status: 'not-ready',
    statusLabel: 'Not Ready (not configured)',
    baseUrl: null,
    apiKey: null,
    modelCount: '',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'Built-in',
    status: 'not-ready',
    statusLabel: 'Not Ready (not configured)',
    baseUrl: 'https://api.anthropic.com',
    apiKey: null,
    modelCount: 'No models',
  },
]

const MODELS_BY_PROVIDER: Record<string, string[]> = {
  minimax: ['MiniMax M2.5 (MiniMax-M2.5)', 'MiniMax M2 (MiniMax-M2)', 'abab7-chat', 'abab6.5s-chat'],
  openai: ['GPT-4o', 'GPT-4o mini', 'GPT-4 Turbo', 'GPT-3.5 Turbo'],
  anthropic: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
  modelscope: ['Qwen2.5-72B', 'Qwen2.5-7B'],
  dashscope: ['qwen-max', 'qwen-plus', 'qwen-turbo'],
  azure: [],
}

export default function ModelsPage() {
  const [activeProvider, setActiveProvider] = useState('minimax')
  const [activeModel, setActiveModel]       = useState('MiniMax M2.5 (MiniMax-M2.5)')
  const [saved, setSaved]                   = useState(true)

  const activeProviderObj = PROVIDERS.find(p => p.id === activeProvider)
  const models = MODELS_BY_PROVIDER[activeProvider] ?? []

  const handleSave = () => setSaved(true)

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">

      {/* ── LLM ── */}
      <section>
        <h2 className="text-xl font-extrabold text-[#191c1e]">LLM</h2>
        <p className="text-sm text-[#6f797a] mt-1">Choose the active LLM model from an authorized provider.</p>

        <div className="mt-4 bg-white border border-[#e0e3e5] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <span className="font-bold text-[#191c1e]">LLM Configuration</span>
            <span className="px-3 py-1 rounded-full bg-[#eef6f0] text-green-700 text-xs font-semibold">
              Active: {activeProvider} / {activeModel.split(' ')[0]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Provider */}
            <div>
              <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Provider</label>
              <select
                value={activeProvider}
                onChange={e => {
                  setActiveProvider(e.target.value)
                  setActiveModel(MODELS_BY_PROVIDER[e.target.value]?.[0] ?? '')
                  setSaved(false)
                }}
                className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm text-[#191c1e] bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Model</label>
              <select
                value={activeModel}
                onChange={e => { setActiveModel(e.target.value); setSaved(false) }}
                className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm text-[#191c1e] bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {models.length > 0
                  ? models.map(m => <option key={m} value={m}>{m}</option>)
                  : <option value="">No models available</option>
                }
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                saved
                  ? 'bg-[#f2f4f6] text-[#6f797a] cursor-default'
                  : 'bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {saved ? 'check' : 'save'}
              </span>
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Providers ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-extrabold text-[#191c1e]">Providers</h2>
            <p className="text-sm text-[#6f797a] mt-1">Configure API keys and endpoints for each provider.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Provider
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROVIDERS.map(p => (
            <ProviderCard
              key={p.id}
              provider={p}
              isActive={p.id === activeProvider}
            />
          ))}
        </div>
      </section>

    </div>
  )
}

function ProviderCard({ provider: p, isActive }: { provider: Provider; isActive: boolean }) {
  return (
    <div className={`bg-white rounded-xl border p-5 transition-all ${
      isActive ? 'border-primary shadow-md shadow-primary/10' : 'border-[#e0e3e5] hover:border-primary/30 hover:shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-bold text-[#191c1e] text-sm leading-snug">{p.name}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f2f4f6] text-[#6f797a]">
            {p.type}
          </span>
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold ${
          p.status === 'ready' ? 'text-green-600' : 'text-[#9ca3af]'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            p.status === 'ready' ? 'bg-green-500' : 'bg-[#9ca3af]'
          }`} />
          {p.statusLabel}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs">
        <div className="flex gap-2">
          <span className="text-[#9ca3af] w-16 shrink-0">Base URL</span>
          <span className="text-[#3f484a] truncate">{p.baseUrl ?? <em className="text-[#9ca3af]">Not set</em>}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[#9ca3af] w-16 shrink-0">API Key</span>
          <span className="text-[#3f484a]">{p.apiKey ?? <em className="text-[#9ca3af]">Not set</em>}</span>
        </div>
        {p.modelCount && (
          <div className="flex gap-2">
            <span className="text-[#9ca3af] w-16 shrink-0">Model</span>
            <span className="text-[#3f484a]">{p.modelCount}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-[#f2f4f6] flex items-center gap-4">
        <button className="flex items-center gap-1.5 text-xs text-[#6f797a] hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[14px]">grid_view</span> Models
        </button>
        <button className="flex items-center gap-1.5 text-xs text-[#6f797a] hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[14px]">edit</span> Settings
        </button>
      </div>
    </div>
  )
}
