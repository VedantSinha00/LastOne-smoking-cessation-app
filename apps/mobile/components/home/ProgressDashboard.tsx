import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Wallet, CigaretteOff } from 'lucide-react-native'
import { Card } from '../ui/Card'
import type { Stage } from '../../lib/stage'
import { useDashboard } from '../../hooks/useDashboard'
import { formatRupees } from '../../lib/savings'

/** Which counter a card represents — used as the DASH-2 deep-link param. */
export type CounterKey = 'money' | 'time' | 'cigarettes'

/**
 * Single tall counter card — Lovable `ProgressCards` style: a line icon, a big
 * 26px Space Grotesk number, a small label, and a relatable subline pinned to
 * the bottom. Pressable → DASH-2 expanded view.
 */
interface GridCardProps {
  Icon: typeof Wallet
  value: string
  label: string
  subline?: string
  onPress?: () => void
  dimmed?: boolean
}

const GridCard: React.FC<GridCardProps> = ({ Icon, value, label, subline, onPress, dimmed }) => (
  <Card
    onPress={onPress}
    style={{ minHeight: 148 }}
    className={`flex-1 ${dimmed ? 'opacity-50' : ''}`}
  >
    <Icon size={16} color="#7FC200" strokeWidth={2} />
    <Text
      className="text-foreground font-display mt-4"
      style={{ fontSize: 26, letterSpacing: -0.5 }}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {value}
    </Text>
    <Text className="text-muted-foreground text-xs mt-0.5">{label}</Text>
    {subline ? (
      <Text className="text-foreground/70 text-xs mt-auto pt-4" numberOfLines={1}>
        {subline}
      </Text>
    ) : null}
  </Card>
)

/**
 * Progress Dashboard — DASH-1 (ProgressDashboard_Spec §2, §6).
 *
 * Home preview shows TWO counters in a 2-up grid (Money Saved + Cigarettes Not
 * Smoked) per the Lovable design — a conscious override of the spec's "three
 * counters" (Time Reclaimed lives on the /progress detail). See
 * [[project_home_design_vs_spec]] conflict 4. Tapping a card → DASH-2.
 *
 * Stage 0:           counters show 0 with a per-day preview rate (motivational).
 *                    Expanded view not accessible (no taps).
 * Onboarding gaps:   if cigarettes/day or price not set, show "—" + Settings prompt.
 * Stage 1+ (live):   real counters with relatable subline; cards tappable.
 */
export const ProgressDashboard: React.FC<{ stage: Stage }> = ({ stage }) => {
  const router = useRouter()
  const d = useDashboard()
  const isPreQuit = stage === 0

  const [showSavingsEquivalent, setShowSavingsEquivalent] = React.useState(true)

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem('show_savings_equivalent').then((val) => {
        if (val !== null) setShowSavingsEquivalent(val === 'true')
      })
    }, [])
  )

  // Home progress cards open the Progress "WHAT YOU'VE GAINED" main view (the 3
  // hero cards), not a specific counter's drill-down — the overview is the natural
  // landing, and the user taps into a counter from there.
  const openProgress = () => router.push('/progress')

  // ── Onboarding incomplete (§8): no cigarettes/day or price → "—" prompt ──────
  if (!d.isLoading && !d.hasOnboardingInputs) {
    return (
      <View>
        <View className="flex-row" style={{ gap: 12 }}>
          <GridCard Icon={Wallet} value="—" label="saved" onPress={() => router.push('/profile')} dimmed />
          <GridCard Icon={CigaretteOff} value="—" label="not smoked" onPress={() => router.push('/profile')} dimmed />
        </View>
        <Text className="text-craving text-xs text-center mt-3">
          Set your daily cigarettes and cost to track your progress.
        </Text>
      </View>
    )
  }

  // ── Stage 0 preview (§6): zero counters + per-day accrual rate ───────────────
  if (isPreQuit) {
    const p = d.preview
    return (
      <View className="flex-row" style={{ gap: 12 }}>
        <GridCard
          Icon={Wallet}
          value="₹0"
          label="saved"
          subline={p ? `${formatRupees(p.moneyPaisePerDay)}/day once you quit` : undefined}
        />
        <GridCard
          Icon={CigaretteOff}
          value="0"
          label="not smoked"
          subline={p ? `${p.cigarettesPerDay}/day once you quit` : undefined}
        />
      </View>
    )
  }

  // ── Stage 1+ live counters (§2) ──────────────────────────────────────────────
  // Two cards on Home (design); Time Reclaimed lives on the /progress detail.
  const cigsPerDay = d.preview?.cigarettesPerDay
  return (
    <View className="flex-row" style={{ gap: 12 }}>
      <GridCard
        Icon={Wallet}
        value={d.moneyLabel}
        label="saved"
        subline={showSavingsEquivalent ? d.moneyEquivalentLine : undefined}
        onPress={openProgress}
      />
      <GridCard
        Icon={CigaretteOff}
        value={d.cigarettesLabel}
        label="not smoked"
        subline={cigsPerDay ? `${cigsPerDay} per day average` : undefined}
        onPress={openProgress}
      />
    </View>
  )
}
