import { NextResponse } from 'next/server'

// URL del backend - asegúrate de que coincida con tu configuración
const BACKEND_URL = 'http://localhost:3001/api/analysis/analyze-calls';

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include' // Importante para enviar cookies si es necesario
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', response.status, errorText)
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error analyzing calls:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error al analizar las llamadas',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    )
  }
}