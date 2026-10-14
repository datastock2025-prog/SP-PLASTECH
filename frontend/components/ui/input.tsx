import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-2xs transition-all placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-indigo-400 dark:focus-visible:ring-indigo-900/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
