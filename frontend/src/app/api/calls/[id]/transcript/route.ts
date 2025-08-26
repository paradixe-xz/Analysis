import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://c9d4sqomvuc6wy-3001.proxy.runpod.net'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching transcript from backend:', `${BACKEND_URL}/api/calls/${id}/transcript`)
    
    const response = await fetch(
      `${BACKEND_URL}/api/calls/${id}/transcript`,
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
    console.error('Error in calls/[id]/transcript API route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transcript', details: error.message },
      { status: 500 }
    )
  }
}