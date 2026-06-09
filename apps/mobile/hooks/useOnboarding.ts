import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { initialOnboardingState, type OnboardingState } from '../lib/onboarding'

// Ordered screen sequence (Onboarding Spec §5 / Architecture Guide §7.4).
// OB-21 was removed in V1.2. OB-11b (relatable category) is the Step 12 pre-build,
// inserted right after the cigarettes+cost screen. currentStep indexes into this.
export const STEP_ORDER = [
  'OB01', 'OB02', 'OB03', 'OB04', 'OB05', 'OB06', 'OB07', 'OB08', 'OB09',
  'OB10', 'OB11', 'OB11b', 'OB12', 'OB13', 'OB14', 'OB15', 'OB16', 'OB17',
  'OB18', 'OB19', 'OB20', 'OB22', 'OB23',
] as const

export type StepKey = (typeof STEP_ORDER)[number]

/**
 * Conditional screens (Onboarding Spec §B2.3, §5):
 *  - OB-17 (struggles) only if there's quit history.
 *  - OB-22 (commitment) only if a quit date was set.
 * Everything else is always visible.
 */
function isStepVisible(key: StepKey, state: OnboardingState): boolean {
  // OB-05 (create account) is skipped once a session exists, so it never flashes
  // for an already-signed-in user. (OB05CreateAccount also advances itself when
  // sign-in completes while the screen is showing.)
  if (key === 'OB05') return state.userId == null
  if (key === 'OB17') return state.previousQuitAttempts !== 'never'
  if (key === 'OB22') return state.quitDate !== null
  return true
}

function nextVisibleIndex(from: number, state: OnboardingState): number {
  for (let i = from + 1; i < STEP_ORDER.length; i++) {
    if (isStepVisible(STEP_ORDER[i], state)) return i
  }
  return from
}

function prevVisibleIndex(from: number, state: OnboardingState): number {
  for (let i = from - 1; i >= 0; i--) {
    if (isStepVisible(STEP_ORDER[i], state)) return i
  }
  return from
}

type OnboardingContextValue = {
  state: OnboardingState
  currentKey: StepKey
  setAnswer: <K extends keyof OnboardingState>(field: K, value: OnboardingState[K]) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined)

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [state, setState] = useState<OnboardingState>(initialOnboardingState)

  // user_id is set when OB-05 sign-in completes (or immediately if a session
  // already exists — e.g. a user who created an account but didn't finish).
  useEffect(() => {
    if (user?.id && user.id !== state.userId) {
      setState((s) => ({ ...s, userId: user.id }))
    }
  }, [user?.id, state.userId])

  const setAnswer = useCallback<OnboardingContextValue['setAnswer']>((field, value) => {
    setState((s) => ({ ...s, [field]: value }))
  }, [])

  const nextStep = useCallback(() => {
    setState((s) => ({ ...s, currentStep: nextVisibleIndex(s.currentStep, s) }))
  }, [])

  const prevStep = useCallback(() => {
    setState((s) => ({ ...s, currentStep: prevVisibleIndex(s.currentStep, s) }))
  }, [])

  const goToStep = useCallback((step: number) => {
    const clamped = Math.max(0, Math.min(step, STEP_ORDER.length - 1))
    setState((s) => ({ ...s, currentStep: clamped }))
  }, [])

  const value: OnboardingContextValue = {
    state,
    currentKey: STEP_ORDER[state.currentStep],
    setAnswer,
    nextStep,
    prevStep,
    goToStep,
  }

  return React.createElement(OnboardingContext.Provider, { value }, children)
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext)
  if (ctx === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return ctx
}
