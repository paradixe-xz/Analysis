import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://c9d4sqomvuc6wy-3001.proxy.runpod.net'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Calling backend:', `${BACKEND_URL}/api/analysis/analyze-calls`)
    
    const response = await fetch(`${BACKEND_URL}/api/analysis/analyze-calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', response.status, errorText)
      throw new Error(`Backend responded with status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in analyze-calls API route:', error)
    return NextResponse.json(
      { error: 'Failed to analyze calls', details: error.message },
      { status: 500 }
    )
  }
}