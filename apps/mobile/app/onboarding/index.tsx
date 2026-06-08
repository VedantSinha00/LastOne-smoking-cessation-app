import React, { useEffect } from 'react'
import { BackHandler } from 'react-native'
import { useOnboarding, type StepKey } from '../../hooks/useOnboarding'
import {
  OB01Logo,
  OB02Welcome,
  OB03Intro,
  OB04Promise,
  OB09Buffer1,
  OB18Buffer2,
} from '../../components/onboarding/narrative'
import {
  OB06Name,
  OB07Age,
  OB08LifeStage,
  OB10Intent,
  OB11bCategory,
  OB12Reasons,
  OB13Triggers,
  OB14FirstCig,
  OB15Craving,
  OB16QuitHistory,
  OB17Struggles,
  OB19Motivation,
} from '../../components/onboarding/questions'
import { OB05CreateAccount } from '../../components/onboarding/OB05CreateAccount'
import { OB11CigarettesAndCost } from '../../components/onboarding/OB11CigarettesAndCost'
import { OB20QuitDate } from '../../components/onboarding/OB20QuitDate'
import { OB22Commitment } from '../../components/onboarding/OB22Commitment'
import { OB23Confirmation } from '../../components/onboarding/OB23Confirmation'

const SCREENS: Record<StepKey, React.ComponentType> = {
  OB01: OB01Logo,
  OB02: OB02Welcome,
  OB03: OB03Intro,
  OB04: OB04Promise,
  OB05: OB05CreateAccount,
  OB06: OB06Name,
  OB07: OB07Age,
  OB08: OB08LifeStage,
  OB09: OB09Buffer1,
  OB10: OB10Intent,
  OB11: OB11CigarettesAndCost,
  OB11b: OB11bCategory,
  OB12: OB12Reasons,
  OB13: OB13Triggers,
  OB14: OB14FirstCig,
  OB15: OB15Craving,
  OB16: OB16QuitHistory,
  OB17: OB17Struggles,
  OB18: OB18Buffer2,
  OB19: OB19Motivation,
  OB20: OB20QuitDate,
  OB22: OB22Commitment,
  OB23: OB23Confirmation,
}

export default function Onboarding() {
  const { currentKey, prevStep } = useOnboarding()

  // Android hardware back walks the flow backwards. On the first two screens
  // there's nothing behind, so let the system exit the app (Spec OB-02).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentKey === 'OB01' || currentKey === 'OB02') return false
      prevStep()
      return true
    })
    return () => sub.remove()
  }, [currentKey, prevStep])

  const Screen = SCREENS[currentKey]
  return <Screen />
}
