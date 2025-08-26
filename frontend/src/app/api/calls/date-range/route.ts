import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://c9d4sqomvuc6wy-3001.proxy.runpod.net'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    console.log('Fetching calls from backend:', `${BACKEND_URL}/api/calls/date-range`)
    
    const response = await fetch(
      `${BACKEND_URL}/api/calls/date-range?startDate=${startDate}&endDate=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', response.status, errorText)
      throw new Error(`Backend responded with status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in calls/date-range API route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calls', details: error.message },
      { status: 500 }
    )
  }
}