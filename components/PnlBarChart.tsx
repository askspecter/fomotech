"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtUsd } from "@/lib/format";

export interface PnlDatum {
  handle: string;
  pnlUsd: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: PnlDatum }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-3 py-2 shadow-card">
      <div className="font-display text-sm font-semibold">@{d.handle}</div>
      <div className={`text-sm tabular-nums ${d.pnlUsd >= 0 ? "text-up" : "text-down"}`}>{fmtUsd(d.pnlUsd)}</div>
    </div>
  );
}

export default function PnlBarChart({ data }: { data: PnlDatum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }} barCategoryGap={6}>
          <defs>
            <linearGradient id="pnlUp" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2fd08a" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.95} />
            </linearGradient>
            <linearGradient id="pnlDown" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f6465d" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#ff7a8a" stopOpacity={0.9} />
            </linearGradient>
          </defs>
          <XAxis
            type="number"
            tick={{ fill: "#5f6580", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtUsd(Number(v), { compact: true })}
          />
          <YAxis
            type="category"
            dataKey="handle"
            width={104}
            tick={{ fill: "#b7bcd0", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: "rgba(124,108,255,0.07)" }} content={<CustomTooltip />} />
          <Bar dataKey="pnlUsd" radius={[0, 6, 6, 0]} maxBarSize={16}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.pnlUsd >= 0 ? "url(#pnlUp)" : "url(#pnlDown)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
