import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const loadingDotsVariants = cva("flex items-center", {
  variants: {
    size: {
      sm: "gap-1 py-0.5 text-muted-foreground/40",
      md: "gap-1 py-1 text-muted-foreground/40",
      lg: "gap-1.5 py-1.5 text-muted-foreground/40",
    },
    tone: {
      muted: "text-muted-foreground/40",
      primary: "text-primary",
      foreground: "text-foreground/60",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "muted",
  },
});

const dotVariants = cva("animate-bounce rounded-full bg-current", {
  variants: {
    size: {
      sm: "size-1",
      md: "size-1.5",
      lg: "size-2",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

type LoadingDotsProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof loadingDotsVariants> & {
    dotCount?: number;
  };

function LoadingDots({
  className,
  size,
  tone,
  dotCount = 3,
  ...props
}: LoadingDotsProps) {
  return (
    <div
      className={cn(loadingDotsVariants({ size, tone }), className)}
      {...props}
    >
      {Array.from({ length: dotCount }).map((_, index) => (
        <span
          key={index}
          className={dotVariants({ size })}
          style={{
            animationDelay: `${index * 150}ms`,
          }}
        />
      ))}
    </div>
  );
}

export { LoadingDots, loadingDotsVariants, dotVariants };
