'use client'

import { ThemeToggle } from '@/components/ui/theme-toggle'

/** Theme switcher for mobile — desktop uses sidebar Appearance control */
export function ThemeBar() {
  return (
    <div className="mb-4 flex items-center justify-end gap-2 md:hidden">
      <ThemeToggle className="w-full max-w-[14rem]" />
    </div>
  )
}
