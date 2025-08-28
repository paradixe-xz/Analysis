'use client'

import { CallReview } from '@/components/CallReview'

export default function ReviewPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <CallReview />
      </div>
    </div>
  )
}
