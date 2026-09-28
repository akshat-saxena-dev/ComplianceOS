import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label: string; positive?: boolean };
  accent?: "blue" | "green" | "red" | "amber" | "purple";
}

const accentMap = {
  blue: {
    bg: "bg-electric-blue/10 dark:bg-electric-blue/15",
    text: "text-electric-blue",
    border: "border-electric-blue/20",
    value: "text-electric-blue",
  },
  green: {
    bg: "bg-neon-green/10 dark:bg-neon-green/15",
    text: "text-neon-green",
    border: "border-neon-green/20",
    value: "text-neon-green",
  },
  red: {
    bg: "bg-crimson/10 dark:bg-crimson/15",
    text: "text-crimson",
    border: "border-crimson/20",
    value: "text-crimson",
  },
  amber: {
    bg: "bg-amber-warn/10 dark:bg-amber-warn/15",
    text: "text-amber-warn",
    border: "border-amber-warn/20",
    value: "text-amber-warn",
  },
  purple: {
    bg: "bg-purple-critical/10 dark:bg-purple-critical/15",
    text: "text-purple-critical",
    border: "border-purple-critical/20",
    value: "text-purple-critical",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = "blue",
}: StatCardProps) {
  const colors = accentMap[accent];

  return (
    <div className={`card p-5 border ${colors.border} hover:shadow-md transition-shadow duration-200 animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            {title}
          </p>
          <p className={`text-3xl font-bold ${colors.value} tabular-nums leading-none`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{subtitle}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
          <span
            className={`text-xs font-medium ${
              trend.positive ? "text-neon-green" : "text-crimson"
            }`}
          >
            {trend.positive ? "▲" : "▼"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
