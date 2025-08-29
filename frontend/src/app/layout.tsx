'use client'

import { Inter, Rubik } from 'next/font/google'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { useState, useEffect } from 'react'
import { Menu, LayoutDashboard, PhoneCall, Bell, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeIn } from '@/lib/animations'
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

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full antialiased`}>
        <div className="min-h-full flex">
          <Sidebar />
          
          {/* Mobile sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.75 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-40 bg-black md:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="fixed inset-y-0 left-0 z-50 w-72 max-w-full bg-white shadow-xl md:hidden"
                >
                  <div className="h-full flex flex-col">
                    <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                          <span className="text-white font-medium">E</span>
                        </div>
                        <span className="ml-3 text-xl font-bold text-gray-900">Eve</span>
                      </div>
                      <button
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    <nav className="flex-1 overflow-y-auto py-4 px-2">
                      <motion.div
                        variants={fadeIn('right', 0.1)}
                        initial="hidden"
                        animate="visible"
                        className="space-y-1"
                      >
                        <a
                          href="/"
                          className={`group flex items-center rounded-md px-3 py-2.5 text-base font-medium transition-colors ${
                            pathname === '/' 
                              ? 'bg-indigo-50 text-indigo-700' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <LayoutDashboard className="mr-3 h-5 w-5 flex-shrink-0" />
                          Dashboard
                        </a>
                        <a
                          href="/review"
                          className={`group flex items-center rounded-md px-3 py-2.5 text-base font-medium transition-colors ${
                            pathname === '/review' 
                              ? 'bg-indigo-50 text-indigo-700' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <PhoneCall className="mr-3 h-5 w-5 flex-shrink-0" />
                          Review Calls
                        </a>
                      </motion.div>
                    </nav>
                    <div className="border-t border-gray-200 p-4">
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
                </motion.div>
              </>
            )}
          </AnimatePresence>
          
          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <motion.header 
              className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow-sm"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <button
                type="button"
                className="border-r border-gray-200 px-4 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex flex-1 justify-between px-4">
                <div className="flex items-center">
                  <motion.h1 
                    key={pathname}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-lg font-semibold text-gray-900 ${rubik.variable} font-sans`}
                  >
                    {pathname === '/' ? 'Dashboard' : 'Review Calls'}
                  </motion.h1>
                </div>
                <div className="ml-4 flex items-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                  >
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-5 w-5" aria-hidden="true" />
                  </motion.button>
                </div>
              </div>
            </motion.header>

            <motion.main 
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto bg-gray-50"
            >
              <div className="p-4 sm:p-6">
                {children}
              </div>
            </motion.main>
          </div>
        </div>
      </body>
    </html>
  )
}