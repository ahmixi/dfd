"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Navigation } from "@/components/navigation"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
  className?: string
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const isMobile = useIsMobile()

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-full">
        {/* Sidebar Navigation (Desktop) */}
        {!isMobile && (
          <Navigation
            variant="full"
            className="hidden md:flex h-screen sticky top-0 p-4 border-r border-border"
          />
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 min-h-screen pb-20 md:pb-8",
          className
        )}>
          {children}
        </main>

        {/* Bottom Navigation (Mobile) */}
        {isMobile && <Navigation variant="mobile" />}
      </div>
    </div>
  )
}