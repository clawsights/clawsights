import {
  formatPercentile,
  percentileColor,
  percentileBgColor,
} from "@/lib/percentiles";

interface PercentileBadgeProps {
  percentile: number;
  className?: string;
}

export function PercentileBadge({
  percentile,
  className = "",
}: PercentileBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${percentileColor(percentile)} ${percentileBgColor(percentile)} ${className}`}
    >
      {formatPercentile(percentile)}
    </span>
  );
}
