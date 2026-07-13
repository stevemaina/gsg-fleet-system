// src/pages/admin/TrucksPage.jsx
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
const STATUSES = ['Active', 'Under Maintenance', 'Retired']

export default function TrucksPage() {
  const [trucks, setTrucks] = useState([])
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
  const [targetTruck, setTargetTruck] = useState(null)
  const [confirmAction, setConfirmAction] = useState('delete')

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const fetchTrucks = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('trucks')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (search.trim()) {
      const s = `%${search.trim()}%`
      query = query.or(`number_plate.ilike.${s},truck_model.ilike.${s},fleet_number.ilike.${s}`)
    }

    const { data, count, error } = await query
    if (!error) {
      setTrucks(data ?? [])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchTrucks() }, [fetchTrucks])

  const openCreate = () => {
    setEditing(null)
    setFormError(null)
    reset({ number_plate: '', truck_model: '', fleet_number: '', status: 'Active' })
    setModalOpen(true)
  }

  const openEdit = (truck) => {
    setEditing(truck)
    setFormError(null)
    reset({ ...truck })
    setModalOpen(true)
  }

  const onSave = async (data) => {
    setFormError(null)
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase
          .from('trucks')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('trucks').insert(data)
        if (error) throw error
      }
      setModalOpen(false)
      fetchTrucks()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const askDelete = (truck) => {
    setTargetTruck(truck)
    setConfirmAction('delete')
    setConfirmOpen(true)
  }

  const askDeactivate = (truck) => {
    setTargetTruck(truck)
    setConfirmAction('deactivate')
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      if (confirmAction === 'delete') {
        const { error } = await supabase.from('trucks').delete().eq('id', targetTruck.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('trucks').update({ status: 'Retired', updated_at: new Date().toISOString() }).eq('id', targetTruck.id)
        if (error) throw error
      }
      setConfirmOpen(false)
      fetchTrucks()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout title="Truck Management">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search by plate, model or fleet number..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9"
          />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 shrink-0">
          <PlusIcon className="w-4 h-4" /> Add Truck
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-header">Number Plate</th>
                <th className="table-header">Fleet Number</th>
                <th className="table-header">Model</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
              ) : trucks.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No trucks found.</td></tr>
              ) : trucks.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell font-semibold text-gray-900 font-mono">{t.number_plate}</td>
                  <td className="table-cell">{t.fleet_number}</td>
                  <td className="table-cell">{t.truck_model}</td>
                  <td className="table-cell"><Badge status={t.status} /></td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Edit">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      {t.status === 'Active' && (
                        <button onClick={() => askDeactivate(t)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Retire">
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => askDelete(t)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Delete">
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Truck' : 'Add New Truck'}>
        {formError && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{formError}</p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number Plate <span className="text-red-500">*</span></label>
              <input type="text" className={`input-field ${errors.number_plate ? 'input-error' : ''}`}
                {...register('number_plate', { required: 'Required' })} />
              {errors.number_plate && <p className="mt-1 text-xs text-red-600">{errors.number_plate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fleet Number <span className="text-red-500">*</span></label>
              <input type="text" className={`input-field ${errors.fleet_number ? 'input-error' : ''}`}
                {...register('fleet_number', { required: 'Required' })} />
              {errors.fleet_number && <p className="mt-1 text-xs text-red-600">{errors.fleet_number.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Truck Model <span className="text-red-500">*</span></label>
              <input type="text" className={`input-field ${errors.truck_model ? 'input-error' : ''}`}
                {...register('truck_model', { required: 'Required' })} />
              {errors.truck_model && <p className="mt-1 text-xs text-red-600">{errors.truck_model.message}</p>}
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
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Truck'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={deleting}
        danger={confirmAction === 'delete'}
        title={confirmAction === 'delete' ? 'Delete Truck' : 'Retire Truck'}
        message={
          confirmAction === 'delete'
            ? `Permanently delete ${targetTruck?.number_plate}?`
            : `Retire truck ${targetTruck?.number_plate}? It will no longer appear in the report form.`
        }
        confirmLabel={confirmAction === 'delete' ? 'Delete' : 'Retire'}
      />
    </AdminLayout>
  )
}
