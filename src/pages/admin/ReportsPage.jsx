// src/pages/admin/ReportsPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../supabase'
import AdminLayout from '../../components/layout/AdminLayout'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  MagnifyingGlassIcon, EyeIcon, PrinterIcon,
  ArrowDownTrayIcon, FunnelIcon, XMarkIcon,
} from '@heroicons/react/24/outline'

const PAGE_SIZE = 20
const REPORT_TYPES = ['Incident', 'Accident', 'Complaint', 'Suggestion', 'Corruption', 'Ethics', 'Near Miss', 'Safety Concern']

const refNum = (id) => id.replace(/-/g, '').slice(0, 8).toUpperCase()

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState([])
  const [trucks, setTrucks] = useState([])
  const [viewReport, setViewReport] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const printRef = useRef(null)

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    driver_id: '',
    truck_id: '',
    report_type: '',
  })

  // Fetch dropdown data
  useEffect(() => {
    supabase.from('drivers').select('id, driver_name').order('driver_name').then(({ data }) => setDrivers(data ?? []))
    supabase.from('trucks').select('id, number_plate').order('number_plate').then(({ data }) => setTrucks(data ?? []))
  }, [])

  const buildQuery = useCallback((forExport = false) => {
    let q = supabase
      .from('reports')
      .select('id, report_date, report_type, reporter_name, reporter_phone, report_text, created_at, drivers(id, driver_name), trucks(id, number_plate)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (!forExport) q = q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (filters.search.trim()) {
      const s = `%${filters.search.trim()}%`
      q = q.or(`reporter_name.ilike.${s},reporter_phone.ilike.${s}`)
    }
    if (filters.dateFrom) q = q.gte('report_date', filters.dateFrom)
    if (filters.dateTo) q = q.lte('report_date', filters.dateTo)
    if (filters.driver_id) q = q.eq('driver_id', filters.driver_id)
    if (filters.truck_id) q = q.eq('truck_id', filters.truck_id)
    if (filters.report_type) q = q.eq('report_type', filters.report_type)

    return q
  }, [page, filters])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const { data, count, error } = await buildQuery()
    if (!error) {
      setReports(data ?? [])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [buildQuery])

  useEffect(() => { fetchReports() }, [fetchReports])

  const setFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ search: '', dateFrom: '', dateTo: '', driver_id: '', truck_id: '', report_type: '' })
    setPage(1)
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  // Export helpers
  const getAllForExport = async () => {
    const { data } = await buildQuery(true)
    return (data ?? []).map(r => ({
      'Reference': refNum(r.id),
      'Date': format(new Date(r.report_date), 'dd/MM/yyyy'),
      'Reporter': r.reporter_name,
      'Phone': r.reporter_phone,
      'Driver': r.drivers?.driver_name ?? '',
      'Truck': r.trucks?.number_plate ?? '',
      'Type': r.report_type,
      'Description': r.report_text,
      'Submitted': format(new Date(r.created_at), 'dd/MM/yyyy HH:mm'),
    }))
  }

  const exportCSV = async () => {
    const rows = await getAllForExport()
    const headers = Object.keys(rows[0])
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    download(csv, 'text/csv', 'reports.csv')
  }

  const exportExcel = async () => {
    const rows = await getAllForExport()
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Reports')
    XLSX.writeFile(wb, 'reports.xlsx')
  }

  const exportPDF = async () => {
    const rows = await getAllForExport()
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text('GSG Energies — Fleet Operations Reports', 14, 15)
    doc.setFontSize(9)
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22)
    autoTable(doc, {
      startY: 27,
      head: [['Ref', 'Date', 'Reporter', 'Phone', 'Driver', 'Truck', 'Type']],
      body: rows.map(r => [r.Reference, r.Date, r.Reporter, r.Phone, r.Driver, r.Truck, r.Type]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [18, 38, 96] },
    })
    doc.save('reports.pdf')
  }

  const download = (content, type, filename) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const printReport = (r) => {
    const win = window.open('', '_blank', 'width=800,height=600')
    win.document.write(`
      <!DOCTYPE html><html><head><title>Report ${refNum(r.id)}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#111}
        h1{color:#122660;font-size:22px;margin-bottom:4px}
        .subtitle{color:#666;font-size:13px;margin-bottom:30px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
        .field label{font-weight:600;font-size:11px;text-transform:uppercase;color:#555;display:block;margin-bottom:3px}
        .field span{font-size:14px}
        .desc{background:#f5f5f5;padding:16px;border-radius:8px;margin-top:20px;white-space:pre-wrap;font-size:13px}
        .footer{margin-top:40px;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:12px}
      </style></head><body>
      <h1>GSG Energies — Incident & Feedback Report</h1>
      <p class="subtitle">Fleet Operations Management System</p>
      <div class="grid">
        <div class="field"><label>Reference Number</label><span>${refNum(r.id)}</span></div>
        <div class="field"><label>Report Date</label><span>${format(new Date(r.report_date), 'dd MMMM yyyy')}</span></div>
        <div class="field"><label>Report Type</label><span>${r.report_type}</span></div>
        <div class="field"><label>Submitted</label><span>${format(new Date(r.created_at), 'dd/MM/yyyy HH:mm')}</span></div>
        <div class="field"><label>Reporter Name</label><span>${r.reporter_name}</span></div>
        <div class="field"><label>Reporter Phone</label><span>${r.reporter_phone}</span></div>
        <div class="field"><label>Driver</label><span>${r.drivers?.driver_name ?? '—'}</span></div>
        <div class="field"><label>Truck</label><span>${r.trucks?.number_plate ?? '—'}</span></div>
      </div>
      <div><strong>Report Description</strong><div class="desc">${r.report_text}</div></div>
      <div class="footer">Printed: ${format(new Date(), 'dd/MM/yyyy HH:mm')} — CONFIDENTIAL</div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <AdminLayout title="Reports">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search reporter name or phone..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all ${showFilters || activeFilterCount > 0 ? 'bg-primary-800 text-white border-primary-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          <FunnelIcon className="w-4 h-4" />
          Filters {activeFilterCount > 0 && <span className="bg-accent-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">{activeFilterCount}</span>}
        </button>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-outline flex items-center gap-1.5 text-sm py-2 px-3" title="Export CSV">
            <ArrowDownTrayIcon className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportExcel} className="btn-outline flex items-center gap-1.5 text-sm py-2 px-3" title="Export Excel">
            <ArrowDownTrayIcon className="w-4 h-4" /> Excel
          </button>
          <button onClick={exportPDF} className="btn-outline flex items-center gap-1.5 text-sm py-2 px-3" title="Export PDF">
            <ArrowDownTrayIcon className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card mb-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><FunnelIcon className="w-4 h-4" />Advanced Filters</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                <XMarkIcon className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
              <input type="date" className="input-field text-sm" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
              <input type="date" className="input-field text-sm" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Report Type</label>
              <select className="input-field text-sm" value={filters.report_type} onChange={e => setFilter('report_type', e.target.value)}>
                <option value="">All Types</option>
                {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Driver</label>
              <select className="input-field text-sm" value={filters.driver_id} onChange={e => setFilter('driver_id', e.target.value)}>
                <option value="">All Drivers</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.driver_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Truck</label>
              <select className="input-field text-sm" value={filters.truck_id} onChange={e => setFilter('truck_id', e.target.value)}>
                <option value="">All Trucks</option>
                {trucks.map(t => <option key={t.id} value={t.id}>{t.number_plate}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-header">Reference</th>
                <th className="table-header">Date</th>
                <th className="table-header">Reporter</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Driver</th>
                <th className="table-header">Truck</th>
                <th className="table-header">Type</th>
                <th className="table-header">Preview</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">Loading reports...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">No reports match your filters.</td></tr>
              ) : reports.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell font-mono font-semibold text-primary-700">{refNum(r.id)}</td>
                  <td className="table-cell">{format(new Date(r.report_date), 'dd MMM yyyy')}</td>
                  <td className="table-cell font-medium">{r.reporter_name}</td>
                  <td className="table-cell">{r.reporter_phone}</td>
                  <td className="table-cell">{r.drivers?.driver_name ?? '—'}</td>
                  <td className="table-cell font-mono">{r.trucks?.number_plate ?? '—'}</td>
                  <td className="table-cell"><Badge status={r.report_type} /></td>
                  <td className="table-cell max-w-[180px]">
                    <p className="text-xs text-gray-500 truncate">{r.report_text}</p>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewReport(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="View">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => printReport(r)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" title="Print">
                        <PrinterIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} totalItems={total} pageSize={PAGE_SIZE} />
      </div>

      {/* Report Detail Modal */}
      {viewReport && (
        <Modal isOpen={!!viewReport} onClose={() => setViewReport(null)} title={`Report — ${refNum(viewReport.id)}`} size="lg">
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['Reference Number', refNum(viewReport.id)],
                ['Report Date', format(new Date(viewReport.report_date), 'dd MMMM yyyy')],
                ['Report Type', null],
                ['Submitted At', format(new Date(viewReport.created_at), 'dd/MM/yyyy HH:mm')],
                ['Reporter Name', viewReport.reporter_name],
                ['Reporter Phone', viewReport.reporter_phone],
                ['Driver', viewReport.drivers?.driver_name ?? '—'],
                ['Truck', viewReport.trucks?.number_plate ?? '—'],
              ].map(([label, val]) => (
                <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{label}</p>
                  {label === 'Report Type'
                    ? <Badge status={viewReport.report_type} />
                    : <p className="text-sm font-medium text-gray-900">{val}</p>
                  }
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Report Description</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{viewReport.report_text}</p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2 border-t">
              <button onClick={() => printReport(viewReport)} className="btn-outline flex items-center gap-2 text-sm py-2">
                <PrinterIcon className="w-4 h-4" /> Print
              </button>
              <button onClick={() => {
                const rows = [{
                  'Reference': refNum(viewReport.id),
                  'Date': format(new Date(viewReport.report_date), 'dd/MM/yyyy'),
                  'Reporter': viewReport.reporter_name,
                  'Phone': viewReport.reporter_phone,
                  'Driver': viewReport.drivers?.driver_name ?? '',
                  'Truck': viewReport.trucks?.number_plate ?? '',
                  'Type': viewReport.report_type,
                  'Description': viewReport.report_text,
                }]
                const ws = XLSX.utils.json_to_sheet(rows)
                const wb = XLSX.utils.book_new()
                XLSX.utils.book_append_sheet(wb, ws, 'Report')
                XLSX.writeFile(wb, `report_${refNum(viewReport.id)}.xlsx`)
              }} className="btn-outline flex items-center gap-2 text-sm py-2">
                <ArrowDownTrayIcon className="w-4 h-4" /> Excel
              </button>
              <button onClick={() => {
                const doc = new jsPDF()
                doc.setFontSize(16); doc.setTextColor(18, 38, 96)
                doc.text('GSG Energies — Incident Report', 14, 20)
                doc.setFontSize(10); doc.setTextColor(100, 100, 100)
                doc.text(`Reference: ${refNum(viewReport.id)}  |  Date: ${format(new Date(viewReport.report_date), 'dd/MM/yyyy')}`, 14, 30)
                autoTable(doc, {
                  startY: 38,
                  body: [
                    ['Reporter', viewReport.reporter_name, 'Phone', viewReport.reporter_phone],
                    ['Driver', viewReport.drivers?.driver_name ?? '—', 'Truck', viewReport.trucks?.number_plate ?? '—'],
                    ['Type', viewReport.report_type, 'Submitted', format(new Date(viewReport.created_at), 'dd/MM/yyyy HH:mm')],
                  ],
                  theme: 'grid', styles: { fontSize: 9 },
                })
                const y = doc.lastAutoTable.finalY + 10
                doc.setFontSize(10); doc.setTextColor(0)
                doc.text('Description:', 14, y)
                doc.setFontSize(9); doc.setTextColor(60)
                const lines = doc.splitTextToSize(viewReport.report_text, 180)
                doc.text(lines, 14, y + 7)
                doc.save(`report_${refNum(viewReport.id)}.pdf`)
              }} className="btn-outline flex items-center gap-2 text-sm py-2">
                <ArrowDownTrayIcon className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
