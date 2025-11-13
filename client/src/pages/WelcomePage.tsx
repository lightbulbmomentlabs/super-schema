import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Sparkles, CheckCircle, Zap } from 'lucide-react'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'
import { apiService } from '@/services/api'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { user } = useUser()

  // Set page title
  useEffect(() => {
    document.title = 'Welcome to SuperSchema!'
  }, [])

  // Initialize user account and grant welcome credits
  useEffect(() => {
    const initializeAccount = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        console.warn('⚠️ [Welcome] No email address available, skipping initialization')
        return
      }

      try {
        console.log('🎉 [Welcome] Initializing new user account...')
        await apiService.initializeUser({
          email: user.primaryEmailAddress.emailAddress,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined
        })
        console.log('✅ [Welcome] User account initialized successfully with 2 free credits!')
      } catch (error: any) {
        console.error('❌ [Welcome] Failed to initialize user:', error)
        // Don't block the user - they can still use the app
        // The credits might have already been granted or the endpoint might be idempotent
      }
    }

    initializeAccount()
  }, [user])

  // Fire Google Ads conversion tracking on mount
  useEffect(() => {
    // Google Ads Conversion Tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion_event_page_view_1', {
        // event_parameters can be added here if needed
      });
      console.log('🎉 Google Ads conversion tracking fired: conversion_event_page_view_1')
    }
  }, [])

  const benefits = [
    'AI-powered schema detection',
    'Real-time validation',
    'Schema.org compliant output',
    'Works with any platform',
    'Professional JSON-LD markup'
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 md:p-12 text-center border-b border-border">
            <div className="flex justify-center mb-6 animate-bounce">
              <SuperSchemaLogo className="h-20 w-20" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Welcome to SuperSchema{user?.firstName ? `, ${user.firstName}` : ''}! 🎉
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Your account is ready and you've got 2 free credits to get started
            </p>

            {/* Credit Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 border-2 border-primary/20 rounded-full">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary text-lg">2 Free Credits</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                What's included in your account
              </h2>
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Start Guide */}
            <div className="mb-8 p-6 bg-muted/30 rounded-lg border border-border">
              <h3 className="text-lg font-semibold mb-4">Create your first schema in 30 seconds</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <p className="text-muted-foreground pt-0.5">Enter any website URL</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <p className="text-muted-foreground pt-0.5">Our AI analyzes your page and detects the best schema types</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <p className="text-muted-foreground pt-0.5">Get production-ready JSON-LD markup instantly</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/generate')}
                className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2 text-lg"
              >
                <Sparkles className="h-5 w-5" />
                Start Your First Schema
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help? Check out our{' '}
          <a href="/docs" className="text-primary hover:text-primary/80 transition-colors">
            documentation
          </a>
          {' '}or reach out to support
        </p>
      </div>
    </div>
  )
}
