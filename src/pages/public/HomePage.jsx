// src/pages/public/HomePage.jsx
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../supabase'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhoneIcon,
  UserIcon,
  CalendarIcon,
  TruckIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const REPORT_TYPES = [
  'Incident', 'Accident', 'Complaint', 'Suggestion',
  'Corruption', 'Ethics', 'Near Miss', 'Safety Concern',
]

const today = () => new Date().toISOString().split('T')[0]

// Simple HTML-escape for XSS prevention
function sanitize(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export default function HomePage() {
  const [drivers, setDrivers] = useState([])
  const [trucks, setTrucks] = useState([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successRef, setSuccessRef] = useState(null)   // null = no success yet
  const [serverError, setServerError] = useState(null)
  const [charCount, setCharCount] = useState(0)
  const successBannerRef = useRef(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      report_date: today(),
      reporter_name: '',
      reporter_phone: '',
      driver_id: '',
      truck_id: '',
      report_type: '',
      report_text: '',
    },
  })

  const reportText = watch('report_text', '')
  useEffect(() => { setCharCount(reportText?.length ?? 0) }, [reportText])

  // Load active drivers & trucks for dropdowns
  useEffect(() => {
    let mounted = true
    const fetchDropdowns = async () => {
      setLoadingDropdowns(true)
      const [{ data: d, error: de }, { data: t, error: te }] = await Promise.all([
        supabase.from('drivers').select('id, driver_name, employee_number').eq('status', 'Active').order('driver_name'),
        supabase.from('trucks').select('id, number_plate, fleet_number, truck_model').eq('status', 'Active').order('number_plate'),
      ])
      if (!mounted) return
      if (!de) setDrivers(d ?? [])
      if (!te) setTrucks(t ?? [])
      setLoadingDropdowns(false)
    }
    fetchDropdowns()
    return () => { mounted = false }
  }, [])

  // Scroll to success banner when it appears
  useEffect(() => {
    if (successRef && successBannerRef.current) {
      successBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [successRef])

  const resetForm = () => {
    reset({
      report_date: today(),
      reporter_name: '',
      reporter_phone: '',
      driver_id: '',
      truck_id: '',
      report_type: '',
      report_text: '',
    })
    setCharCount(0)
    setSuccessRef(null)
    setServerError(null)
  }

  const onSubmit = async (data) => {
    if (submitting) return
    setServerError(null)
    setSuccessRef(null)
    setSubmitting(true)

    try {
      const payload = {
        report_date: data.report_date,
        report_type: data.report_type,
        reporter_name: sanitize(data.reporter_name.trim()),
        reporter_phone: sanitize(data.reporter_phone.trim()),
        driver_id: data.driver_id || null,
        truck_id: data.truck_id || null,
        report_text: sanitize(data.report_text.trim()),
      }

      const { data: result, error } = await supabase
        .from('reports')
        .insert(payload)
        .select('id')
        .single()

      if (error) {
        // Provide helpful error message for RLS issues
        if (error.code === '42501' || error.message?.toLowerCase().includes('row-level security')) {
          throw new Error(
            'Submission blocked by database policy. Please contact the administrator to fix the database security settings (RLS).'
          )
        }
        throw error
      }

      const refNum = result.id.replace(/-/g, '').slice(0, 8).toUpperCase()
      setSuccessRef(refNum)

      // Reset form for next submission
      reset({
        report_date: today(),
        reporter_name: '',
        reporter_phone: '',
        driver_id: '',
        truck_id: '',
        report_type: '',
        report_text: '',
      })
      setCharCount(0)
    } catch (err) {
      setServerError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Intro card */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 mb-6 text-white text-center">
            <h2 className="text-xl font-semibold mb-2">Fleet Operations Feedback Portal</h2>
            <p className="text-primary-200 text-sm leading-relaxed">
              Please use this portal to submit feedback, complaints, incidents, safety concerns or
              ethical reports regarding any company trip.
            </p>
          </div>

          {/* ✅ Success Banner */}
          {successRef && (
            <div
              ref={successBannerRef}
              className="mb-6 bg-green-50 border-2 border-green-400 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg"
            >
              <CheckCircleIcon className="w-12 h-12 text-green-500 mb-3" />
              <h3 className="text-xl font-bold text-green-800 mb-1">Report Submitted Successfully!</h3>
              <p className="text-green-700 text-sm mb-4">
                Your report has been received and will be reviewed by our HR team.
              </p>
              <div className="bg-white border-2 border-green-300 rounded-xl px-6 py-3 mb-4">
                <p className="text-xs text-green-600 font-semibold uppercase tracking-widest mb-1">Your Reference Number</p>
                <p className="text-3xl font-bold text-green-800 tracking-widest font-mono">{successRef}</p>
              </div>
              <p className="text-xs text-green-600 mb-4">Please save this reference number for follow-up inquiries.</p>
              <button
                className="text-sm text-green-700 underline hover:text-green-900 font-medium"
                onClick={() => setSuccessRef(null)}
              >
                ✕ Dismiss &amp; submit another report
              </button>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6 border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-900">Submit a Report</h3>
              <span className="text-xs text-red-500 font-medium">* Required fields</span>
            </div>

            {/* ❌ Server Error */}
            {serverError && (
              <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-300 rounded-xl p-4">
                <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 mb-0.5">Submission Failed</p>
                  <p className="text-sm text-red-700">{serverError}</p>
                </div>
                <button onClick={() => setServerError(null)} className="text-red-400 hover:text-red-600">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

              {/* Date */}
              <div>
                <label htmlFor="report_date" className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarIcon className="w-4 h-4 inline mr-1 text-primary-600" />
                  Report Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="report_date"
                  type="date"
                  className={`input-field ${errors.report_date ? 'input-error' : ''}`}
                  {...register('report_date', { required: 'Date is required' })}
                />
                {errors.report_date && <p className="mt-1 text-xs text-red-600">{errors.report_date.message}</p>}
              </div>

              {/* Reporter Name */}
              <div>
                <label htmlFor="reporter_name" className="block text-sm font-medium text-gray-700 mb-1">
                  <UserIcon className="w-4 h-4 inline mr-1 text-primary-600" />
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="reporter_name"
                  type="text"
                  placeholder="Enter your full name"
                  maxLength={100}
                  className={`input-field ${errors.reporter_name ? 'input-error' : ''}`}
                  {...register('reporter_name', {
                    required: 'Name is required',
                    maxLength: { value: 100, message: 'Max 100 characters' },
                  })}
                />
                {errors.reporter_name && <p className="mt-1 text-xs text-red-600">{errors.reporter_name.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="reporter_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  <PhoneIcon className="w-4 h-4 inline mr-1 text-primary-600" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="reporter_phone"
                  type="tel"
                  placeholder="+254 700 000 000"
                  className={`input-field ${errors.reporter_phone ? 'input-error' : ''}`}
                  {...register('reporter_phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[+]?[\d\s\-().]{7,20}$/,
                      message: 'Enter a valid phone number (e.g. +254700000000)',
                    },
                  })}
                />
                {errors.reporter_phone && <p className="mt-1 text-xs text-red-600">{errors.reporter_phone.message}</p>}
              </div>

              {/* Driver */}
              <div>
                <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Driver <span className="text-red-500">*</span>
                </label>
                <select
                  id="driver_id"
                  className={`input-field ${errors.driver_id ? 'input-error' : ''}`}
                  disabled={loadingDropdowns}
                  {...register('driver_id', { required: 'Please select a driver' })}
                >
                  <option value="">
                    {loadingDropdowns ? 'Loading drivers...' : drivers.length === 0 ? 'No active drivers available' : '— Select Driver —'}
                  </option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.driver_name} — {d.employee_number}
                    </option>
                  ))}
                </select>
                {errors.driver_id && <p className="mt-1 text-xs text-red-600">{errors.driver_id.message}</p>}
              </div>

              {/* Truck */}
              <div>
                <label htmlFor="truck_id" className="block text-sm font-medium text-gray-700 mb-1">
                  <TruckIcon className="w-4 h-4 inline mr-1 text-primary-600" />
                  Truck <span className="text-red-500">*</span>
                </label>
                <select
                  id="truck_id"
                  className={`input-field ${errors.truck_id ? 'input-error' : ''}`}
                  disabled={loadingDropdowns}
                  {...register('truck_id', { required: 'Please select a truck' })}
                >
                  <option value="">
                    {loadingDropdowns ? 'Loading trucks...' : trucks.length === 0 ? 'No active trucks available' : '— Select Truck —'}
                  </option>
                  {trucks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.number_plate} — {t.truck_model} ({t.fleet_number})
                    </option>
                  ))}
                </select>
                {errors.truck_id && <p className="mt-1 text-xs text-red-600">{errors.truck_id.message}</p>}
              </div>

              {/* Report Type */}
              <div>
                <label htmlFor="report_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="report_type"
                  className={`input-field ${errors.report_type ? 'input-error' : ''}`}
                  {...register('report_type', { required: 'Please select a report type' })}
                >
                  <option value="">— Select Report Type —</option>
                  {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.report_type && <p className="mt-1 text-xs text-red-600">{errors.report_type.message}</p>}
              </div>

              {/* Report Description */}
              <div>
                <label htmlFor="report_text" className="block text-sm font-medium text-gray-700 mb-1">
                  <DocumentTextIcon className="w-4 h-4 inline mr-1 text-primary-600" />
                  Report Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="report_text"
                  rows={6}
                  placeholder="Describe the incident, complaint, or suggestion in detail (minimum 20 characters)..."
                  className={`input-field resize-y ${errors.report_text ? 'input-error' : ''}`}
                  {...register('report_text', {
                    required: 'Description is required',
                    minLength: { value: 20, message: 'Minimum 20 characters required' },
                    maxLength: { value: 5000, message: 'Maximum 5000 characters' },
                  })}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.report_text
                    ? <p className="text-xs text-red-600">{errors.report_text.message}</p>
                    : <span className="text-xs text-gray-400">Minimum 20 characters</span>
                  }
                  <span className={`text-xs ml-auto ${charCount > 5000 ? 'text-red-500' : charCount > 4500 ? 'text-amber-500' : charCount >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                    {charCount} / 5000
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                id="submit-report-btn"
                type="submit"
                disabled={submitting || loadingDropdowns}
                className="btn-primary w-full py-3.5 text-base mt-2 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Submitting Report...
                  </>
                ) : 'Submit Report'}
              </button>

            </form>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}

function PublicHeader() {
  return (
    <header className="bg-primary-950/80 backdrop-blur border-b border-white/10 px-6 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="GSG Energies" className="h-10 w-auto" />
          <div className="border-l border-white/20 pl-3">
            <p className="text-primary-200 text-xs leading-tight">Fleet Operations</p>
            <p className="text-primary-300 text-xs">Incident &amp; Feedback Portal</p>
          </div>
        </div>
        <a href="/admin/login" className="text-primary-300 hover:text-white text-xs transition-colors font-medium">
          Admin Login →
        </a>
      </div>
    </header>
  )
}

function PublicFooter() {
  return (
    <footer className="text-center py-5 text-xs text-primary-400 border-t border-white/10">
      <img src="/logo.png" alt="GSG Energies" className="h-6 w-auto mx-auto mb-2 opacity-60" />
      © {new Date().getFullYear()} GSG Energies — All rights reserved. Reports are strictly confidential.
    </footer>
  )
}
