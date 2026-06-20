import React, { useEffect, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { parseISO, differenceInHours } from 'date-fns'
import { Check, ChevronDown } from 'lucide-react-native'
import { useStage } from '../../hooks/useStage'
import { SectionLabel } from '../ui/SectionLabel'
import { MILESTONE_STAGES, type MilestoneStage } from '../../lib/healthMilestones'

// Persists which stage card the user has open so it survives re-renders / app
// reopens. -1 = all collapsed. Until the user interacts, the default is the stage
// matching their current quit stage.
const OPEN_KEY = 'health_milestones_open_idx'

/**
 * Health Milestones — the full staged accordion, rendered INLINE on Home, ported
 * 1:1 from the Lovable `HealthMilestones`: Stage 1/2/3 cards that expand in place
 * to show an unlocked (filled ✓) / locked (empty circle) checklist, with an
 * "In progress" badge and a "View more" affordance on the in-progress stage.
 *
 * Unlocked/locked is DERIVED from the user's real quit date (hours since quit vs
 * each milestone offset) — not the design's mock data. The in-progress stage opens
 * expanded by default (matching the design's default-open index).
 */
export const HealthMilestonesAccordion: React.FC = () => {
  const { stage, quitDate } = useStage()
  const hoursSinceQuit = quitDate ? differenceInHours(new Date(), parseISO(quitDate)) : -1

  const stageStates = MILESTONE_STAGES.map((s) => {
    const total = s.milestones.length
    const done = s.milestones.filter((m) => hoursSinceQuit >= m.offsetHours).length
    return { stage: s, total, done, complete: done === total, inProgress: done > 0 && done < total }
  })

  // Default open = the card matching the user's current quit stage. The accordion
  // has 3 stages (indices 0–2) while the app's stage runs 0–5, so clamp: stage 1→0,
  // 2→1, 3+→2, and pre-quit (stage 0) → 0.
  const defaultOpen = Math.min(Math.max(stage - 1, 0), MILESTONE_STAGES.length - 1)

  // Start at the default; once the persisted choice loads (or the user toggles), use
  // that instead. null = not loaded yet → render with the default.
  const [storedIdx, setStoredIdx] = useState<number | null>(null)
  useEffect(() => {
    AsyncStorage.getItem(OPEN_KEY).then((v) => {
      if (v != null) setStoredIdx(parseInt(v, 10))
    })
  }, [])

  const openIdx = storedIdx ?? defaultOpen
  const setOpenIdx = (idx: number) => {
    setStoredIdx(idx)
    AsyncStorage.setItem(OPEN_KEY, String(idx)).catch(() => {})
  }

  return (
    <View>
      <SectionLabel>Health Milestones</SectionLabel>
      <View style={{ gap: 12 }}>
        {!quitDate ? (
          <View className="bg-card border border-border rounded-3xl p-5">
            <Text className="text-muted-foreground text-sm leading-relaxed">
              Set a quit date to start unlocking your recovery milestones.
            </Text>
          </View>
        ) : (
          stageStates.map((s, i) => (
            <StageCard
              key={s.stage.name}
              state={s}
              open={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
              hoursSinceQuit={hoursSinceQuit}
            />
          ))
        )}
      </View>
    </View>
  )
}

interface StageState {
  stage: MilestoneStage
  total: number
  done: number
  complete: boolean
  inProgress: boolean
}

const StageCard: React.FC<{
  state: StageState
  open: boolean
  onToggle: () => void
  hoursSinceQuit: number
}> = ({ state, open, onToggle, hoursSinceQuit }) => {
  const { stage, total, done, complete, inProgress } = state

  return (
    <View
      className="rounded-3xl bg-card border border-border overflow-hidden"
      style={{
        shadowColor: '#15110D',
        shadowOpacity: open ? 0.1 : 0.06,
        shadowRadius: open ? 24 : 16,
        shadowOffset: { width: 0, height: open ? 12 : 6 },
        elevation: open ? 5 : 3,
      }}
    >
      <Pressable
        onPress={onToggle}
        className="px-5 flex-row items-center active:scale-[0.99]"
        style={{ gap: 14, paddingVertical: 22 }}
      >
        <View
          className={`h-11 w-11 rounded-full items-center justify-center ${complete ? 'bg-foreground' : 'bg-secondary'}`}
        >
          <Check size={20} color={complete ? '#FBFAF9' : '#15110D66'} strokeWidth={3} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-display" style={{ fontSize: 16, letterSpacing: -0.2 }}>
            {stage.name} — {stage.range}
          </Text>
          <Text className="text-muted-foreground text-[13px] mt-1">
            {complete ? 'All milestones unlocked' : `${done} / ${total} unlocked`}
          </Text>
        </View>
        {inProgress && !open && (
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: '#0F0D0B' }}>
            <Text className="text-[10px] font-sans-bold" style={{ color: '#FAF8F5' }}>
              In progress
            </Text>
          </View>
        )}
        <ChevronDown
          size={16}
          color="#76706C"
          strokeWidth={2}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {open && (
        <View className="px-6 pb-6 -mt-1">
          {inProgress && (
            <View className="flex-row items-center justify-between mb-4">
              <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: '#0F0D0B' }}>
                <Text className="text-[10px] font-sans-bold" style={{ color: '#FAF8F5' }}>
                  In progress
                </Text>
              </View>
              <Text className="text-muted-foreground text-[11px] font-sans-medium">
                {done} / {total}
              </Text>
            </View>
          )}
          <View style={{ gap: 16 }}>
            {stage.milestones.map((m) => {
              const unlocked = hoursSinceQuit >= m.offsetHours
              return (
                <View key={m.name} className="flex-row items-center" style={{ gap: 14 }}>
                  {unlocked ? (
                    <View className="h-7 w-7 rounded-full bg-foreground items-center justify-center">
                      <Check size={15} color="#FBFAF9" strokeWidth={3} />
                    </View>
                  ) : (
                    <View className="h-7 w-7 rounded-full border border-border bg-background" />
                  )}
                  <Text
                    className={unlocked ? 'text-foreground' : 'text-muted-foreground'}
                    style={{ fontSize: 16 }}
                  >
                    {m.name}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      )}
    </View>
  )
}
