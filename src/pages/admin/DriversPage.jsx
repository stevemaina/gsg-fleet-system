// src/pages/admin/DriversPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'
import AdminLayout from '../../components/layout/AdminLayout'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { useForm } from 'react-hook-form'
import {
  PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon,
  XCircleIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline'

const PAGE_SIZE = 20
const STATUSES = ['Active', 'Suspended', 'Inactive']

export default function DriversPage() {
  const [drivers, setDrivers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [targetDriver, setTargetDriver] = useState(null)
  const [confirmAction, setConfirmAction] = useState('delete') // 'delete' | 'deactivate'

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const fetchDrivers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('drivers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (search.trim()) {
      const s = `%${search.trim()}%`
      query = query.or(`driver_name.ilike.${s},employee_number.ilike.${s},phone_number.ilike.${s},license_number.ilike.${s}`)
    }

    const { data, count, error } = await query
    if (!error) {
      setDrivers(data ?? [])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchDrivers() }, [fetchDrivers])

  const openCreate = () => {
    setEditing(null)
    setFormError(null)
    reset({ driver_name: '', employee_number: '', phone_number: '', license_number: '', status: 'Active' })
    setModalOpen(true)
  }

  const openEdit = (driver) => {
    setEditing(driver)
    setFormError(null)
    reset({ ...driver })
    setModalOpen(true)
  }

  const onSave = async (data) => {
    setFormError(null)
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase
          .from('drivers')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('drivers').insert(data)
        if (error) throw error
      }
      setModalOpen(false)
      fetchDrivers()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const askDelete = (driver) => {
    setTargetDriver(driver)
    setConfirmAction('delete')
    setConfirmOpen(true)
  }

  const askDeactivate = (driver) => {
    setTargetDriver(driver)
    setConfirmAction('deactivate')
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      if (confirmAction === 'delete') {
        const { error } = await supabase.from('drivers').delete().eq('id', targetDriver.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('drivers').update({ status: 'Inactive', updated_at: new Date().toISOString() }).eq('id', targetDriver.id)
        if (error) throw error
      }
      setConfirmOpen(false)
      fetchDrivers()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <AdminLayout title="Driver Management">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name, employee no., phone or license..."
            value={search}
            onChange={handleSearch}
            className="input-field pl-9"
          />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 shrink-0">
          <PlusIcon className="w-4 h-4" /> Add Driver
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-header">Driver Name</th>
                <th className="table-header">Employee #</th>
                <th className="table-header">Phone</th>
                <th className="table-header">License #</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
              ) : drivers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No drivers found.</td></tr>
              ) : drivers.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell font-medium text-gray-900">{d.driver_name}</td>
                  <td className="table-cell text-gray-600">{d.employee_number}</td>
                  <td className="table-cell">{d.phone_number}</td>
                  <td className="table-cell font-mono text-sm">{d.license_number}</td>
                  <td className="table-cell"><Badge status={d.status} /></td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Edit">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      {d.status !== 'Inactive' && (
                        <button onClick={() => askDeactivate(d)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Deactivate">
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => askDelete(d)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Delete">
                        <TrashIcon className="w-4 h-4" />
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

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Driver' : 'Add New Driver'}>
        {formError && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{formError}</p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name <span className="text-red-500">*</span></label>
              <input type="text" className={`input-field ${errors.driver_name ? 'input-error' : ''}`}
                {...register('driver_name', { required: 'Required', maxLength: { value: 100, message: 'Max 100 chars' } })} />
              {errors.driver_name && <p className="mt-1 text-xs text-red-600">{errors.driver_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee Number <span className="text-red-500">*</span></label>
              <input type="text" className={`input-field ${errors.employee_number ? 'input-error' : ''}`}
                {...register('employee_number', { required: 'Required' })} />
              {errors.employee_number && <p className="mt-1 text-xs text-red-600">{errors.employee_number.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
              <input type="tel" className={`input-field ${errors.phone_number ? 'input-error' : ''}`}
                {...register('phone_number', {
                  required: 'Required',
                  pattern: { value: /^[+]?[\d\s\-().]{7,20}$/, message: 'Invalid phone number' },
                })} />
              {errors.phone_number && <p className="mt-1 text-xs text-red-600">{errors.phone_number.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number <span className="text-red-500">*</span></label>
              <input type="text" className={`input-field ${errors.license_number ? 'input-error' : ''}`}
                {...register('license_number', { required: 'Required' })} />
              {errors.license_number && <p className="mt-1 text-xs text-red-600">{errors.license_number.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
              <select className={`input-field ${errors.status ? 'input-error' : ''}`}
                {...register('status', { required: 'Required' })}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost" disabled={saving}>Cancel</button>
            <button type="submit" className="btn-secondary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Driver'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={deleting}
        danger={confirmAction === 'delete'}
        title={confirmAction === 'delete' ? 'Delete Driver' : 'Deactivate Driver'}
        message={
          confirmAction === 'delete'
            ? `Are you sure you want to permanently delete ${targetDriver?.driver_name}? This cannot be undone.`
            : `Are you sure you want to deactivate ${targetDriver?.driver_name}? They will no longer appear in the public report form.`
        }
        confirmLabel={confirmAction === 'delete' ? 'Delete' : 'Deactivate'}
      />
    </AdminLayout>
  )
}
