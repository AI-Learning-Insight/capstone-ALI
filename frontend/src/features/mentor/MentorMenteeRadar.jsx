// src/features/mentor/MentorMenteeRadar.jsx
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import Card from "../../components/ui/Card.jsx";
import { useTheme } from "../../lib/theme-context";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function MentorMenteeRadar({ stats }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const palette = isDark
    ? {
        fill: "rgba(16, 185, 129, 0.25)", // emerald for dark mode
        line: "rgba(16, 185, 129, 1)",
        point: "rgba(16, 185, 129, 1)",
        tick: "#CBD5E1",
        label: "#E2E8F0",
        grid: "rgba(148, 163, 184, 0.35)",
      }
    : {
        fill: "rgba(59, 130, 246, 0.18)", // sky/blue for light mode
        line: "rgba(37, 99, 235, 0.95)",
        point: "rgba(37, 99, 235, 1)",
        tick: "#475569",
        label: "#1E293B",
        grid: "rgba(148, 163, 184, 0.25)",
      };

  // Jika stats belum ada, tidak usah render chart
  if (!stats) return null;

  // Kita hanya pakai 3 axis: Consistent, Fast, Reflective
  const labels = ["Consistent", "Fast", "Reflective"];

  // Mapping dari struktur stats kamu:
  // - totalMentee        -> tidak dipakai di radar
  // - consistentCount    -> Consistent
  // - fastCount          -> Fast
  // - reflectiveCount    -> Reflective
  const data = {
    labels,
    datasets: [
      {
        label: "Jumlah mentee",
        data: [
          stats?.consistentCount ?? 0,
          stats?.fastCount ?? 0,
          stats?.reflectiveCount ?? 0,
        ],
        backgroundColor: palette.fill,
        borderColor: palette.line,
        borderWidth: 2,
        pointBackgroundColor: palette.point,
        pointBorderColor: "#ffffff",
        pointRadius: 3,
      },
    ],
  };

  // Cari nilai maksimum untuk jadi acuan scale radar
  const maxValue = Math.max(
    1,
    stats?.consistentCount ?? 0,
    stats?.fastCount ?? 0,
    stats?.reflectiveCount ?? 0
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        suggestedMax: maxValue,
        ticks: {
          stepSize: Math.max(1, Math.round(maxValue / 4)),
          color: palette.tick,
          backdropColor: "transparent",
        },
        grid: {
          color: palette.grid,
        },
        angleLines: {
          color: palette.grid,
        },
        pointLabels: {
          color: palette.label,
          font: {
            size: 11,
            weight: 500,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw} mentee`,
        },
      },
    },
  };

  return (
    <Card>
      <div className="p-4 rounded-2xl bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-50">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Distribusi Tipe Mentee
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Perbandingan jumlah mentee pada tiap tipe learner.
        </p>

        <div className="h-80">
          <Radar data={data} options={options} />
        </div>
      </div>
    </Card>
  );
}
