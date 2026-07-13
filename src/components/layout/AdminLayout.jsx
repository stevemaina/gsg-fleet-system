// src/components/layout/AdminLayout.jsx
import { useState } from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Bars3Icon className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
        </header>
        <main className="flex-1 px-4 lg:px-8 py-6">
          {children}
        </main>
        <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-200">
          © {new Date().getFullYear()} GSG Energies — Fleet Operations Management System
        </footer>
      </div>
    </div>
  )
}
