import { NextResponse } from 'next/server'
import API_CONFIG from '@/lib/api'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.analysis}/analyze-calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Backend error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error analyzing calls:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al analizar las llamadas' },
      { status: 500 }
    )
  }
}