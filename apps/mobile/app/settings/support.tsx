import React from 'react'
import { useRouter } from 'expo-router'
import { useProfile } from '../../hooks/useProfile'
import { useSupportPerson } from '../../hooks/useSupportPerson'
import { formatTime, tierLabel } from '../../lib/settings'
import { EditScreen } from '../../components/settings/EditScreen'
import { Row, Section } from '../../components/settings/Row'

/**
 * Settings → Find Support (category sub-screen). SOS contact + notification
 * preferences + quiet hours. Editable rows push the existing leaf edit screens.
 */
export default function SupportSettings() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const { person } = useSupportPerson()

  return (
    <EditScreen title="Find Support">
      <Section title="Your person">
        <Row
          label="SOS Contact"
          value={person?.name ?? 'Not set'}
          onPress={() => router.push('/(modals)/support-person')}
        />
      </Section>

      <Section title="Notifications">
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
    </EditScreen>
  )
}
