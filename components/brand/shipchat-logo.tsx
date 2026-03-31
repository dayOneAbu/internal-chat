import { cn } from "@/lib/utils";

type ShipChatMarkProps = {
  className?: string;
  iconClassName?: string;
};

export function ShipChatMark({
  className,
  iconClassName,
}: ShipChatMarkProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-[#2ea48c] text-white shadow-[0_16px_34px_rgba(46,164,140,0.22)]",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("size-5", iconClassName)}
        fill="none"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

type ShipChatLogoProps = {
  className?: string;
  markClassName?: string;
  nameClassName?: string;
  subtitle?: string;
};

export function ShipChatLogo({
  className,
  markClassName,
  nameClassName,
  subtitle,
}: ShipChatLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ShipChatMark className={cn("size-12", markClassName)} />
      <div className="min-w-0">
        <div className={cn("text-lg font-semibold tracking-tight text-slate-950", nameClassName)}>
          ShipChat
        </div>
        {subtitle ? (
          <div className="text-sm text-slate-500">{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}
