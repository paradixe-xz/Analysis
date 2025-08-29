'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PhoneCall } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeIn, container, item } from '@/lib/animations'

export function Sidebar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentPathname = usePathname();
  
  // Close menu when route changes
  React.useEffect(() => {
    setIsOpen(false);
  }, [currentPathname]);
  
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
    <>
      {/* Botón de menú móvil */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 md:hidden p-3 rounded-full bg-primary text-white shadow-lg"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          )}
        </svg>
      </button>

      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300, opacity: 0 }}
        animate={{
          x: isOpen ? 0 : window.innerWidth < 768 ? -300 : 0,
          opacity: isOpen ? 1 : window.innerWidth < 768 ? 0 : 1,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className={`fixed md:sticky md:flex flex-col w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 top-0 left-0 ${
          isOpen ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          <motion.div 
            variants={item}
            className="flex items-center h-16 px-4 border-b border-gray-200"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-8 w-8 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center shadow-md"
            >
              <span className="text-white font-medium">E</span>
            </motion.div>
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="ml-3 text-xl font-bold"
            >
              Eve
            </motion.span>
          </motion.div>
          
          <motion.nav 
            variants={container}
            initial="hidden"
            animate="show"
            className="flex-1 px-2 py-4"
          >
            {navItems.map((item, index) => {
              const isActive = currentPathname === item.href
              return (
                <motion.div key={item.name} variants={item}>
                  <Link
                    href={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm rounded-md font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:pl-4'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                    {isActive && (
                      <motion.div 
                        layoutId="activeNavItem"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }}
                      />
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </motion.nav>
          
          {/* User section */}
          <motion.div 
            variants={item}
            className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
          >
            <div className="flex items-center">
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-sm"
              >
                <span className="text-green-600 dark:text-green-400 font-medium">P</span>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="ml-3"
              >
                <p className="text-sm font-medium text-gray-900">Paradixe</p>
                <p className="text-xs text-gray-500">Admin</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}
