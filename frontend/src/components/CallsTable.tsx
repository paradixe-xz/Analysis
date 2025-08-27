'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateRange, Call, Analysis, CallCategory } from '@/types'
import { formatDate, formatDuration, getCategoryColor, truncateText } from '@/lib/utils'
import { Eye, Download, RefreshCw, Search, Filter } from 'lucide-react'

interface CallsTableProps {
  dateRange: DateRange
}

export function CallsTable({ dateRange }: CallsTableProps) {
  const [calls, setCalls] = useState<Call[]>([])
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<CallCategory | 'all'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    fetchCalls()
  }, [dateRange])

  const fetchCalls = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const fromDate = dateRange.from?.toISOString().split('T')[0]
      const toDate = dateRange.to?.toISOString().split('T')[0]
      
      // Obtener llamadas usando API route
      const callsResponse = await fetch(
        `/api/calls/date-range?startDate=${fromDate}&endDate=${toDate}`
      )
      
      if (!callsResponse.ok) {
        throw new Error('Error al obtener llamadas')
      }
      
      const callsData = await callsResponse.json()
      const rawCalls = (callsData && callsData.data) ? callsData.data : (callsData.calls || [])

      // Normalizar al tipo Call esperado por la tabla
      const normalizedCalls: Call[] = (rawCalls || []).map((c: any) => ({
        id: c.id,
        caller_name: c.name || c.agentName || 'Desconocido',
        caller_number: c.phone || '',
        status: c.status || 'unknown',
        duration_seconds: c.duration || c.duration_seconds || 0,
        transcript: c.transcript || '',
        created_at: c.timestamp || c.startTime || new Date().toISOString(),
        updated_at: c.endTime || undefined,
        rawData: c,
      }))

      setCalls(normalizedCalls)
      
      // Obtener análisis para cada llamada usando API route
      const analysisPromises = (normalizedCalls || []).map(async (call: Call) => {
        try {
          const analysisResponse = await fetch(`/api/calls/${call.id}/transcript`)
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json()
            return { callId: call.id, analysis: analysisData.analysis }
          }
        } catch (err) {
          console.error(`Error analyzing call ${call.id}:`, err)
        }
        return null
      })
      
      const analysisResults = await Promise.all(analysisPromises)
      const analysisMap: Record<string, Analysis> = {}
      
      analysisResults.forEach(result => {
        if (result) {
          analysisMap[result.callId] = result.analysis
        }
      })
      
      setAnalyses(analysisMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const viewTranscript = (call: Call) => {
    setSelectedCall(call)
    setShowTranscript(true)
  }

  const exportToExcel = async () => {
    try {
      const fromDate = dateRange.from?.toISOString().split('T')[0]
      const toDate = dateRange.to?.toISOString().split('T')[0]
      
      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromDate,
          to: toDate,
          includeTranscripts: true
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `call-analysis-${fromDate}-${toDate}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Error exporting to Excel:', err)
    }
  }

  const filteredCalls = calls.filter(call => {
    const analysis = analyses[call.id]
    const matchesSearch = !searchTerm || 
      call.caller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.caller_number?.includes(searchTerm)
    
    const matchesCategory = filterCategory === 'all' || 
      (analysis && analysis.category === filterCategory)
    
    return matchesSearch && matchesCategory
  })

  const paginatedCalls = filteredCalls.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterCategory, calls.length])

  const categories: CallCategory[] = [
    'Failed', 'Hangup', 'Lead', 'No Answer', 'Non-Viable Client',
    'Not Interested', 'Recall', 'Voicemail', 'Wrong Number', 'Completed'
  ]

  if (loading) {
    return (
      <Card className="glass-panel">
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Cargando llamadas...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="glass-panel">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <Button onClick={fetchCalls} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <Card className="glass-panel">
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle>Llamadas</CardTitle>
              <CardDescription>
                {filteredCalls.length} de {calls.length} llamadas
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={exportToExcel} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button onClick={fetchCalls} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o número..."
                  className="input-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="px-3 py-2 border rounded-md bg-white dark:bg-slate-900"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as CallCategory | 'all')}
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="glass-panel">
        <CardContent className="p-0">
          <div className="overflow-x-auto table-sticky zebra">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium">Fecha/Hora</th>
                  <th className="p-4 font-medium">Contacto</th>
                  <th className="p-4 font-medium">Duración</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium">Categoría</th>
                  <th className="p-4 font-medium">Comentarios</th>
                  <th className="p-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCalls.map((call) => {
                  const analysis = analyses[call.id]
                  return (
                    <tr key={call.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="text-sm">
                          <div>{formatDate(new Date(call.created_at))}</div>
                          <div className="text-muted-foreground" suppressHydrationWarning>
                            {new Date(call.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-medium">{call.caller_name || 'Sin nombre'}</div>
                          <div className="text-muted-foreground">{call.caller_number}</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          call.status === 'completed' ? 'bg-green-100 text-green-800' :
                          call.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {analysis ? (
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: getCategoryColor(analysis.category) }}
                          >
                            {analysis.category}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Analizando...</span>
                        )}
                      </td>
                      <td className="p-4 text-sm max-w-xs">
                        {analysis?.comments ? (
                          <span title={analysis.comments}>
                            {truncateText(analysis.comments, 50)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewTranscript(call)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredCalls.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron llamadas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación cliente */}
      {filteredCalls.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredCalls.length)} de {filteredCalls.length}
          </div>
          <div className="space-x-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Modal de transcripción */}
      {showTranscript && selectedCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden glass-panel">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transcripción de Llamada</CardTitle>
                  <CardDescription>
                    {selectedCall.caller_name} - {formatDate(new Date(selectedCall.created_at))}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTranscript(false)}
                >
                  Cerrar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <div className="space-y-4">
                {analyses[selectedCall.id] && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Análisis</h4>
                    <div className="flex items-center space-x-4 mb-2">
                      <span 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getCategoryColor(analyses[selectedCall.id].category) }}
                      >
                        {analyses[selectedCall.id].category}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Confianza: {(analyses[selectedCall.id].confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    {analyses[selectedCall.id].comments && (
                      <p className="text-sm">{analyses[selectedCall.id].comments}</p>
                    )}
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">Transcripción</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedCall.transcript || 'Transcripción no disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}