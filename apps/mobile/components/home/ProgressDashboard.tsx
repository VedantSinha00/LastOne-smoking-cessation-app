import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Card } from '../ui/Card'
import type { Stage } from '../../lib/stage'
import { useDashboard } from '../../hooks/useDashboard'
import { formatRupees, formatDuration } from '../../lib/savings'

/** Which counter a card represents — used as the DASH-2 deep-link param. */
export type CounterKey = 'money' | 'time' | 'cigarettes'

interface CounterCardProps {
  label: string
  value: string
  caption?: string
  onPress?: () => void
  dimmed?: boolean
}

const CounterCard: React.FC<CounterCardProps> = ({ label, value, caption, onPress, dimmed }) => {
  const body = (
    <>
      <Text className="text-foreground font-display text-xl" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text className="text-muted-foreground text-[11px] mt-1 text-center">{label}</Text>
      {caption ? (
        <Text className="text-muted-foreground text-[10px] mt-0.5 text-center leading-tight" numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </>
  )
  if (!onPress) {
    return <View className={`items-center flex-1 ${dimmed ? 'opacity-50' : ''}`}>{body}</View>
  }
  return (
    <Pressable onPress={onPress} className="items-center flex-1 active:opacity-70">
      {body}
    </Pressable>
  )
}

/**
 * Progress Dashboard — DASH-1 (ProgressDashboard_Spec §2, §6). Three gain-framed
 * counters on the home screen. Always visible. Tapping a counter opens its DASH-2
 * expanded view.
 *
 * Stage 0:           counters show 0 with a per-day preview rate (motivational).
 *                    Expanded view not accessible (no taps).
 * Onboarding gaps:   if cigarettes/day or price not set, show "—" + Settings prompt.
 * Stage 1+ (live):   real counters with relatable-equivalent caption; cards tappable.
 */
export const ProgressDashboard: React.FC<{ stage: Stage }> = ({ stage }) => {
  const router = useRouter()
  const d = useDashboard()
  const isPreQuit = stage === 0

  const openCounter = (counter: CounterKey) =>
    router.push({ pathname: '/progress', params: { counter } })

  // ── Onboarding incomplete (§8): no cigarettes/day or price → "—" prompt ──────
  if (!d.isLoading && !d.hasOnboardingInputs) {
    return (
      <Card onPress={() => router.push('/profile')}>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-3">
          Your Progress
        </Text>
        <View className="flex-row justify-between mb-3">
          {(['Saved', 'Time back', 'Not smoked'] as const).map((label) => (
            <View key={label} className="items-center flex-1">
              <Text className="text-muted-foreground font-display text-xl">—</Text>
              <Text className="text-muted-foreground text-[11px] mt-1">{label}</Text>
            </View>
          ))}
        </View>
        <Text className="text-craving text-xs text-center">
          Set your daily cigarettes and cost to track your progress.
        </Text>
      </Card>
    )
  }

  // ── Stage 0 preview (§6): zero counters + per-day accrual rate ───────────────
  if (isPreQuit) {
    const p = d.preview
    return (
      <Card>
        <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-3">
          Your Progress · Preview
        </Text>
        <View className="flex-row justify-between">
          <CounterCard
            label="Saved"
            value="₹0"
            caption={p ? `${formatRupees(p.moneyPaisePerDay)}/day once you quit` : undefined}
          />
          <CounterCard
            label="Time back"
            value="0h"
            caption={p ? `${formatDuration(p.minutesPerDay)}/day once you quit` : undefined}
          />
          <CounterCard
            label="Not smoked"
            value="0"
            caption={p ? `${p.cigarettesPerDay}/day once you quit` : undefined}
          />
        </View>
      </Card>
    )
  }

  // ── Stage 1+ live counters (§2) ──────────────────────────────────────────────
  return (
    <Card>
      <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-3">
        Your Progress
      </Text>
      <View className="flex-row justify-between">
        <CounterCard
          label="Saved"
          value={d.moneyLabel}
          caption={d.moneyEquivalentLine}
          onPress={() => openCounter('money')}
        />
        <CounterCard
          label="Time back"
          value={d.timeLabel}
          caption={d.timeEquivalentLine}
          onPress={() => openCounter('time')}
        />
        <CounterCard
          label="Not smoked"
          value={d.cigarettesLabel}
          onPress={() => openCounter('cigarettes')}
        />
      </View>
    </Card>
  )
}
