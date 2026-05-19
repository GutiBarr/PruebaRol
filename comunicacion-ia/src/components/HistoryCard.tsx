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
  const objetivos = record.feedback?.objetivos || [];
  const cumplidos = objetivos.filter((o: any) => o.cumplido).length;
  const total = objetivos.length;
  const score = record.feedback?.puntuacion ?? 0;

  const scoreConfig =
    score >= 7
      ? { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", border: "border-l-emerald-400" }
      : score >= 5
      ? { bar: "bg-amber-400", badge: "bg-amber-100 text-amber-700", border: "border-l-amber-400" }
      : { bar: "bg-red-400", badge: "bg-red-100 text-red-700", border: "border-l-red-400" };

  return (
    <div className={`bg-white border border-slate-100 border-l-4 ${scoreConfig.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-sm leading-tight flex-1 pr-3">
          {record.scenarioTitle}
        </h3>
        <span className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-sm font-bold ${scoreConfig.badge}`}>
          {score}<span className="text-xs font-normal opacity-60">/10</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${scoreConfig.bar}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(record.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDuration(record.durationSeconds)}
        </span>
        {total > 0 && (
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={cumplidos === total ? "text-emerald-500 font-semibold" : ""}>
              {cumplidos}/{total} objetivos
            </span>
          </span>
        )}
      </div>

      {record.feedback?.resumen && (
        <p className="text-xs text-slate-400 mt-3 leading-relaxed line-clamp-2 border-t border-slate-50 pt-3">
          {record.feedback.resumen}
        </p>
      )}
    </div>
  );
}
