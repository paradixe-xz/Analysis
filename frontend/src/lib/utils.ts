import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilidades para formateo de fechas
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Utilidades para formateo de duración
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Utilidades para obtener color de categoría
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Lead': 'category-lead',
    'Completed': 'category-completed',
    'Failed': 'category-failed',
    'No Answer': 'category-no-answer',
    'Not Interested': 'category-not-interested',
    'Hangup': 'category-hangup',
    'Voicemail': 'category-voicemail',
    'Wrong Number': 'category-wrong-number',
    'Recall': 'category-recall',
    'Non-Viable Client': 'category-non-viable'
  }
  return colors[category] || 'category-not-interested'
}

// Utilidades para validación de fechas
export function isValidDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return start <= end && start <= new Date()
}

// Utilidades para formateo de números
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-ES').format(num)
}

// Utilidades para porcentajes
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

// Utilidades para truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Utilidades para descargar archivos
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}