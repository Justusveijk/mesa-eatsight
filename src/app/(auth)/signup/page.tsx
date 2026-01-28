import { Suspense } from 'react'
import SignUpClient from './signup-client'

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md" />}>
      <SignUpClient />
    </Suspense>
  )
}
