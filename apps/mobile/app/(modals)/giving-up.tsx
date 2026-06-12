import React, { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  Linking,
  Platform,
  ToastAndroid,
  Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { subDays } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useStage } from '../../hooks/useStage'
import { useSupportPerson } from '../../hooks/useSupportPerson'
import { supabase } from '../../lib/supabase'
import {
  beat2Lines,
  guVoice,
  GU_COPY,
  resistanceData,
  RESOURCE_CARDS,
  telUrl,
  whatsappUrl,
} from '../../lib/givingUp'
import { Button } from '../../components/ui/button'
import type { Database, GuCallOutcome } from '../../types/database'

type GuEventUpdate = Database['public']['Tables']['giving_up_event']['Update']
type Screen = 'beat1' | 'beat2' | 'beat3' | 'talk' | 'precall' | 'postcall' | 'resources'

const toast = (msg: string) => {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT)
  else Alert.alert(msg)
}

/**
 * Tier 1–3 Giving Up experience (GU-2 → GU-8). Entered from the GU-1 home
 * card (with an eventId to progress-track) or from SOS-3's Tier-3 link
 * (?screen=resources, no event). Mid-flow exit leaves the event's outcome at
 * its initial 'dismissed_mid_flow'. Same-session resume comes free: the modal
 * keeps its state while the app is backgrounded; a killed app = new session =
 * the card re-triggers (Spec §8).
 */
export default function GivingUpExperience() {
  const router = useRouter()
  const params = useLocalSearchParams<{ eventId?: string; screen?: string }>()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { quitDate } = useStage()
  const { person, configured } = useSupportPerson()

  const fromSos = params.screen === 'resources'
  const [screen, setScreen] = useState<Screen>(fromSos ? 'resources' : 'beat1')
  const [callError, setCallError] = useState(false)

  const voice = guVoice(profile?.voice_style ?? null)
  const eventId = params.eventId ?? null

  // Beat 2 counts — 14-day window, falling back to since-quit-start (§B2).
  const { data: counts } = useQuery({
    queryKey: ['gu_overcome_counts', user?.id ?? ''],
    queryFn: async () => {
      const since14 = subDays(new Date(), 14).toISOString()
      const base = () =>
        supabase
          .from('log')
          .select('log_id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .eq('log_type', 'overcome')
      const [recent, allTime] = await Promise.all([
        base().gte('timestamp', since14),
        quitDate ? base().gte('timestamp', quitDate) : base(),
      ])
      return { last14: recent.count ?? 0, allTime: allTime.count ?? 0 }
    },
    enabled: !!user,
  })

  const resistance = counts ? resistanceData(counts.last14, counts.allTime) : null

  const patch = (fields: GuEventUpdate) => {
    if (!eventId) return
    // Fire-and-forget: progress tracking must never block the experience.
    supabase.from('giving_up_event').update(fields).eq('event_id', eventId).then(() => {})
  }

  const close = () => router.back()

  const advanceFromBeat1 = () => {
    patch({ beat_1_completed: true })
    // Skip GU-3 entirely when there's nothing to show — never render a zero (§5).
    if (resistance) {
      setScreen('beat2')
    } else {
      setScreen('beat3')
    }
  }

  const advanceFromBeat2 = () => {
    patch({ beat_2_completed: true, resistance_count_shown: resistance?.count ?? null })
    setScreen('beat3')
  }

  const keptGoing = () => {
    patch({ outcome: 'kept_going' })
    close()
  }

  const wantsToTalk = () => {
    patch({ outcome: 'routed_to_support' })
    setScreen('talk')
  }

  const dismissTalk = () => {
    patch({ support_action: 'dismissed' })
    close()
  }

  const callPerson = async () => {
    if (!person) return
    patch({ support_action: 'called_person' })
    try {
      await Linking.openURL(telUrl(person.phone))
      setScreen('postcall')
    } catch {
      setCallError(true) // quiet error → surface "Try WhatsApp instead" (§8)
    }
  }

  const whatsappPerson = async () => {
    if (!person) return
    patch({ support_action: 'whatsapped_person' })
    try {
      await Linking.openURL(whatsappUrl(person.phone))
      setScreen('postcall')
    } catch {
      setCallError(true)
    }
  }

  const logCallOutcome = (outcome: GuCallOutcome) => {
    patch({ support_call_outcome: outcome })
    close()
    toast('Good that you reached out.')
  }

  // ── GU-2 — Beat 1: Validation ───────────────────────────────────────────────
  if (screen === 'beat1') {
    return (
      <View className="flex-1 bg-background px-8 justify-center">
        <Text className="text-foreground font-display text-2xl leading-relaxed">
          {GU_COPY.beat1[voice]}
        </Text>
        <View className="mt-12">
          <Button title="Keep going" onPress={advanceFromBeat1} />
        </View>
      </View>
    )
  }

  // ── GU-3 — Beat 2: Resistance data (skipped when resistance is null) ───────
  if (screen === 'beat2' && resistance) {
    const lines = beat2Lines(voice, resistance)
    return (
      <View className="flex-1 bg-background px-8 justify-center">
        <Text className="text-primary font-display text-3xl leading-snug">{lines.headline}</Text>
        <Text className="text-muted-foreground text-base leading-relaxed mt-6">
          {lines.support}
        </Text>
        <View className="mt-12">
          <Button title="Keep going" onPress={advanceFromBeat2} />
        </View>
      </View>
    )
  }

  // ── GU-4 — Beat 3: Choice ───────────────────────────────────────────────────
  if (screen === 'beat3' || screen === 'beat2') {
    return (
      <View className="flex-1 bg-background px-8 justify-center">
        <Text className="text-foreground font-display text-2xl leading-relaxed">
          {GU_COPY.beat3[voice]}
        </Text>
        <View className="mt-12 gap-3">
          <Button title="Just keep going" onPress={keptGoing} />
          <Button title="I want to talk to someone" variant="secondary" onPress={wantsToTalk} />
        </View>
      </View>
    )
  }

  // ── GU-5 — Talk options (half-sheet feel: bottom-anchored card) ─────────────
  if (screen === 'talk') {
    return (
      <View className="flex-1 bg-black/40 justify-end">
        <Pressable className="flex-1" onPress={dismissTalk} />
        <View className="bg-card rounded-t-3xl p-6 pb-10">
          <Text className="text-foreground font-display text-xl">
            Who do you want to reach out to?
          </Text>
          <Text className="text-muted-foreground text-sm mt-1">{GU_COPY.talkSubtext[voice]}</Text>
          <View className="mt-5 gap-3">
            {configured && person ? (
              <Button title={`Call ${person.name}`} onPress={() => setScreen('precall')} />
            ) : (
              <Button
                title="Set up a support person"
                onPress={() => router.push('/(modals)/support-person')}
              />
            )}
            <Button
              title="Talk to a counsellor"
              variant="secondary"
              onPress={() => {
                patch({ support_action: 'viewed_resources' })
                setScreen('resources')
              }}
            />
          </View>
        </View>
      </View>
    )
  }

  // ── GU-6 — Pre-call ─────────────────────────────────────────────────────────
  if (screen === 'precall' && person) {
    return (
      <View className="flex-1 bg-background px-8 justify-center">
        <Pressable onPress={() => setScreen('talk')} hitSlop={12} className="absolute top-14 left-6">
          <Text className="text-foreground text-2xl">←</Text>
        </Pressable>
        <View className="w-16 h-16 rounded-full bg-primary/15 items-center justify-center self-center">
          <Text className="text-primary font-display text-2xl">
            {person.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text className="text-foreground font-display text-xl text-center mt-6 leading-relaxed">
          {GU_COPY.preCall[voice].replace(/\[Name\]/g, person.name)}
        </Text>
        {callError && (
          <Text className="text-craving text-sm text-center mt-4">
            That didn&apos;t go through. Try WhatsApp instead?
          </Text>
        )}
        <View className="mt-10 gap-3">
          <Button title="Call" onPress={callPerson} />
          <Button title="WhatsApp" variant="secondary" onPress={whatsappPerson} />
        </View>
      </View>
    )
  }

  // ── GU-7 — Post-call log ────────────────────────────────────────────────────
  if (screen === 'postcall') {
    return (
      <View className="flex-1 bg-background px-8 justify-center">
        <Pressable onPress={close} hitSlop={12} className="absolute top-14 right-6">
          <Text className="text-muted-foreground text-base">Skip</Text>
        </Pressable>
        <Text className="text-foreground font-display text-2xl">How did that go?</Text>
        <View className="mt-8 gap-3">
          <Button title="Helped a lot" onPress={() => logCallOutcome('helped_a_lot')} />
          <Button
            title="Helped a little"
            variant="secondary"
            onPress={() => logCallOutcome('helped_a_little')}
          />
          <Button
            title="Didn't really help"
            variant="secondary"
            onPress={() => logCallOutcome('didnt_help')}
          />
        </View>
      </View>
    )
  }

  // ── GU-8 — Professional resources ───────────────────────────────────────────
  return (
    <View className="flex-1 bg-background px-6 pt-14">
      <Pressable
        onPress={() => (fromSos ? close() : setScreen('talk'))}
        hitSlop={12}
        className="mb-6"
      >
        <Text className="text-foreground text-2xl">←</Text>
      </Pressable>
      <Text className="text-foreground font-display text-xl leading-relaxed mb-6">
        {GU_COPY.resourcesIntro[voice]}
      </Text>
      {/* ⚠ numbers are provisional — team must verify before ship (§5 GU-8). */}
      {RESOURCE_CARDS.map((card) => (
        <View key={card.id} className="bg-card border border-border rounded-3xl p-5 mb-4">
          <Text className="text-foreground font-sans-bold text-base">{card.organisation}</Text>
          <Text className="text-muted-foreground text-sm mt-1 leading-relaxed">
            {card.description}
          </Text>
          <Text className="text-muted-foreground text-xs mt-2">{card.phoneDisplay}</Text>
          <View className="mt-3">
            <Button title="Call" onPress={() => Linking.openURL(telUrl(card.phone))} />
          </View>
        </View>
      ))}
    </View>
  )
}
