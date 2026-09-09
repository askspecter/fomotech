"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimePoint } from "@/lib/types";
import { fmtUsd } from "@/lib/format";

export default function VolumeChart({ data }: { data: TimePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" tick={{ fill: "#8a91a3", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "#8a91a3", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(v) => fmtUsd(Number(v), { compact: true })}
          />
          <Tooltip
            contentStyle={{
              background: "#13151c",
              border: "1px solid #262a36",
              borderRadius: 12,
              color: "#e8eaf0",
            }}
            formatter={(v: number) => [fmtUsd(v, { compact: true }), "Volume"]}
          />
          <Area type="monotone" dataKey="value" stroke="#8b7aff" strokeWidth={2} fill="url(#vol)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
