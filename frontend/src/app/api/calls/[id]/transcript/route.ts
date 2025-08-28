import { NextResponse } from 'next/server'
import API_CONFIG from '@/lib/api'

export async function GET(
  request: Request,
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
    
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.calls}/${id}/transcript`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', errorText)
      throw new Error(`Backend error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching transcript:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener la transcripción' },
      { status: 500 }
    )
  }
}