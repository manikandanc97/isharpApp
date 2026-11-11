"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import {
  forwardRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends ComponentPropsWithoutRef<"input"> {
  hasLeftIcon?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, hasLeftIcon = true, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          className={cn(
            "h-10.5 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm font-normal text-slate-900 shadow-2xs transition-colors outline-hidden placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15 aria-invalid:border-rose-500 aria-invalid:ring-3 aria-invalid:ring-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60",
            className,
            // Icon padding must come last so it always wins over any px-* in className.
            hasLeftIcon ? "pl-9 pr-10" : "pr-10",
          )}
        />
        {hasLeftIcon && (
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        )}
        <button
          type="button"
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition hover:text-slate-700 focus:outline-hidden disabled:cursor-not-allowed"
          onClick={() => setShowPassword((visible) => !visible)}
        >
          {showPassword ? (
            <EyeOff aria-hidden="true" className="size-3.5" />
          ) : (
            <Eye aria-hidden="true" className="size-3.5" />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

