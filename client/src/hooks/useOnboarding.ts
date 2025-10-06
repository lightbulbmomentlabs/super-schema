import { useState, useEffect } from 'react'

export type OnboardingStep = 'welcome' | 'discover' | 'select' | 'generate' | 'success' | 'completed'

interface OnboardingState {
  isFirstTimeUser: boolean
  currentStep: OnboardingStep
  hasSeenWelcome: boolean
  hasDiscoveredUrls: boolean
  hasGeneratedFirst: boolean
  hasCompletedOnboarding: boolean
}

const STORAGE_KEY = 'superschema_onboarding'

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        // If parsing fails, return default state
      }
    }
    return {
      isFirstTimeUser: true,
      currentStep: 'welcome',
      hasSeenWelcome: false,
      hasDiscoveredUrls: false,
      hasGeneratedFirst: false,
      hasCompletedOnboarding: false,
    }
  })

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const setStep = (step: OnboardingStep) => {
    setState(prev => ({ ...prev, currentStep: step }))
  }

  const markWelcomeSeen = () => {
    setState(prev => ({ ...prev, hasSeenWelcome: true, currentStep: 'discover' }))
  }

  const markUrlsDiscovered = () => {
    setState(prev => ({ ...prev, hasDiscoveredUrls: true, currentStep: 'select' }))
  }

  const markFirstGenerated = () => {
    setState(prev => ({ ...prev, hasGeneratedFirst: true, currentStep: 'success' }))
  }

  const completeOnboarding = () => {
    setState(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      currentStep: 'completed',
      isFirstTimeUser: false,
    }))
  }

  const resetOnboarding = () => {
    setState({
      isFirstTimeUser: true,
      currentStep: 'welcome',
      hasSeenWelcome: false,
      hasDiscoveredUrls: false,
      hasGeneratedFirst: false,
      hasCompletedOnboarding: false,
    })
  }

  const skipOnboarding = () => {
    setState(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      currentStep: 'completed',
      isFirstTimeUser: false,
    }))
  }

  return {
    ...state,
    setStep,
    markWelcomeSeen,
    markUrlsDiscovered,
    markFirstGenerated,
    completeOnboarding,
    resetOnboarding,
    skipOnboarding,
  }
}
