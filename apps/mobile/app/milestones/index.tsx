import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { parseISO, differenceInHours } from 'date-fns'
import { Check, ChevronDown } from 'lucide-react-native'
import { useStage } from '../../hooks/useStage'
import { MILESTONE_STAGES, type MilestoneStage } from '../../lib/healthMilestones'
import { ScreenHeader } from '../../components/ui/ScreenHeader'

/**
 * STK-8 — Health Milestones timeline. The design's multi-stage expandable
 * accordion (Stage 1/2/3, each with an unlocked/locked checklist + "In progress"
 * badge). Reached from the Home Health Milestones countdown card.
 *
 * Unlocked/locked is DERIVED from the user's real quit date (hours since quit vs
 * each milestone's offset) — not mock. A stage is "in progress" when some but not
 * all of its milestones are unlocked; it opens expanded by default.
 */
export default function MilestonesTimeline() {
  const router = useRouter()
  const { quitDate } = useStage()

  const hoursSinceQuit = quitDate ? differenceInHours(new Date(), parseISO(quitDate)) : -1

  // Compute per-stage unlocked counts to find the "in progress" stage (first one
  // not fully unlocked) — it opens expanded by default.
  const stageStates = MILESTONE_STAGES.map((stage) => {
    const total = stage.milestones.length
    const done = stage.milestones.filter((m) => hoursSinceQuit >= m.offsetHours).length
    return { stage, total, done, complete: done === total, inProgress: done > 0 && done < total }
  })
  const defaultOpen = stageStates.findIndex((s) => s.inProgress)
  const [openIdx, setOpenIdx] = useState<number>(defaultOpen >= 0 ? defaultOpen : 0)

  return (
    <View className="flex-1 bg-background">
      {/* Explicit back to Home — this screen is pushed from the Home health card. */}
      <ScreenHeader title="Health Milestones" onBack={() => router.navigate('/(tabs)/')} />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-2 pb-12 gap-3">
      {!quitDate && (
        <View className="bg-card border border-border rounded-3xl p-5">
          <Text className="text-muted-foreground text-sm leading-relaxed">
            Set a quit date to start unlocking your recovery milestones.
          </Text>
        </View>
      )}

      {quitDate &&
        stageStates.map((s, i) => (
          <StageCard
            key={s.stage.name}
            state={s}
            open={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
            hoursSinceQuit={hoursSinceQuit}
          />
        ))}
      </ScrollView>
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
      <Pressable onPress={onToggle} className="p-5 flex-row items-center active:scale-[0.99]" style={{ gap: 12 }}>
        <View
          className={`h-8 w-8 rounded-full items-center justify-center ${complete ? 'bg-foreground' : 'bg-secondary'}`}
        >
          <Check size={16} color={complete ? '#FBFAF9' : '#76706C66'} strokeWidth={3} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-display" style={{ fontSize: 14, letterSpacing: -0.2 }}>
            {stage.name} — {stage.range}
          </Text>
          <Text className="text-muted-foreground text-xs mt-0.5">
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
          <View style={{ gap: 12 }}>
            {stage.milestones.map((m) => {
              const unlocked = hoursSinceQuit >= m.offsetHours
              return (
                <View key={m.name} className="flex-row items-center" style={{ gap: 12 }}>
                  {unlocked ? (
                    <View className="h-5 w-5 rounded-full bg-foreground items-center justify-center">
                      <Check size={12} color="#FBFAF9" strokeWidth={3} />
                    </View>
                  ) : (
                    <View className="h-5 w-5 rounded-full border border-border bg-background" />
                  )}
                  <Text className={`text-sm ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
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
