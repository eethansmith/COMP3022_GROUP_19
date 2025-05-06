'use client';

// StatusOvertime.jsx
// ---------------
// Faceted "island status over time" visualisation rewritten to match the
// requested skeleton.  The component receives a CSV path via props, filters
// by `day` (UTC date‑of‑month) when provided, and auto‑sizes to the parent
// container.

import React, { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import * as d3 from 'd3';

const SCHEMES = ['equal', 'sqrt_n', 'intensity'];

export default function StatusOvertime({
  day,
  csvUrl = '/data/resources/Q3/island-series.csv', // allow parent to override location
  ...props
}) {
  /* --------------------------- data state --------------------------- */
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  /* --------------------------- load CSV ----------------------------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await d3.csv(csvUrl, d3.autoType);
        if (cancelled) return;

        // Optional day filter (UTC 1‑based date)
        const filtered = day
          ? raw.filter((d) => new Date(d.time_bin).getUTCDate() === Number(day))
          : raw;

        // Pre‑compute ribbon bounds: composite ± 1.96 × combined_uncertainty
        const prepared = filtered.map((d) => {
          const upper = Math.min(1, d.composite + 1.96 * d.combined_uncertainty);
          const lower = Math.max(0, d.composite - 1.96 * d.combined_uncertainty);
          return { ...d, upper, lower };
        });

        setRows(prepared);
      } catch (e) {
        console.error(e);
        setError(e);
      }
    })();

    return () => (cancelled = true);
  }, [csvUrl, day]);

  /* --------------------------- organise by scheme ------------------- */
  const rowsByScheme = useMemo(() => {
    if (!rows) return null;
    return SCHEMES.reduce((acc, scheme) => {
      acc[scheme] = rows.filter((d) => d.scheme === scheme);
      return acc;
    }, {});
  }, [rows]);

  /* --------------------------- render ------------------------------- */
  if (error) return <div className="text-red-600">Failed to load: {error.message}</div>;
  if (!rows) return <div className="italic">Loading island status…</div>;

  return (
    <div style={{ width: '100%', height: '100%' }} {...props}>
      {/* Visually hidden heading for accessibility */}
      <h2 className="sr-only">Island status over time{day ? ` (Day ${day})` : ''}</h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 w-full h-full">
        {SCHEMES.map((scheme) => (
          <div key={scheme} className="flex flex-col w-full h-96 xl:h-full shadow rounded-lg p-2">
            <h3 className="text-base font-semibold capitalize mb-1">
              {scheme.replace('_', ' ')} weighting
            </h3>

            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rowsByScheme[scheme]}>       
                <CartesianGrid strokeDasharray="3 3" />

                {/* axes */}
                <XAxis
                  dataKey="time_bin"
                  tickFormatter={(v) => v.slice(11, 16)} // show HH:MM
                  minTickGap={20}
                  interval="preserveStartEnd"
                />
                <YAxis yAxisId="left" domain={[0, 1]} tickCount={6} />
                <YAxis yAxisId="right" orientation="right" hide />

                {/* ribbon – lower/upper stack */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="lower"
                  stackId="ribbon"
                  stroke="none"
                  fillOpacity={0}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="upper"
                  stackId="ribbon"
                  stroke="none"
                  fillOpacity={0.3}
                />

                {/* composite curve */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="composite"
                  strokeWidth={2}
                  dot={false}
                />

                {/* uncertainty drivers */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="samp_uncertainty"
                  strokeDasharray="4 4"
                  strokeOpacity={0.9}
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cover_uncertainty"
                  strokeDasharray="2 2"
                  strokeOpacity={0.9}
                  dot={false}
                />

                {/* report volume bars */}
                <Bar
                  yAxisId="right"
                  dataKey="n_reports"
                  barSize={4}
                  fill="currentColor"
                  fillOpacity={0.15}
                />

                <Tooltip
                  contentStyle={{ fontSize: '0.8rem' }}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleString('en-GB', {
                      timeZone: 'UTC',
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  }
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
