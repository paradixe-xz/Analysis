import { NextRequest, NextResponse } from 'next/server'

// Cambiar a la URL de RunPod
const BACKEND_URL = process.env.BACKEND_URL || 'https://c9d4sqomvuc6wy-3001.proxy.runpod.net'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${BACKEND_URL}/api/export/excel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const blob = await response.blob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="llamadas.xlsx"',
      },
    })
  } catch (error) {
    console.error('Error in export/excel API route:', error)
    return NextResponse.json(
      { error: 'Failed to export Excel', details: error.message },
      { status: 500 }
    )
  }
}