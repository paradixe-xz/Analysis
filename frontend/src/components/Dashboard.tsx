'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRange, AnalysisStats, CallCategory } from '@/types'
import { formatNumber, formatPercentage, getCategoryColor } from '@/lib/utils'
import { Phone, TrendingUp, Clock, Users, AlertCircle, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DashboardProps {
  dateRange: DateRange
}

export function Dashboard({ dateRange }: DashboardProps) {
  const [stats, setStats] = useState<AnalysisStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalysisStats()
  }, [dateRange])

  const fetchAnalysisStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const fromDate = dateRange.from?.toISOString().split('T')[0]
      const toDate = dateRange.to?.toISOString().split('T')[0]
      
      const response = await fetch('/api/analysis/analyze-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: fromDate,
          endDate: toDate
        })
      })
      
      if (!response.ok) {
        throw new Error('Error al obtener estadísticas')
      }
      
      const data = await response.json()
      const resolvedData = (data && data.data) ? data.data : data
      const resolvedStats = resolvedData?.stats
      const totalCalls = typeof resolvedData?.totalCalls === 'number' ? resolvedData.totalCalls : 0

      // Normalizar a la forma { total, byCategory, averageConfidence }
      let normalizedStats: AnalysisStats | null = null
      if (resolvedStats) {
        const byCategory: Record<CallCategory, number> = {
          'Failed': 0,
          'Hangup': 0,
          'Lead': 0,
          'No Answer': 0,
          'Non-Viable Client': 0,
          'Not Interested': 0,
          'Recall': 0,
          'Voicemail': 0,
          'Wrong Number': 0,
          'Completed': 0,
        }
        Object.keys(resolvedStats).forEach((key) => {
          if (key !== 'averageConfidence' && (key as any) in byCategory) {
            // @ts-ignore
            byCategory[key] = resolvedStats[key] || 0
          }
        })
        normalizedStats = {
          total: totalCalls,
          byCategory,
          averageConfidence: resolvedStats.averageConfidence || 0,
        }
      }

      setStats(normalizedStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <div className="h-4 bg-gray-100 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-100 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6 text-center bg-white rounded-lg border border-gray-100 shadow-sm">
        <p className="text-gray-500">No data available for the selected period</p>
      </div>
    )
  }

  const categoryData = Object.entries(stats.byCategory).map(([category, count]) => ({
    name: category,
    value: count,
    color: getCategoryColor(category as CallCategory)
  }))

  const successRate = stats.total > 0 ? (stats.byCategory.Lead || 0) / stats.total * 100 : 0
  const completionRate = stats.total > 0 ? (stats.byCategory.Completed || 0) / stats.total * 100 : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Calls Card */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Total Calls</span>
            <div className="p-1.5 rounded-full bg-blue-50 text-blue-600">
              <Phone className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 mb-1">
            {formatNumber(stats.total)}
          </div>
          <div className="text-xs text-gray-500">
            In selected period
          </div>
        </div>

        {/* Success Rate Card */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Success Rate</span>
            <div className="p-1.5 rounded-full bg-green-50 text-green-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-green-600 mb-1">
            {formatPercentage(successRate, 1)}
          </div>
          <div className="text-xs text-gray-500">
            {stats.byCategory.Lead || 0} leads generated
          </div>
        </div>

        {/* Completed Calls Card */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Completed</span>
            <div className="p-1.5 rounded-full bg-blue-50 text-blue-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-blue-600 mb-1">
            {formatPercentage(completionRate, 1)}
          </div>
          <div className="text-xs text-gray-500">
            {stats.byCategory.Completed || 0} completed calls
          </div>
        </div>

        {/* No Answer Card */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>No Answer</span>
            <div className="p-1.5 rounded-full bg-orange-50 text-orange-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-orange-600 mb-1">
            {stats.byCategory['No Answer'] || 0}
          </div>
          <div className="text-xs text-gray-500">
            Unanswered calls
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Distribution */}
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900">Category Distribution</h3>
            <p className="text-sm text-gray-500">Number of calls per category</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  tickFormatter={(value) => value.toLocaleString()}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value) => [value, 'Calls']}
                  labelFormatter={(label) => `Category: ${label}`}
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    padding: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900">Category Breakdown</h3>
            <p className="text-sm text-gray-500">Percentage distribution of call categories</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    value, 
                    props.payload.name,
                  ]}
                  labelFormatter={() => ''}
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    padding: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Summary */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Detailed Summary</h3>
          <p className="text-sm text-gray-500">Breakdown of call categories</p>
        </div>
        <div className="space-y-2">
          {Object.entries(stats.byCategory)
            .sort(([,a], [,b]) => b - a)
            .map(([category, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div 
                  key={category} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getCategoryColor(category as CallCategory) }}
                    />
                    <span className="text-sm font-medium text-gray-900">{category}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{count}</div>
                    <div className="text-xs text-gray-400">
                      {formatPercentage(percentage, 1)}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}