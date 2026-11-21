// One colour map for complaint status and priority, shared by the admin table, admin detail and citizen modal.
export function statusBadgeClass(status) {
  switch ((status || 'OPEN').toUpperCase()) {
    case 'OPEN':
      return 'bg-amber-500/15 light:bg-amber-100 text-amber-300 light:text-amber-800 border-amber-500/30 light:border-amber-300';
    case 'IN_PROGRESS':
    case 'IN PROGRESS':
    case 'ACTIVE':
      return 'bg-blue-500/15 light:bg-blue-100 text-blue-300 light:text-blue-800 border-blue-500/30 light:border-blue-300';
    case 'RESOLVED':
      return 'bg-emerald-500/15 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 border-emerald-500/30 light:border-emerald-300';
    case 'CLOSED':
      return 'bg-slate-700/40 light:bg-slate-200 text-slate-400 light:text-slate-700 border-slate-600/40 light:border-slate-300';
    default:
      return 'bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 border-slate-700 light:border-slate-300';
  }
}

export function priorityBadgeClass(priority) {
  switch ((priority || 'MEDIUM').toUpperCase()) {
    case 'CRITICAL':
    case 'HIGH':
      return 'bg-rose-500/15 light:bg-rose-100 text-rose-300 light:text-rose-800 border-rose-500/30 light:border-rose-300';
    case 'MEDIUM':
      return 'bg-amber-500/15 light:bg-amber-100 text-amber-300 light:text-amber-800 border-amber-500/30 light:border-amber-300';
    case 'LOW':
      return 'bg-slate-700/30 light:bg-slate-200 text-slate-300 light:text-slate-700 border-slate-600/30 light:border-slate-300';
    default:
      return 'bg-slate-800 light:bg-slate-100 text-slate-400 light:text-slate-600 border-slate-700 light:border-slate-300';
  }
}
