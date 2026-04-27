'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, CheckSquare, Video, Settings } from 'lucide-react'

const navItems = [
  {
    title: 'الرئيسية',
    href: '/',
    icon: Home,
  },
  {
    title: 'المهام',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    title: 'صناعة المحتوى',
    href: '/content',
    icon: Video,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-64 border-l border-border bg-sidebar">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <h1 className="text-xl font-bold text-sidebar-foreground">مركز الإنتاجية</h1>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
        
        <div className="border-t border-sidebar-border p-4">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <Settings className="h-5 w-5" />
            <span>الإعدادات</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
