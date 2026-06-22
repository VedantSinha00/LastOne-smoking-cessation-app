import React from 'react'
import { useRouter } from 'expo-router'
import { useProfile } from '../../hooks/useProfile'
import { categoryLabel, voiceLabel } from '../../lib/settings'
import { EditScreen } from '../../components/settings/EditScreen'
import { Row, Section } from '../../components/settings/Row'

/**
 * Settings → Preferences (category sub-screen). Voice / spending category /
 * display name. Editable rows push the existing leaf edit screens.
 */
export default function PreferencesSettings() {
  const router = useRouter()
  const { data: profile } = useProfile()

  return (
    <EditScreen title="Preferences" showSos>
      <Section title="Personalisation">
        <Row
          label="Voice Style"
          value={voiceLabel(profile?.voice_style ?? null)}
          onPress={() => router.push('/settings/voice')}
        />
        <Row
          label="Spending Category"
          value={categoryLabel(profile?.relatable_category ?? null)}
          onPress={() => router.push('/settings/category')}
        />
        <Row
          label="Display Name"
          value={profile?.display_name ?? 'Not set'}
          onPress={() => router.push('/settings/name')}
        />
      </Section>
    </EditScreen>
  )
}
