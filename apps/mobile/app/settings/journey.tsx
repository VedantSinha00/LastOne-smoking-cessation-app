import React from 'react'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useStage } from '../../hooks/useStage'
import { useStreakRecord } from '../../hooks/useStreakRecord'
import { supabase } from '../../lib/supabase'
import { STAGE_NAMES } from '../../lib/stage'
import { formatGoalRupees } from '../../lib/goals'
import { EditScreen } from '../../components/settings/EditScreen'
import { Row, Section } from '../../components/settings/Row'

/**
 * Settings → Your Journey (category sub-screen of the two-level Profile). Groups
 * the quit-detail + history rows. Editable rows push the existing leaf edit
 * screens (logic unchanged).
 */
export default function JourneySettings() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { stage, quitDate } = useStage()
  const { data: streak } = useStreakRecord()

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

  return (
    <EditScreen title="Your Journey">
      <Section title="Quit details">
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
      </Section>

      <Section title="History">
        <Row label="Current Stage" value={`${STAGE_NAMES[stage]}`} />
        <Row label="Quit Attempts" value={`${attemptCount ?? 1}`} />
        <Row label="Streak Freezes" value={`${streak?.freeze_stock ?? 0} remaining`} />
        <Row label="Journal Entries" value={`${journalCount ?? 0} entries`} />
      </Section>
    </EditScreen>
  )
}
