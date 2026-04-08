import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-white",
        outline: "border-slate-200 text-slate-600",
        warning: "border-transparent bg-amber-100 text-amber-700",
        success: "border-transparent bg-green-100 text-green-700",
        error: "border-transparent bg-red-100 text-red-700",
        info: "border-transparent bg-sky-100 text-sky-700",
        ghost: "border-slate-100 bg-slate-50 text-slate-600",
        primary: "border-transparent bg-[#4A90A4]/10 text-[#4A90A4]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
