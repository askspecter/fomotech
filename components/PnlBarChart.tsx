"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtUsd } from "@/lib/format";

export interface PnlDatum {
  handle: string;
  pnlUsd: number;
}

export default function PnlBarChart({ data }: { data: PnlDatum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <XAxis
            type="number"
            tick={{ fill: "#8a91a3", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtUsd(Number(v), { compact: true })}
          />
          <YAxis
            type="category"
            dataKey="handle"
            width={104}
            tick={{ fill: "#c7ccd8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(108,92,231,0.08)" }}
            contentStyle={{
              background: "#13151c",
              border: "1px solid #262a36",
              borderRadius: 12,
              color: "#e8eaf0",
            }}
            formatter={(v: number) => [fmtUsd(v), "PnL"]}
          />
          <Bar dataKey="pnlUsd" radius={[0, 6, 6, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.pnlUsd >= 0 ? "#16c784" : "#ea3943"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
