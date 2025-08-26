'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DateRange } from '@/types'
import { formatDate } from '@/lib/utils'

interface DateRangePickerProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const presetRanges = [
    {
      label: 'Últimos 7 días',
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date()
      }
    },
    {
      label: 'Últimos 30 días',
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date()
      }
    },
    {
      label: 'Este mes',
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
      }
    },
    {
      label: 'Mes anterior',
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
      }
    }
  ]

  const handlePresetSelect = (range: DateRange) => {
    onDateRangeChange(range)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-[280px] justify-start text-left font-normal"
      >
        <Calendar className="mr-2 h-4 w-4" />
        {dateRange.from ? (
          dateRange.to ? (
            <>
              {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
            </>
          ) : (
            formatDate(dateRange.from)
          )
        ) : (
          <span>Seleccionar fechas</span>
        )}
      </Button>
      
      {isOpen && (
        <Card className="absolute top-full mt-2 w-[280px] z-50">
          <CardContent className="p-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Rangos predefinidos</h4>
              {presetRanges.map((preset, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-8 px-2 text-sm"
                  onClick={() => handlePresetSelect(preset.range)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Desde</label>
                  <input
                    type="date"
                    className="w-full mt-1 px-2 py-1 text-xs border rounded"
                    value={dateRange.from?.toISOString().split('T')[0] || ''}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value)
                      onDateRangeChange({ ...dateRange, from: newDate })
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Hasta</label>
                  <input
                    type="date"
                    className="w-full mt-1 px-2 py-1 text-xs border rounded"
                    value={dateRange.to?.toISOString().split('T')[0] || ''}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value)
                      onDateRangeChange({ ...dateRange, to: newDate })
                    }}
                  />
                </div>
              </div>
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={() => setIsOpen(false)}
              >
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}