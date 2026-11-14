export function scoreTone(score: number): string {
  if (score >= 75) return "bg-emerald-100 text-emerald-800";
  if (score >= 50) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export function barTone(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-slate-400";
}

export function formatExperienceLevel(level: string | null): string {
  if (!level) return '';
  const map: Record<string, string> = {
    internship: 'Internship',
    fresher: 'Fresher / Entry',
    '0_2': '0–2 yrs',
    '2_5': '2–5 yrs',
    '5_8': '5–8 yrs',
    '8_plus': '8+ yrs',
  };
  return map[level] ?? level;
}

export function formatFreshness(
  postedAt: string | null,
  createdAt: string
): string {
  const iso = postedAt ?? createdAt;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return "Recently synced";
  const diffDays = Math.max(0, Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return "Posted today";
  if (diffDays === 1) return "Posted 1d ago";
  if (diffDays < 30) return `Posted ${diffDays}d ago`;
  const months = Math.floor(diffDays / 30);
  return months === 1 ? "Posted 1mo ago" : `Posted ${months}mo ago`;
}

