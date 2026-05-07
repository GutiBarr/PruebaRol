import type { SessionRecord } from "../hooks/useHistory";

interface Props {
  record: SessionRecord;
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function HistoryCard({ record }: Props) {
  const cumplidos = record.feedback.objetivos.filter((o) => o.cumplido).length;
  const total = record.feedback.objetivos.length;
  const score = record.feedback.puntuacion;
  const color = score >= 7 ? "text-emerald-600" : score >= 5 ? "text-amber-500" : "text-red-500";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-900 text-sm leading-tight">
          {record.scenarioTitle}
        </h3>
        <span className={`text-2xl font-bold ${color} ml-3`}>
          {score}<span className="text-sm font-normal text-slate-400">/10</span>
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
        <span>📅 {formatDate(record.date)}</span>
        <span>⏱ {formatDuration(record.durationSeconds)}</span>
        <span>🎯 {cumplidos}/{total} objetivos</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            score >= 7 ? "bg-emerald-500" : score >= 5 ? "bg-amber-400" : "bg-red-400"
          }`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-3 leading-relaxed line-clamp-2">
        {record.feedback.resumen}
      </p>
    </div>
  );
}