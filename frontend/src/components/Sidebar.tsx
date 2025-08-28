'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PhoneCall, Settings, BarChart2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()
  
  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Review Calls',
      href: '/review',
      icon: PhoneCall,
    },
  ]

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white h-screen sticky top-0">
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex flex-col flex-1">
            <div className="flex items-center h-16 px-4 border-b border-gray-200">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-medium">E</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">Eve</span>
            </div>
            <nav className="flex-1 px-2 py-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm rounded-md font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-medium">P</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Paradixe</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
