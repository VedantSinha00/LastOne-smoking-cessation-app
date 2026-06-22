import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { EditScreen } from '../../components/settings/EditScreen'
import { Row, Section } from '../../components/settings/Row'

/**
 * Settings → Privacy & Account (category sub-screen). Reworked to the design's
 * PrivacyScreen visuals while keeping the spec'd logic:
 *  - Account details (PROF-12) + Data Export (PROF-13) stay as rows pushing the
 *    existing leaf flows; Export gains the design's explanatory caption.
 *  - Delete Account (PROF-14) adopts the design's full-width destructive-outline
 *    button + caption, still routing to the existing typed-"DELETE" flow.
 *  - The design's "Group visibility" pills are SKIPPED — Quit Groups is V2 social
 *    with no backing in V1 (logic-wins).
 */
export default function PrivacySettings() {
  const router = useRouter()
  const { user } = useAuth()
  const email = user?.email ?? '—'

  return (
    <EditScreen title="Privacy & Account" showSos showNav>
      <Section title="Account">
        <Row label="Account Details" value={email} onPress={() => router.push('/settings/account')} />
      </Section>

      <Section title="Your data">
        <Row label="Data Export" onPress={() => router.push('/settings/export')} />
        <Text className="text-xs text-muted-foreground mt-1 mb-1">
          Download everything LastOne has stored
        </Text>
      </Section>

      {/* Delete account — design's destructive-outline button (PROF-14 flow). */}
      <View className="mt-5">
        <Pressable
          onPress={() => router.push('/settings/delete')}
          className="rounded-2xl border border-destructive py-3 items-center active:bg-destructive/5"
        >
          <Text className="text-destructive text-sm font-sans-semibold">Delete account</Text>
        </Pressable>
        <Text className="text-xs text-muted-foreground text-center mt-2">
          All data permanently removed
        </Text>
      </View>
    </EditScreen>
  )
}
