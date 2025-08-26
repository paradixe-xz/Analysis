// Tipos para las llamadas
export interface Call {
  id: string
  caller_name?: string
  caller_number: string
  status: string
  duration_seconds: number
  transcript?: string
  created_at: string
  updated_at?: string
  rawData?: any
}

// Tipos para el análisis
export interface Analysis {
  category: CallCategory
  comments: string
  confidence: number
  analyzedAt: string
}

// Tipos para los resultados del análisis
export interface AnalysisResult {
  id: string
  name: string
  phone: string
  status: string
  duration: number
  transcript: string
  startTime: string
  endTime: string
  analysis: Analysis
}

// Categorías de llamadas
export type CallCategory = 
  | 'Failed'
  | 'Hangup'
  | 'Lead'
  | 'No Answer'
  | 'Non-Viable Client'
  | 'Not Interested'
  | 'Recall'
  | 'Voicemail'
  | 'Wrong Number'
  | 'Completed'

// Estadísticas del análisis
export interface AnalysisStats {
  total: number
  byCategory: Record<CallCategory, number>
  averageConfidence: number
}

// Respuesta completa del análisis
export interface AnalysisResponse {
  results: AnalysisResult[]
  stats: AnalysisStats
  totalCalls: number
  analyzedAt: string
}

// Tipos para el rango de fechas
export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}
// Tipos para las respuestas de la API
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

// Tipos para las llamadas por rango de fechas
export interface CallsResponse {
  success: boolean
  data: Call[]
  count: number
  dateRange: DateRange
  retrievedAt: string
}

// Tipos para la exportación
export interface ExportRequest {
  results: AnalysisResult[]
  stats: AnalysisStats
  dateRange?: DateRange
}

// Tipos para los filtros
export interface CallFilters {
  category?: CallCategory
  minDuration?: number
  maxDuration?: number
  searchTerm?: string
}

// Tipos para la paginación
export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// Tipos para el estado de carga
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

// Tipos para las métricas del dashboard
export interface DashboardMetrics {
  totalCalls: number
  successRate: number
  averageDuration: number
  topCategory: string
  categoryDistribution: Record<CallCategory, number>
  dailyTrends: Array<{
    date: string
    calls: number
    leads: number
  }>
}

// Tipos para los componentes de UI
export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
}

// Tipos para el contexto de la aplicación
export interface AppContextType {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  analysisResults: AnalysisResult[]
  setAnalysisResults: (results: AnalysisResult[]) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}