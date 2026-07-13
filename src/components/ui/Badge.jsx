// src/components/ui/Badge.jsx
export default function Badge({ status }) {
  const map = {
    'Active': 'badge-active',
    'Suspended': 'badge-suspended',
    'Inactive': 'badge-inactive',
    'Under Maintenance': 'badge-maintenance',
    'Retired': 'badge-retired',
    'Incident': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
    'Accident': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-900',
    'Complaint': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800',
    'Suggestion': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
    'Corruption': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800',
    'Ethics': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800',
    'Near Miss': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
    'Safety Concern': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800',
  }
  return (
    <span className={map[status] ?? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700'}>
      {status}
    </span>
  )
}
