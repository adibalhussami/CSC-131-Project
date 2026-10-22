"use client";

import { useEffect, useRef } from "react";
import Chart, { type ChartConfiguration } from "chart.js/auto";

// Same palette as the Spring dashboard.
const statusColors: Record<string, string> = { GREEN: "#34d399", YELLOW: "#fbbf24", RED: "#f87171" };
const accent = "#8b7bf7";
const gridColor = "rgba(255,255,255,0.06)";
const tickColor = "#9a93bb";
const legend = { labels: { color: tickColor } };

type Series = Record<string, number>;

function ChartCanvas({ config, className = "chart-body" }: { config: ChartConfiguration; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const json = JSON.stringify(config);
  useEffect(() => {
    const chart = new Chart(ref.current!, JSON.parse(json));
    return () => chart.destroy();
  }, [json]);
  return <div className={className}><canvas ref={ref} /></div>;
}

export function StatusChart({ data }: { data: Series }) {
  return <ChartCanvas config={{
    type: "doughnut",
    data: {
      labels: Object.keys(data),
      datasets: [{ data: Object.values(data), backgroundColor: Object.keys(data).map(k => statusColors[k] || "#999"), borderColor: "#1e1b2e" }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend } },
  }} />;
}

export function TrendChart({ data }: { data: Series }) {
  return <ChartCanvas config={{
    type: "line",
    data: {
      labels: Object.keys(data),
      datasets: [{ label: "Avg Fullness %", data: Object.values(data), borderColor: accent, backgroundColor: "rgba(139,123,247,0.18)", tension: 0.25, fill: true }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { color: tickColor }, grid: { color: gridColor } },
        x: { ticks: { color: tickColor }, grid: { color: gridColor } },
      },
      plugins: { legend },
    },
  }} />;
}

export function BuildingChart({ data }: { data: Series }) {
  return <ChartCanvas config={{
    type: "bar",
    data: { labels: Object.keys(data), datasets: [{ label: "Avg Fullness %", data: Object.values(data), backgroundColor: accent }] },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      scales: {
        x: { beginAtZero: true, max: 100, ticks: { color: tickColor }, grid: { color: gridColor } },
        y: { ticks: { color: tickColor }, grid: { color: gridColor } },
      },
      plugins: { legend },
    },
  }} />;
}

export function Sparkline({ data }: { data: Series }) {
  return <ChartCanvas className="spark-body" config={{
    type: "line",
    data: { labels: Object.keys(data), datasets: [{ data: Object.values(data), borderColor: accent, backgroundColor: "transparent", tension: 0.35, pointRadius: 0, borderWidth: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
    },
  }} />;
}
