'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, Loader2, Volume2 } from 'lucide-react'
import { formatDate, formatDuration } from '@/lib/utils'

type Call = {
  id: string
  caller_name: string
  caller_number: string
  status: string
  duration_seconds: number
  transcript: string
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

  // Fetch calls - in a real app, this would be an API call
  useEffect(() => {
    const fetchCalls = async () => {
      try {
        setIsLoading(true)
        // This would be replaced with an actual API call
        // const response = await fetch('/api/calls')
        // const data = await response.json()
        // setCalls(data.calls)
        
        // Mock data for now
        setTimeout(() => {
          setCalls([
            // Add sample call data here
          ])
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Error fetching calls:', error)
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
      // This would be replaced with an actual API call
      // const response = await fetch(`/api/analyze/${callId}`)
      // const data = await response.json()
      
      // Mock analysis
      setTimeout(() => {
        setAnalysis(prev => ({
          ...prev,
          [callId]: {
            category: 'Lead',
            confidence: 0.87,
            comments: 'The caller showed interest in our premium plan and requested a callback.',
            keyPoints: [
              'Interested in premium features',
              'Requested a callback',
              'Currently using a competitor\'s service'
            ]
          }
        }))
        setIsAnalyzing(false)
      }, 1500)
    } catch (error) {
      console.error('Error analyzing call:', error)
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading calls...</span>
      </div>
    )
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No calls to review</h3>
        <p className="mt-1 text-sm text-gray-500">New calls will appear here as they come in.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Call Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Call Review</h2>
            <p className="text-sm text-gray-500">
              Call {currentCallIndex + 1} of {calls.length}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousCall}
              disabled={currentCallIndex === 0}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextCall}
              disabled={currentCallIndex === calls.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Call Content */}
      <div className="p-6">
        {currentCall && (
          <div className="space-y-6">
            {/* Call Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start justify-between">
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
                  {currentCall.transcript ? `${currentCall.transcript.split(' ').length} words` : 'No transcript available'}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                {currentCall.transcript ? (
                  <div className="prose prose-sm max-w-none">
                    {currentCall.transcript.split('\n').map((paragraph, i) => (
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
        )}
      </div>
    </div>
  )
}
