import { redirect } from 'next/navigation'

// Dipindah ke /agents/[id]/control/models
export default function AgentModelsPage({ params }: { params: { id: string } }) {
  redirect(`/agents/${params.id}/control/models`)
}
