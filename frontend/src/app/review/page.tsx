'use client'

import { CallReview } from '@/components/CallReview'

export default function ReviewPage() {
  return (
    <div className="flex-1 w-full overflow-auto">
      <div className="w-full max-w-full p-0">
        <CallReview />
      </div>
    </div>
  )
}
