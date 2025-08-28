'use client'

import { Inter, Rubik } from 'next/font/google'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { useState } from 'react'
import { Menu, LayoutDashboard, PhoneCall, Bell } from 'lucide-react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const rubik = Rubik({ subsets: ['latin'], variable: '--font-rubik' })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full`}>
        <div className="min-h-full flex">
          <Sidebar />
          
          {/* Mobile sidebar */}
          <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
              <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                <div className="flex flex-shrink-0 items-center px-4">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                    <span className="text-white font-medium">E</span>
                  </div>
                  <span className="ml-3 text-xl font-bold text-gray-900">Eve</span>
                </div>
                <nav className="mt-5 space-y-1 px-2">
                  <a
                    href="/"
                    className="group flex items-center rounded-md px-3 py-2.5 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <LayoutDashboard className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                    Dashboard
                  </a>
                  <a
                    href="/review"
                    className="group flex items-center rounded-md px-3 py-2.5 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <PhoneCall className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                    Review Calls
                  </a>
                </nav>
              </div>
              <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
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
          
          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow-sm">
              <button
                type="button"
                className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex flex-1 justify-between px-4">
                <div className="flex items-center">
                  <h1 className={`text-lg font-semibold text-gray-900 ${rubik.variable} font-sans`}>
                    {pathname === '/' ? 'Dashboard' : 'Review Calls'}
                  </h1>
                </div>
                <div className="ml-4 flex items-center">
                  <button
                    type="button"
                    className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <main className="flex-1 overflow-y-auto bg-gray-50">
              <div className="p-4 sm:p-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}