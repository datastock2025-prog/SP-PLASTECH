import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-xs font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500",
        outline:
          "border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
        destructive:
          "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
        link: "text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400",
      },
      size: {
        default: "h-9 gap-1.5 px-3.5 py-1.5",
        xs: "h-6 gap-1 rounded-md px-2 text-[11px]",
        sm: "h-7 gap-1 rounded-md px-2.5 text-xs",
        lg: "h-10 gap-2 px-4 text-sm",
        icon: "size-8 rounded-lg",
        "icon-xs": "size-6 rounded-md",
        "icon-sm": "size-7 rounded-md",
        "icon-lg": "size-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
