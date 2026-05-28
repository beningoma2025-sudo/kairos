import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";

// ── Badge definitions ────────────────────────────────────────────
const BADGES = [
  { id: "welcome",        emoji: "🌟", label: "Welcome Home",    desc: "Joined Kairo",               check: (s: Stats) => s.totalCompletions >= 0 },
  { id: "first_step",     emoji: "▶️", label: "First Step",      desc: "Completed first video",      check: (s: Stats) => s.totalCompletions >= 1 },
  { id: "on_fire",        emoji: "🔥", label: "On Fire",         desc: "7-day watch streak",         check: (s: Stats) => s.currentStreak >= 7 },
  { id: "devoted_learner",emoji: "📚", label: "Devoted Learner", desc: "Watched 10 teachings",       check: (s: Stats) => s.teachingCompletions >= 10 },
  { id: "faith_strong",   emoji: "💪", label: "Faith Strong",    desc: "30-day watch streak",        check: (s: Stats) => s.currentStreak >= 30 },
  { id: "century",        emoji: "🏆", label: "Century",         desc: "Completed 100 videos",       check: (s: Stats) => s.totalCompletions >= 100 },
  { id: "faithful",       emoji: "⏱️", label: "Faithful",        desc: "500 minutes of content",     check: (s: Stats) => s.totalMinutes >= 500 },
  { id: "legend",         emoji: "✨", label: "Kairo Legend",    desc: "365-day watch streak",       check: (s: Stats) => s.longestStreak >= 365 },
] as const;

const LEVELS = [
  { name: "Seeker",   min: 0,    max: 50 },
  { name: "Believer", min: 51,   max: 200 },
  { name: "Devoted",  min: 201,  max: 500 },
  { name: "Faithful", min: 501,  max: 1000 },
  { name: "Pillar",   min: 1001, max: 2000 },
  { name: "Champion", min: 2001, max: Infinity },
] as const;

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  teachingCompletions: number;
  totalMinutes: number;
}

// ── Streak computation ───────────────────────────────────────────
function computeStreaks(watchDates: Date[]): { current: number; longest: number } {
  if (watchDates.length === 0) return { current: 0, longest: 0 };

  const toDay = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const todayStr = toDay(new Date());
  const yesterdayStr = toDay(new Date(Date.now() - 86_400_000));

  // Unique days sorted descending
  const days = [...new Set(watchDates.map(toDay))].sort((a, b) => b.localeCompare(a));

  // Streak is only active if watched today or yesterday
  const streakActive = days[0] === todayStr || days[0] === yesterdayStr;
  if (!streakActive) {
    return { current: 0, longest: computeLongest(days) };
  }

  let current = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + "T12:00:00");
    const curr = new Date(days[i] + "T12:00:00");
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diff === 1) {
      current++;
    } else {
      break;
    }
  }

  return { current, longest: Math.max(current, computeLongest(days)) };
}

function computeLongest(sortedDays: string[]): number {
  if (sortedDays.length === 0) return 0;
  let max = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1] + "T12:00:00");
    const curr = new Date(sortedDays[i] + "T12:00:00");
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diff === 1) {
      run++;
      if (run > max) max = run;
    } else {
      run = 1;
    }
  }
  return max;
}

// ── XP calculation ───────────────────────────────────────────────
function computeXP(s: Stats): number {
  return (
    s.totalCompletions * 10 +
    s.teachingCompletions * 10 + // extra 10 for teachings
    s.currentStreak * 5 +
    Math.floor(s.totalMinutes / 60) * 3
  );
}

function getLevel(xp: number) {
  const lvl = [...LEVELS].reverse().find((l) => xp >= l.min) ?? LEVELS[0];
  const next = LEVELS[LEVELS.indexOf(lvl as (typeof LEVELS)[number]) + 1];
  return {
    name: lvl.name,
    xp,
    nextLevelXP: next?.min ?? lvl.max,
    progress: next
      ? Math.min(((xp - lvl.min) / (next.min - lvl.min)) * 100, 100)
      : 100,
  };
}

// ── Handler ──────────────────────────────────────────────────────
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return new Response("Not found", { status: 404 });

  const history = await prisma.watchHistory.findMany({
    where: { userId: user.id },
    select: {
      watchedAt: true,
      completedAt: true,
      progressSeconds: true,
      content: { select: { type: true } },
    },
  });

  const completed = history.filter((h) => h.completedAt !== null);
  const { current, longest } = computeStreaks(history.map((h) => h.watchedAt));

  const stats: Stats = {
    currentStreak: current,
    longestStreak: longest,
    totalCompletions: completed.length,
    teachingCompletions: completed.filter((h) => h.content.type === "TEACHING").length,
    totalMinutes: Math.floor(history.reduce((sum, h) => sum + h.progressSeconds, 0) / 60),
  };

  const xp = computeXP(stats);
  const level = getLevel(xp);

  const badges = BADGES.map((b) => ({
    id: b.id,
    emoji: b.emoji,
    label: b.label,
    desc: b.desc,
    earned: b.check(stats),
  }));

  return Response.json(
    {
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      totalCompletions: stats.totalCompletions,
      totalMinutes: stats.totalMinutes,
      level,
      badges,
    },
    {
      headers: { "Cache-Control": "private, max-age=60" },
    }
  );
}
