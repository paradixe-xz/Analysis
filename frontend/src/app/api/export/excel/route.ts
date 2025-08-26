import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${BACKEND_URL}/api/export/excel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }
    
    // Para archivos Excel, necesitamos manejar el blob
    const blob = await response.blob()
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="call-analysis.xlsx"'
      }
    })
    
  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Error connecting to backend' },
      { status: 500 }
    )
  }
}