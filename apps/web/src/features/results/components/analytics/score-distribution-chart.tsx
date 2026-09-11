'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ExamAttemptItem } from '../../types';

interface ScoreDistributionChartProps {
  attempts: ExamAttemptItem[];
}

export function ScoreDistributionChart({ attempts }: ScoreDistributionChartProps) {
  const chartData = React.useMemo(() => {
    const bins = [
      {
        range: '0 - 49%',
        label: 'Fail (< 50%)',
        count: 0,
        color: 'var(--color-rose-500, #f43f5e)',
      },
      {
        range: '50 - 69%',
        label: 'Average (50-69%)',
        count: 0,
        color: 'var(--color-amber-500, #f59e0b)',
      },
      {
        range: '70 - 84%',
        label: 'Good (70-84%)',
        count: 0,
        color: 'var(--color-sky-500, #0ea5e9)',
      },
      {
        range: '85 - 100%',
        label: 'Excellent (85-100%)',
        count: 0,
        color: 'var(--color-emerald-500, #10b981)',
      },
    ];

    for (const a of attempts) {
      const pct = a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0;
      if (pct < 50) {
        bins[0].count++;
      } else if (pct < 70) {
        bins[1].count++;
      } else if (pct < 85) {
        bins[2].count++;
      } else {
        bins[3].count++;
      }
    }

    return bins;
  }, [attempts]);

  const total = attempts.length;

  return (
    <Card className="border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Score Distribution</CardTitle>
        <span className="text-xs text-muted-foreground font-mono">
          {total} submission{total !== 1 ? 's' : ''}
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
              <XAxis
                dataKey="range"
                tickLine={false}
                axisLine={false}
                className="text-[11px] fill-muted-foreground"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                className="text-[11px] fill-muted-foreground"
              />
              <Tooltip
                cursor={{ fill: 'currentColor', opacity: 0.05 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const pct = total > 0 ? Math.round((data.count / total) * 100) : 0;
                    return (
                      <div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-xs">
                        <div className="font-semibold text-foreground">{data.label}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-primary font-bold">
                            {data.count} students
                          </span>
                          <span className="text-muted-foreground">({pct}% of class)</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border/40 mt-2">
          {chartData.map((b) => (
            <div key={b.range} className="flex items-center gap-1.5 text-[11px]">
              <div
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: b.color }}
              />
              <span className="text-muted-foreground truncate">{b.range}:</span>
              <span className="font-mono font-medium text-foreground ml-auto">{b.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
