"use client";

import { useEffect, useMemo, useState } from "react";

type RoomLog = {
  id: number;
  roomName: string;
  count: number;
  createdAt: string;
};

const sampleCapacity = 24;

const sampleLogs: RoomLog[] = [
  { id: 1, roomName: "Study Room A", count: 12, createdAt: "2026-07-07 09:00" },
  { id: 2, roomName: "Study Room A", count: 16, createdAt: "2026-07-07 09:10" },
  { id: 3, roomName: "Study Room A", count: 18, createdAt: "2026-07-07 09:20" },
  { id: 4, roomName: "Study Room A", count: 21, createdAt: "2026-07-07 09:30" },
  { id: 5, roomName: "Study Room A", count: 18, createdAt: "2026-07-07 09:40" },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function mapRoomLog(row: {
  id: number;
  room_name: string;
  count: number;
  created_at: string;
}): RoomLog {
  return {
    id: row.id,
    roomName: row.room_name,
    count: row.count,
    createdAt: new Date(row.created_at).toLocaleString("ko-KR", {
      dateStyle: "short",
      timeStyle: "short",
    }),
  };
}

function getTrafficState(count: number, capacity: number) {
  const ratio = capacity === 0 ? 0 : count / capacity;

  if (ratio < 0.5) {
    return {
      label: "여유",
      tone: "bg-emerald-500",
      card: "from-emerald-50 to-lime-50",
      ring: "ring-emerald-200",
    };
  }

  if (ratio < 0.8) {
    return {
      label: "보통",
      tone: "bg-amber-500",
      card: "from-amber-50 to-orange-50",
      ring: "ring-amber-200",
    };
  }

  return {
    label: "혼잡",
    tone: "bg-rose-500",
    card: "from-rose-50 to-red-50",
    ring: "ring-rose-200",
  };
}

function TrendSparkline({ values }: { values: number[] }) {
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const normalized = values.map((value, index) => {
    const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
    const y = 100 - ((value - minValue) / Math.max(maxValue - minValue, 1)) * 100;
    return `${x},${y}`;
  });

  return (
    <svg viewBox="0 0 100 100" className="h-28 w-full overflow-visible">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={normalized.join(" ")}
      />
    </svg>
  );
}

async function fetchRoomLogs(): Promise<RoomLog[]> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return sampleLogs;
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/room_logs?select=id,room_name,count,created_at&order=created_at.desc&limit=10`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load room logs: ${response.status}`);
  }

  const rows = (await response.json()) as Array<{
    id: number;
    room_name: string;
    count: number;
    created_at: string;
  }>;

  return rows.map(mapRoomLog);
}

export default function Phase3DashboardPage() {
  const [logs, setLogs] = useState<RoomLog[]>(sampleLogs);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const nextLogs = await fetchRoomLogs();
        if (cancelled) {
          return;
        }

        setLogs(nextLogs.length > 0 ? nextLogs : sampleLogs);
        setLoadError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLogs(sampleLogs);
        setLoadError(error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const latestLog = logs[0] ?? sampleLogs[sampleLogs.length - 1];
  const currentCount = latestLog?.count ?? 0;
  const currentState = getTrafficState(currentCount, sampleCapacity);
  const counts = useMemo(() => logs.slice().reverse().map((log) => log.count), [logs]);
  const dataSourceLabel = supabaseUrl && supabaseAnonKey ? "Supabase" : "샘플 데이터";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">Library Occupancy</p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                실시간 스터디 공간 점유 현황 대시보드
              </h1>
              <p className="text-base leading-7 text-slate-300">
                수기 체크를 대체하는 자동 인원 카운팅 시스템의 사용자 UI와 관리자 UI 초안입니다.
              </p>
            </div>

            <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${currentState.card} p-6 text-slate-950 shadow-xl ${currentState.ring} ring-1`}>
              <div className="flex items-center gap-3">
                <span className={`h-4 w-4 rounded-full ${currentState.tone}`} />
                <span className="text-sm font-semibold uppercase tracking-[0.28em]">현재 상태</span>
              </div>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-5xl font-bold">{currentCount}</span>
                <span className="pb-1 text-lg font-medium">명</span>
              </div>
              <p className="mt-2 text-sm font-medium">{currentState.label}</p>
              <p className="mt-1 text-sm text-slate-700">
                수용 인원 {sampleCapacity}명 기준 약 {Math.round((currentCount / sampleCapacity) * 100)}%
              </p>
            </div>
          </div>
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">데이터 소스: {dataSourceLabel}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            {isLoading ? "불러오는 중..." : "실시간 갱신 완료"}
          </span>
          {loadError ? (
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-amber-200">
              {loadError}
            </span>
          ) : null}
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">User UI</p>
                <h2 className="mt-2 text-2xl font-semibold">신호등 상태 표시</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> 여유
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> 보통
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> 혼잡
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: "여유", count: 6, active: currentState.label === "여유" },
                { label: "보통", count: 14, active: currentState.label === "보통" },
                { label: "혼잡", count: 21, active: currentState.label === "혼잡" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-5 transition ${item.active ? "border-white/20 bg-white/10" : "border-white/10 bg-white/5"}`}
                >
                  <div className={`h-3 w-3 rounded-full ${item.label === "여유" ? "bg-emerald-400" : item.label === "보통" ? "bg-amber-400" : "bg-rose-400"}`} />
                  <p className="mt-4 text-sm text-slate-300">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{item.count}명</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {item.active ? "현재 상태" : "예시 기준값"}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">Admin UI</p>
            <h2 className="mt-2 text-2xl font-semibold">최근 인원 변화 추이</h2>
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-cyan-300">
              <TrendSparkline values={counts} />
            </div>
            <div className="mt-6 space-y-3">
              {logs.slice().reverse().map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-100">{log.roomName}</p>
                    <p className="text-sm text-slate-400">{log.createdAt}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-slate-50">{log.count}</p>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">people</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
              최신 로그: {latestLog.roomName} / {latestLog.count}명 / {latestLog.createdAt}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
