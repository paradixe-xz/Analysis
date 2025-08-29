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

  // Define a consistent color palette for charts with green as primary
  const chartColors = [
    '#10B981', // emerald-500 (primary green)
    '#059669', // emerald-700 (darker green)
    '#34D399', // emerald-400 (lighter green)
    '#3B82F6', // blue-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#F59E0B', // amber-500
    '#6366F1', // indigo-500
    '#EF4444', // red-500
    '#06B6D4'  // cyan-500
  ]

  const categoryData = Object.entries(stats.byCategory).map(([category, count], index) => ({
    name: category,
    value: count,
    color: chartColors[index % chartColors.length]
  }))

  const successRate = stats.total > 0 ? (stats.byCategory.Lead || 0) / stats.total * 100 : 0
  const completionRate = stats.total > 0 ? (stats.byCategory.Completed || 0) / stats.total * 100 : 0

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Calls Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Total Calls</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Phone className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(stats.total)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                In selected period
              </div>
            </div>
          </div>
        </div>

        {/* Success Rate Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Success Rate</span>
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(successRate, 1)}%
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {stats.byCategory.Lead || 0} leads generated
              </div>
            </div>
          </div>
        </div>

        {/* Completed Calls Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Completed</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {formatPercentage(completionRate, 1)}%
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {stats.byCategory.Completed || 0} completed calls
              </div>
            </div>
          </div>
        </div>

        {/* No Answer Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">No Answer</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {stats.byCategory['No Answer'] || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Unanswered calls
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Add a subtle gradient background to the chart containers */}
        <style jsx global>{`
          .chart-container {
            background: linear-gradient(to bottom right, #f9fafb, #ffffff);
          }
          .chart-card {
            transition: all 0.2s ease-in-out;
          }
          .chart-card:hover {
            transform: translateY(-2px);
          }
        `}</style>
        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm chart-card">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full mr-2"></span>
              Category Distribution
            </h3>
            <p className="text-sm text-gray-400 mt-1">Number of calls per category</p>
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
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                  {categoryData.map((entry, index) => {
                    const color = chartColors[index % chartColors.length]
                    return (
                      <Cell 
                        key={`cell-${index}`}
                        fill={color}
                        stroke={color}
                        strokeWidth={1}
                        className="hover:opacity-90 transition-all duration-200"
                        style={{
                          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05))',
                          transition: 'all 0.2s ease-in-out',
                        }}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm chart-card">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-1.5 h-5 bg-purple-600 rounded-full mr-2"></span>
              Category Breakdown
            </h3>
            <p className="text-sm text-gray-400 mt-1">Percentage distribution of call categories</p>
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
                  {categoryData.map((entry, index) => {
                    const color = chartColors[index % chartColors.length]
                    return (
                      <Cell 
                        key={`cell-${index}`}
                        fill={color}
                        stroke="#fff"
                        strokeWidth={1}
                        className="hover:opacity-90 transition-all duration-200"
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                          transition: 'all 0.2s ease-in-out',
                        }}
                      />
                    )
                  })}
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
      <div className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="w-1.5 h-5 bg-green-600 rounded-full mr-2"></span>
            Detailed Summary
          </h3>
          <p className="text-sm text-gray-400 mt-1">Breakdown of call categories</p>
        </div>
        <div className="space-y-3">
          {Object.entries(stats.byCategory)
            .sort(([,a], [,b]) => b - a)
            .map(([category, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div 
                  key={category} 
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                      style={{ 
                        backgroundColor: getCategoryColor(category as CallCategory),
                        boxShadow: `0 0 0 3px ${getCategoryColor(category as CallCategory)}33`
                      }}
                    />
                    <span className="text-sm font-medium text-gray-800">{category}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 text-right">
                      <div className="font-semibold text-gray-900">{count}</div>
                    </div>
                    <div className="w-16 text-right">
                      <div className="text-sm font-medium text-gray-500">
                        {formatPercentage(percentage, 1)}%
                      </div>
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