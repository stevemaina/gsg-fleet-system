// src/pages/admin/DashboardPage.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import AdminLayout from '../../components/layout/AdminLayout'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import { UserGroupIcon, TruckIcon, DocumentTextIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { format, startOfDay, startOfMonth } from 'date-fns'

export default function DashboardPage() {
  const [stats, setStats] = useState({ drivers: 0, trucks: 0, today: 0, month: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const now = new Date()
      const todayStr = format(now, 'yyyy-MM-dd')
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')

      const [
        { count: driverCount },
        { count: truckCount },
        { count: todayCount },
        { count: monthCount },
        { data: recentReports },
      ] = await Promise.all([
        supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('trucks').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('report_date', todayStr),
        supabase.from('reports').select('id', { count: 'exact', head: true }).gte('report_date', monthStart),
        supabase.from('reports')
          .select('id, report_date, report_type, reporter_name, drivers(driver_name), trucks(number_plate)')
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      setStats({
        drivers: driverCount ?? 0,
        trucks: truckCount ?? 0,
        today: todayCount ?? 0,
        month: monthCount ?? 0,
      })
      setRecent(recentReports ?? [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  return (
    <AdminLayout title="Dashboard">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard title="Active Drivers" value={loading ? '…' : stats.drivers} icon={UserGroupIcon} color="primary" subtitle="Currently active" />
        <StatCard title="Active Trucks" value={loading ? '…' : stats.trucks} icon={TruckIcon} color="blue" subtitle="In service" />
        <StatCard title="Reports Today" value={loading ? '…' : stats.today} icon={DocumentTextIcon} color="accent" subtitle={format(new Date(), 'dd MMM yyyy')} />
        <StatCard title="Reports This Month" value={loading ? '…' : stats.month} icon={CalendarDaysIcon} color="green" subtitle={format(new Date(), 'MMMM yyyy')} />
      </div>

      {/* Recent reports */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Recent Reports</h2>
          <a href="/admin/reports" className="text-sm text-primary-700 hover:underline font-medium">View All →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-header">Reference</th>
                <th className="table-header">Date</th>
                <th className="table-header">Reporter</th>
                <th className="table-header">Driver</th>
                <th className="table-header">Truck</th>
                <th className="table-header">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Loading...</td></tr>
              ) : recent.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No reports yet.</td></tr>
              ) : recent.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell font-mono text-primary-700 font-semibold">
                    {r.id.replace(/-/g, '').slice(0, 8).toUpperCase()}
                  </td>
                  <td className="table-cell">{format(new Date(r.report_date), 'dd MMM yyyy')}</td>
                  <td className="table-cell">{r.reporter_name}</td>
                  <td className="table-cell">{r.drivers?.driver_name ?? '—'}</td>
                  <td className="table-cell">{r.trucks?.number_plate ?? '—'}</td>
                  <td className="table-cell"><Badge status={r.report_type} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
