import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const brandIconVariants = cva(
  "grid shrink-0 place-items-center font-bold tracking-tight",
  {
    variants: {
      size: {
        sm: "size-5.5 rounded-[7px] text-[12px]",
        md: "size-8 rounded-lg typo-bold11",
      },
      variant: {
        brand: "brand-icon-gradient text-white",
        subtle: "bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "brand",
    },
  },
);

type BrandIconProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof brandIconVariants>;

export function BrandIcon({
  className,
  size,
  variant,
  ...props
}: BrandIconProps) {
  return (
    <div
      className={cn(brandIconVariants({ size, variant }), className)}
      {...props}
    >
      τ
    </div>
  );
}
