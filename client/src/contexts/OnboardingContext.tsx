import { createContext, useContext, ReactNode } from 'react'
import { useOnboarding, type OnboardingStep } from '@/hooks/useOnboarding'

interface OnboardingContextType {
  isFirstTimeUser: boolean
  currentStep: OnboardingStep
  hasSeenWelcome: boolean
  hasDiscoveredUrls: boolean
  hasGeneratedFirst: boolean
  hasCompletedOnboarding: boolean
  setStep: (step: OnboardingStep) => void
  markWelcomeSeen: () => void
  markUrlsDiscovered: () => void
  markFirstGenerated: () => void
  completeOnboarding: () => void
  resetOnboarding: () => void
  skipOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const onboarding = useOnboarding()

  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider')
  }
  return context
}
