import React from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { EditScreen } from '../../components/settings/EditScreen'
import { Row, Section } from '../../components/settings/Row'

/**
 * Settings → Privacy & Account (category sub-screen). Account details, data
 * export, and delete account. Editable rows push the existing leaf edit screens.
 */
export default function PrivacySettings() {
  const router = useRouter()
  const { user } = useAuth()
  const email = user?.email ?? '—'

  return (
    <EditScreen title="Privacy & Account" showSos>
      <Section title="Account">
        <Row label="Account Details" value={email} onPress={() => router.push('/settings/account')} />
      </Section>

      <Section title="Your data">
        <Row label="Data Export" onPress={() => router.push('/settings/export')} />
        <Row label="Delete Account" danger onPress={() => router.push('/settings/delete')} />
      </Section>
    </EditScreen>
  )
}
