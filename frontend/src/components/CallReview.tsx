'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, Loader2, Volume2, RefreshCw } from 'lucide-react'
import { formatDate, formatDuration } from '@/lib/utils'

interface TranscriptMessage {
  role: 'user' | 'assistant' | 'agent' | 'system'
  text: string
  [key: string]: any
}

type Call = {
  id: string
  caller_name: string
  caller_number: string
  status: string
  duration_seconds: number
  transcript: string | TranscriptMessage[]
  created_at: string
  rawData: any
}

type Analysis = {
  category: string
  confidence: number
  comments: string
  keyPoints: string[]
}

export function CallReview() {
  const [currentCallIndex, setCurrentCallIndex] = useState(0)
  const [calls, setCalls] = useState<Call[]>([])
  const [analysis, setAnalysis] = useState<Record<string, Analysis>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Fetch calls from the API
  useEffect(() => {
    const fetchCalls = async () => {
      try {
        setIsLoading(true)
        // Get date range for the last 7 days
        const endDate = new Date().toISOString().split('T')[0]
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        const startDateStr = startDate.toISOString().split('T')[0]
        
        const response = await fetch(`/api/calls/date-range?startDate=${startDateStr}&endDate=${endDate}`)
        if (!response.ok) {
          throw new Error('Failed to fetch calls')
        }
        
        const data = await response.json()
        if (data.data && Array.isArray(data.data)) {
          // Map the API response to the expected Call type
          const formattedCalls = data.data.map((call: any) => ({
            id: call.id || `unknown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            caller_name: call.name || 'Unknown Caller',
            caller_number: call.phone || 'Unknown Number',
            status: call.status || 'unknown',
            duration_seconds: call.duration || 0,
            transcript: call.transcript 
              ? Array.isArray(call.transcript) 
                ? (call.transcript as TranscriptMessage[]).map((msg: TranscriptMessage) => 
                    `${msg.role === 'user' ? 'Cliente' : 'Agente'}: ${msg.text || ''}`
                  ).join('\n\n')
                : String(call.transcript)
              : '',
            created_at: call.timestamp || new Date().toISOString(),
            rawData: call
          }))
          
          setCalls(formattedCalls)
        }
      } catch (error) {
        console.error('Error fetching calls:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCalls()
  }, [])

  const currentCall = calls[currentCallIndex]
  const currentAnalysis = currentCall ? analysis[currentCall.id] : null

  const analyzeCall = async (callId: string) => {
    try {
      setIsAnalyzing(true)
      
      const call = calls.find(c => c.id === callId)
      if (!call) {
        throw new Error('Call not found')
      }
      
      // If we already have analysis, don't analyze again
      if (analysis[callId]) {
        return
      }
      
      // First, try to get the transcript if it's not available
      let transcript = call.transcript
      if (!transcript) {
        const transcriptResponse = await fetch(`/api/calls/${callId}/transcript`)
        if (transcriptResponse.ok) {
          const transcriptData = await transcriptResponse.json()
          transcript = transcriptData.transcript || ''
          
          // Update the call with the fetched transcript
          setCalls(prevCalls => 
            prevCalls.map(c => 
              c.id === callId ? { ...c, transcript } : c
            )
          )
        }
      }
      
      // If we still don't have a transcript, we can't analyze
      if (!transcript) {
        throw new Error('No transcript available for analysis')
      }
      
      // Call the analysis API
      const response = await fetch('/api/analysis/analyze-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId,
          transcript: [transcript], // Convert to array as expected by the API
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze call')
      }
      
      const result = await response.json()
      
      // Map the API response to our Analysis type
      const analysisResult: Analysis = {
        category: result.category || 'Unknown',
        confidence: result.confidence || 0,
        comments: result.comment || 'No analysis available',
        keyPoints: result.keyPoints || []
      }
      
      setAnalysis(prev => ({
        ...prev,
        [callId]: analysisResult
      }))
      
    } catch (error) {
      console.error('Error analyzing call:', error)
      // Fallback to a default analysis if the API call fails
      setAnalysis(prev => ({
        ...prev,
        [callId]: {
          category: 'Unknown',
          confidence: 0,
          comments: 'Unable to analyze this call. ' + (error instanceof Error ? error.message : 'Unknown error'),
          keyPoints: []
        }
      }))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFeedback = (isPositive: boolean) => {
    setFeedback(isPositive ? 'positive' : 'negative')
    // Here you would typically send this feedback to your API
    // to improve the AI model
  }

  const handleNextCall = () => {
    setFeedback(null)
    setCurrentCallIndex(prev => Math.min(prev + 1, calls.length - 1))
  }

  const handlePreviousCall = () => {
    setFeedback(null)
    setCurrentCallIndex(prev => Math.max(0, prev - 1))
  }

  const togglePlay = () => {
    // This would control audio playback in a real implementation
    setIsPlaying(!isPlaying)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-gray-600">Loading call data...</span>
        <p className="text-sm text-gray-500">This may take a moment</p>
      </div>
    )
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <h3 className="text-lg font-medium text-gray-900">No calls found</h3>
        <p className="mt-2 text-gray-500">
          {isLoading ? 'Loading...' : 'No calls were found for the selected date range.'}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    )
  }

  // Format confidence as percentage
  const formatConfidence = (confidence: number) => {
    return Math.round(confidence * 100) + '%';
  };

  // Get color based on call status
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Call Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Call Review</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">
                Call {currentCallIndex + 1} of {calls.length}
              </span>
              {currentCall?.status && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(currentCall.status)}`}>
                  {currentCall.status}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousCall}
              disabled={currentCallIndex === 0 || isAnalyzing}
              className="px-3"
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextCall}
              disabled={currentCallIndex === calls.length - 1 || isAnalyzing}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      
      {/* Call Details */}
      <div className="p-6 w-full">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Call Info */}
          <div className="md:col-span-2 space-y-6 w-full">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Call Information</h3>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {currentCall.caller_name || 'Unknown Caller'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentCall.caller_number} • {formatDate(new Date(currentCall.created_at))}
                  </p>
                  <div className="mt-2 flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formatDuration(currentCall.duration_seconds)}
                    </span>
                    <button 
                      onClick={togglePlay}
                      className="ml-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {!currentAnalysis && (
                  <Button 
                    onClick={() => analyzeCall(currentCall.id)}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Call'
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Analysis Section */}
            {currentAnalysis ? (
              <div className="space-y-6">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <h3 className="text-sm font-medium text-indigo-800 mb-2">Analysis Result</h3>
                  <div className="flex items-center mb-3">
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: '#4f46e5' }}
                    >
                      {currentAnalysis.category}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {Math.round(currentAnalysis.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{currentAnalysis.comments}</p>
                  
                  {currentAnalysis.keyPoints && currentAnalysis.keyPoints.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Key Points
                      </h4>
                      <ul className="space-y-2">
                        {currentAnalysis.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start">
                            <div className="flex-shrink-0 h-5 w-5 text-indigo-500">
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="ml-2 text-sm text-gray-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Feedback */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Was this analysis helpful?</h4>
                      <p className="text-sm text-gray-500">Your feedback helps improve our AI model</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleFeedback(true)}
                        className={`p-2 rounded-full ${feedback === 'positive' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-100'}`}
                      >
                        <ThumbsUp className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(false)}
                        className={`p-2 rounded-full ${feedback === 'negative' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-100'}`}
                      >
                        <ThumbsDown className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  {feedback && (
                    <div className="mt-3 text-sm text-green-600">
                      Thank you for your feedback!
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Analyze the call to see the AI's insights</p>
              </div>
            )}

            {/* Transcript */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Transcript</h3>
                <span className="text-xs text-gray-500">
                  {currentCall.transcript ? `${String(currentCall.transcript).split(/\s+/).filter(Boolean).length} words` : 'No transcript available'}
                </span>
              </div>
              <div className="w-full bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                {currentCall.transcript ? (
                  <div className="prose prose-sm max-w-none">
                    {String(currentCall.transcript).split('\n').map((paragraph, i) => (
                      <p key={i} className="text-gray-700">
                        {paragraph || <br />}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No transcript available for this call.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
