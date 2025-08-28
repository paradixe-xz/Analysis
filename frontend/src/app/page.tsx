'use client'

import { useState, useEffect } from 'react'
import { DateRange } from '@/types'
import { DateRangePicker } from '@/components/DateRangePicker'
import { Dashboard } from '@/components/Dashboard'
import { CallsTable } from '@/components/CallsTable'
import { Button } from '@/components/ui/button'
import { Download, BarChart3, List } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function HomePage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  })
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            {mounted && (
              <p className="text-sm text-muted-foreground">
                {dateRange.from?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                {dateRange.to?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-9">
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 border-gray-200">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <Tabs 
        defaultValue="overview" 
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <TabsList className="bg-gray-100 p-1 h-9">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-1.5 text-sm rounded-md"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="calls" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-1.5 text-sm rounded-md"
          >
            <List className="h-4 w-4 mr-2" />
            All Calls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Dashboard dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="calls" className="space-y-4">
          <CallsTable dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}