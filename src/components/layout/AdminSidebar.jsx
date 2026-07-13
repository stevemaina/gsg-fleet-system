// src/components/layout/AdminSidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  UserGroupIcon,
  TruckIcon,
  DocumentTextIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { to: '/admin/drivers', icon: UserGroupIcon, label: 'Drivers' },
  { to: '/admin/trucks', icon: TruckIcon, label: 'Trucks' },
  { to: '/admin/reports', icon: DocumentTextIcon, label: 'Reports' },
]

export default function AdminSidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-primary-900 flex flex-col z-30 transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-primary-800 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <img src="/logo.png" alt="GSG Energies" className="h-9 w-auto brightness-0 invert" />
            <p className="text-primary-400 text-xs leading-tight pl-0.5">Fleet Operations Portal</p>
          </div>
          <button className="lg:hidden text-primary-300 hover:text-white" onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-accent-600 text-white shadow-md'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User & logout */}
        <div className="px-4 py-4 border-t border-primary-800">
          <div className="mb-3 px-2">
            <p className="text-xs text-primary-400">Signed in as</p>
            <p className="text-sm text-primary-100 font-medium truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary-200 hover:bg-red-700 hover:text-white transition-all duration-200"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
