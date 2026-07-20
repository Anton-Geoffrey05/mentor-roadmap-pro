import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-[var(--radius)] border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
