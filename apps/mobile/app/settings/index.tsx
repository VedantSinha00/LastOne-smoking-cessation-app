import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useProfile } from '../../hooks/useProfile'
import { useStage } from '../../hooks/useStage'
import { useStreakRecord } from '../../hooks/useStreakRecord'
import { useDashboard } from '../../hooks/useDashboard'
import { Row, Section } from '../../components/settings/Row'
import { ProfileHeaderCard } from '../../components/settings/ProfileHeaderCard'
import { TopBar } from '../../components/home/TopBar'

/**
 * PROF-01 — Profile Tab Root. Reworked to the Lovable ProfileScreen's two-level
 * model: a profile header card, then CATEGORY rows that drill into category
 * sub-screens (Your Journey / Preferences / Find Support / Privacy & Account),
 * plus a Community section (V2 — "coming soon"). The leaf edit screens (cpd,
 * voice, quiet-hours, …) are unchanged and still reached from the category
 * sub-screens, so all existing edit logic is preserved.
 */
export default function SettingsRoot() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const { stage } = useStage()
  const { data: streak } = useStreakRecord()
  const dashboard = useDashboard()

  return (
    <View className="flex-1 bg-background">
      <TopBar inProfile />
      <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-4 pb-16 gap-7">
      <ProfileHeaderCard
        name={profile?.display_name?.trim() || profile?.first_name?.trim() || 'You'}
        stage={stage}
        // "Lifetime" = lifetime smoke-free days (never drops, survives slips) —
        // the spec's lifetime metric, same source + label as the StreakBar's
        // Lifetime column. NOT calendar days since quit (counted smoked days) and
        // NOT the current streak (which the old "days clean" label implied).
        smokeFreeDays={stage === 0 ? null : streak?.lifetime_smoke_free_days ?? 0}
        savedLabel={dashboard.moneyLabel}
      />

      <Section title="Your Account">
        <Row label="Your Journey" onPress={() => router.push('/settings/journey')} />
        <Row label="Preferences" onPress={() => router.push('/settings/preferences')} />
        <Row label="Find Support" onPress={() => router.push('/settings/support')} />
        <Row label="Privacy & Account" onPress={() => router.push('/settings/privacy')} />
      </Section>

      <Section title="Community">
        <Row label="Refer & Invite" onPress={() => router.push('/settings/refer')} />
        <Row label="Your Cheerleaders" onPress={() => router.push('/settings/cheerleaders')} />
      </Section>

      <Text className="text-muted-foreground text-[11px] text-center mt-2">LastOne v1.0</Text>
      </ScrollView>
    </View>
  )
}
