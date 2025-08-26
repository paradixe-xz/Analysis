'use client'

import { useState, useEffect } from 'react'
import { DateRange } from '@/types'
import { DateRangePicker } from '@/components/DateRangePicker'
import { Dashboard } from '@/components/Dashboard'
import { CallsTable } from '@/components/CallsTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, BarChart3, Table, Download } from 'lucide-react'


export default function HomePage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call Analysis Dashboard</h1>
          <p className="text-muted-foreground">
            Analiza y gestiona las llamadas de ElevenLabs con inteligencia artificial
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <CalendarDays className="h-4 w-4" />
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center space-x-2">
            <Table className="h-4 w-4" />
            <span>Llamadas</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <Dashboard dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="calls" className="space-y-4">
          <CallsTable dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Datos</CardTitle>
              <CardDescription>
                Descarga los resultados del análisis en formato Excel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <p className="text-sm text-muted-foreground">
                  Rango seleccionado: {mounted ? `${dateRange.from?.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString()}` : 'Cargando...'}
                </p>
                <Button className="w-fit">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}