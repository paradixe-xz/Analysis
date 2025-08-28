import { NextResponse } from 'next/server'
import API_CONFIG from '@/lib/api'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.export}/excel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Backend error: ${error}`)
    }

    const blob = await response.blob()
    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    headers.set('Content-Disposition', 'attachment; filename="llamadas.xlsx"')

    return new NextResponse(blob, { headers })
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al exportar a Excel' },
      { status: 500 }
    )
  }
}