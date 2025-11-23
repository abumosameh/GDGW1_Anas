"use client";

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TrendData {
  language: string;
  years: number[];
  counts: number[];
  growth_rate: number;
  verdict: string;
  prediction: number;
  accuracy: number;
}

const brandColors: { [key: string]: string } = {
  python: '#3776AB',
  javascript: '#D4B830',
  typescript: '#3178C6',
  java: '#EA2D2E',
  'c++': '#F34B7D',
  go: '#00ADD8',
  rust: '#000000',
  sql: '#777777',
};

export default function TrendChart({ trends }: { trends: TrendData[] }) {
  if (!trends || trends.length === 0) return <p>No data available.</p>;

  // 1. 🛡️ DEDUPLICATION & CLEANUP
  const uniqueTrends = useMemo(() => {
    const map = new Map();
    trends.forEach(item => {
      // Normalize key to lowercase to catch "SQL" vs "sql" duplicates
      const key = item.language.trim().toLowerCase();
      if (!map.has(key)) {
        // Fix Negative Predictions (Clamp to 0)
        if (item.prediction < 0) item.prediction = 0;

        // Fix Negative Counts in history if any exists
        item.counts = item.counts.map(c => c < 0 ? 0 : c);

        map.set(key, item);
      }
    });
    return Array.from(map.values()) as TrendData[];
  }, [trends]);

  // Sort by prediction for the cards
  const sortedTrends = [...uniqueTrends].sort((a, b) => b.prediction - a.prediction);

  const labels = uniqueTrends[0].years.map(y => y === 2025 ? '2025 (Predicted)' : y.toString());

  const datasets = uniqueTrends.map((item) => {
    const langKey = item.language.toLowerCase();
    const color = brandColors[langKey] || '#999999';

    return {
      label: item.language.toUpperCase(),
      data: item.counts,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 8,
      segment: {
        borderDash: (ctx: any) => ctx.p0DataIndex >= item.counts.length - 2 ? [6, 6] : undefined,
      },
      tension: 0.4,
    };
  });

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { usePointStyle: true, padding: 20, font: { size: 12, weight: 'bold' as const } }
      },
      title: {
        display: true,
        text: 'Tech Stack Popularity (Polynomial Regression Projection)',
        font: { size: 16 }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: 12,
        itemSort: (a: any, b: any) => b.raw - a.raw,
        callbacks: {
          label: function(context: any) {
             if (context.label.includes('Predicted')) {
               return `${context.dataset.label}: ${context.raw.toLocaleString()} (AI Projection)`;
             }
             return `${context.dataset.label}: ${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: { grid: { color: '#f3f3f3' }, min: 0 }, // Force Y-axis to stay positive
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-xl border border-gray-100">
      {/* KEY PROP FIX:
         By adding key={JSON.stringify(uniqueTrends)}, we force React to
         destroy and recreate the chart whenever data changes.
         This kills the ghosts. 👻
      */}
      <Line
        key={JSON.stringify(uniqueTrends)}
        options={options}
        data={chartData}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {sortedTrends.map((t) => {
           const cardColor = brandColors[t.language.toLowerCase()] || '#ccc';

           return (
            <div key={t.language} className="border-t-4 p-4 rounded bg-gray-50 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: cardColor }}>
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold px-2 py-1 rounded bg-gray-200 text-gray-700">
                    Confidence: {t.accuracy}%
                 </span>
              </div>
              <h3 className="font-bold text-lg uppercase" style={{ color: cardColor }}>{t.language}</h3>
              <p className="text-sm font-bold text-gray-700 mt-1">
                 2025: {t.prediction.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1 italic">{t.verdict}</p>
            </div>
           );
        })}
      </div>
    </div>
  );
}