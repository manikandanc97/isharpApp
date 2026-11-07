import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex cursor-pointer shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-brand-red text-white shadow-xs hover:bg-brand-red-hover hover:shadow-md active:scale-95",
        primary:
          "bg-brand-red text-white shadow-xs hover:bg-brand-red-hover hover:shadow-md active:scale-95",
        outline:
          "border-slate-300 bg-white text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900",
        secondary:
          "bg-brand-blue text-white shadow-xs hover:bg-brand-blue-hover hover:shadow-md active:scale-95",
        "secondary-soft":
          "bg-blue-50 text-brand-blue border border-blue-200/80 hover:bg-blue-100 hover:border-blue-300",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 aria-expanded:bg-slate-100 aria-expanded:text-slate-900",
        destructive:
          "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300",
        link: "text-brand-blue underline-offset-4 hover:underline hover:text-brand-blue-hover",
      },
      size: {
        default:
          "h-10 gap-2 rounded-full px-5 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-7 gap-1 rounded-full px-2.5 text-xs in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8.5 gap-1.5 rounded-full px-3.5 text-xs in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 rounded-full px-6 text-sm sm:text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9 rounded-full",
        "icon-xs":
          "size-6 rounded-full in-data-[slot=button-group]:rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7.5 rounded-full in-data-[slot=button-group]:rounded-full",
        "icon-lg": "size-10 rounded-full",
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
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const resolvedNativeButton =
    nativeButton !== undefined
      ? nativeButton
      : props.render !== undefined
        ? false
        : undefined;

  return (
    <ButtonPrimitive
      data-slot="button"
      nativeButton={resolvedNativeButton}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
