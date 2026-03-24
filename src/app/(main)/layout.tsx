import SideNavBar from '@/components/layout/SideNavBar'
import TopNavBar from '@/components/layout/TopNavBar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f9fb]">
      <SideNavBar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavBar />
        <main className="flex-1 overflow-y-auto custom-scroll">
          {children}
        </main>
      </div>
    </div>
  )
}
