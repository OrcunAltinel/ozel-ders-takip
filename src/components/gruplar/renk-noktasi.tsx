import { cn } from "cn";

export function RenkNoktasi({
  renk,
  className,
}: {
  renk: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: renk }}
    />
  );
}
