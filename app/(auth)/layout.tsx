import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-card flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="mb-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center p-2.5 shadow-xl shadow-accent/20">
            <Image 
              src="/assets/logo.svg" 
              alt="Pilot Note Logo" 
              width={32} 
              height={32} 
              className="brightness-0"
            />
          </div>
          <span className="text-2xl font-heading font-extrabold tracking-tight">
            Pilot Note
          </span>
        </Link>
      </div>
      
      <main className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>

      <footer className="mt-12 text-sm text-text-light">
        © {new Date().getFullYear()} Pilot Note. All rights reserved.
      </footer>
    </div>
  )
}
