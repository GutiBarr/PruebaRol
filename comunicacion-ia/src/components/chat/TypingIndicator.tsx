export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 msg-enter">
      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
        IA
      </div>
      <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1">
        <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block"></span>
        <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block"></span>
        <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block"></span>
      </div>
    </div>
  );
}