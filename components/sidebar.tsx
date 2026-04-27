'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Home, CheckSquare, Video, Settings, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

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

function NavContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname()

  return (
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
              onClick={onItemClick}
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
          onClick={onItemClick}
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <Settings className="h-5 w-5" />
          <span>الإعدادات</span>
        </Link>
      </div>
    </div>
  )
}

// Mobile Header with Menu
export function MobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <h1 className="text-lg font-bold">مركز الإنتاجية</h1>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">فتح القائمة</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 p-0 bg-sidebar">
          <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
          <NavContent onItemClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}

// Desktop Sidebar
export function Sidebar() {
  return (
    <aside className="fixed right-0 top-0 z-40 hidden h-screen w-64 border-l border-border bg-sidebar md:block">
      <NavContent />
    </aside>
  )
}
