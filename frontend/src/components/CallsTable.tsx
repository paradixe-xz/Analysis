'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateRange, Call, Analysis, CallCategory } from '@/types'
import { formatDate, formatDuration, getCategoryColor, truncateText } from '@/lib/utils'
import { Eye, Download, RefreshCw, Search, Filter , AlertCircle} from 'lucide-react'

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
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <p className="text-gray-500">Loading calls...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-100 bg-red-50 rounded-lg">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
        <div className="mt-3">
          <Button 
            onClick={fetchCalls} 
            variant="outline" 
            size="sm" 
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Call Logs</h2>
            <p className="text-sm text-gray-500">
              Showing {filteredCalls.length} of {calls.length} calls
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={fetchCalls} 
              variant="outline" 
              size="sm"
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={exportToExcel} 
              variant="outline" 
              size="sm"
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or number..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as CallCategory | 'all')}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Summary
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCalls.length > 0 ? (
                paginatedCalls.map((call) => {
                  const analysis = analyses[call.id]
                  return (
                    <tr key={call.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(new Date(call.created_at))}
                        </div>
                        <div className="text-sm text-gray-500" suppressHydrationWarning>
                          {new Date(call.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {call.caller_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {call.caller_number || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          call.status === 'completed' ? 'bg-green-100 text-green-800' :
                          call.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {analysis ? (
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: getCategoryColor(analysis.category) }}
                          >
                            {analysis.category}
                          </span>
                        ) : (
                          <div className="h-2.5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        {analysis?.comments ? (
                          <span title={analysis.comments} className="line-clamp-2">
                            {analysis.comments}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => viewTranscript(call)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    No calls found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredCalls.length > 0 && (
        <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
            <span className="font-medium">{Math.min(page * pageSize, filteredCalls.length)}</span> of{' '}
            <span className="font-medium">{filteredCalls.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Previous
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              disabled={page === totalPages} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Transcript Modal */}
      {showTranscript && selectedCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Call Transcript</h3>
                <p className="text-sm text-gray-500">
                  {selectedCall.caller_name || 'Unknown'} • {formatDate(new Date(selectedCall.created_at))}
                </p>
              </div>
              <button
                onClick={() => setShowTranscript(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {analyses[selectedCall.id] && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Analysis</h4>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getCategoryColor(analyses[selectedCall.id].category) }}
                    >
                      {analyses[selectedCall.id].category}
                    </span>
                    <div className="text-sm text-gray-500">
                      Confidence: <span className="font-medium">{(analyses[selectedCall.id].confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  {analyses[selectedCall.id].comments && (
                    <div className="text-sm text-gray-700 bg-white p-3 rounded-md border border-gray-200">
                      {analyses[selectedCall.id].comments}
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Transcript</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedCall.transcript || 'No transcript available'}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <Button 
                onClick={() => setShowTranscript(false)}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}