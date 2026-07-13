// src/components/ui/StatCard.jsx
export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle }) {
  const colorMap = {
    primary: 'bg-primary-800 text-white',
    accent: 'bg-accent-600 text-white',
    green: 'bg-green-600 text-white',
    blue: 'bg-blue-600 text-white',
    purple: 'bg-purple-600 text-white',
    amber: 'bg-amber-500 text-white',
  }
  const iconBg = {
    primary: 'bg-primary-700',
    accent: 'bg-accent-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-400',
  }

  return (
    <div className={`${colorMap[color]} rounded-2xl p-5 shadow-lg flex items-center gap-4`}>
      <div className={`${iconBg[color]} rounded-xl p-3 shrink-0`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-3xl font-bold mt-0.5">{value ?? '—'}</p>
        {subtitle && <p className="text-xs opacity-70 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
