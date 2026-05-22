'use client'

import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SidebarContent } from '@/components/sidebar-content'

export function AppSidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer trigger */}
      <div className="lg:hidden fixed top-0 left-0 z-50 flex items-center h-14 px-4">
        <Sheet>
          <SheetTrigger render={
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200 hover:bg-slate-900">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
          } />
          <SheetContent side="left" className="p-0 w-64 border-slate-800 bg-slate-950">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
