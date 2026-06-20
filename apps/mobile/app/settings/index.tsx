import React from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useStage } from '../../hooks/useStage'
import { useStreakRecord } from '../../hooks/useStreakRecord'
import { useSupportPerson } from '../../hooks/useSupportPerson'
import { useDashboard } from '../../hooks/useDashboard'
import { supabase } from '../../lib/supabase'
import { STAGE_NAMES } from '../../lib/stage'
import { categoryLabel, formatTime, tierLabel, voiceLabel } from '../../lib/settings'
import { formatGoalRupees } from '../../lib/goals'
import { Row, Section } from '../../components/settings/Row'
import { ProfileHeaderCard } from '../../components/settings/ProfileHeaderCard'

/**
 * PROF-01 — Profile Tab Root. Four sections of rows; editable rows show the
 * current value + chevron and push a sub-screen, read-only rows just display
 * (§5 Flow 1). The Profile tab renders this screen.
 */
export default function SettingsRoot() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { stage, quitDate, daysSinceQuit } = useStage()
  const { data: streak } = useStreakRecord()
  const { person } = useSupportPerson()
  const dashboard = useDashboard()

  const { data: journalCount } = useQuery({
    queryKey: ['journal_count', user?.id ?? ''],
    queryFn: async () => {
      const { count } = await supabase
        .from('log')
        .select('log_id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .throwOnError()
      return count ?? 0
    },
    enabled: !!user,
  })

  const { data: attemptCount } = useQuery({
    queryKey: ['attempt_count', user?.id ?? ''],
    queryFn: async () => {
      const { count } = await supabase
        .from('quit_attempts')
        .select('attempt_id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .throwOnError()
      return count ?? 0
    },
    enabled: !!user,
  })

  const quitDateLabel = quitDate
    ? new Date(quitDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Not set'
  const cpd = profile?.cigarettes_per_day
  const price = profile?.price_per_cigarette
  const email = user?.email ?? '—'

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-8 pb-16 gap-7">
      {/* Profile header card (design ProfileScreen header) — avatar + name +
          stage badge + 3 stats, wired to data already loaded here. */}
      <ProfileHeaderCard
        name={profile?.display_name?.trim() || profile?.first_name?.trim() || 'You'}
        stage={stage}
        daysClean={stage === 0 ? null : daysSinceQuit}
        attempts={attemptCount ?? 1}
        savedLabel={dashboard.moneyLabel}
      />

      <Section title="Your Journey">
        <Row
          label="Quit Date"
          value={quitDateLabel}
          onPress={() => router.push(stage === 0 ? '/settings/quit-date' : '/settings/quit-date-redirect')}
        />
        <Row
          label="Cigarettes Per Day"
          value={cpd != null ? `${cpd}/day` : 'Not set'}
          onPress={() => router.push('/settings/cpd')}
        />
        <Row
          label="Price Per Cigarette"
          value={price != null ? `${formatGoalRupees(price)}/stick` : 'Not set'}
          onPress={() => router.push('/settings/price')}
        />
        <Row label="Current Stage" value={`${STAGE_NAMES[stage]}`} />
        <Row label="Quit Attempts" value={`${attemptCount ?? 1}`} />
        <Row label="Streak Freezes" value={`${streak?.freeze_stock ?? 0} remaining`} />
        <Row label="Journal Entries" value={`${journalCount ?? 0} entries`} />
      </Section>

      <Section title="Preferences">
        <Row label="Voice Style" value={voiceLabel(profile?.voice_style ?? null)} onPress={() => router.push('/settings/voice')} />
        <Row label="Spending Category" value={categoryLabel(profile?.relatable_category ?? null)} onPress={() => router.push('/settings/category')} />
        <Row label="Display Name" value={profile?.display_name ?? 'Not set'} onPress={() => router.push('/settings/name')} />
      </Section>

      <Section title="Your Support">
        <Row
          label="SOS Contact"
          value={person?.name ?? 'Not set'}
          onPress={() => router.push('/(modals)/support-person')}
        />
        <Row
          label="Notifications"
          value={
            profile?.notifications_enabled === false
              ? 'Off'
              : tierLabel(profile?.notification_preference ?? null)
          }
          onPress={() => router.push('/settings/notifications')}
        />
        <Row
          label="Quiet Hours"
          value={
            profile?.quiet_hours_enabled
              ? `${formatTime(profile?.quiet_hours_start ?? null)} – ${formatTime(profile?.quiet_hours_end ?? null)}`
              : 'Off'
          }
          onPress={() => router.push('/settings/quiet-hours')}
        />
      </Section>

      <Section title="Privacy & Account">
        <Row label="Account Details" value={email} onPress={() => router.push('/settings/account')} />
        <Row label="Data Export" onPress={() => router.push('/settings/export')} />
        <Row label="Delete Account" danger onPress={() => router.push('/settings/delete')} />
      </Section>
    </ScrollView>
  )
}
