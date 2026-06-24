import React from 'react'
import { View, Text, Pressable, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { Pencil, Phone } from 'lucide-react-native'
import { useProfile } from '../../hooks/useProfile'
import { useSupportPerson } from '../../hooks/useSupportPerson'
import { formatTime, tierLabel } from '../../lib/settings'
import { RESOURCE_CARDS, telUrl } from '../../lib/givingUp'
import { EditScreen } from '../../components/settings/EditScreen'
import { Row, Section } from '../../components/settings/Row'

/**
 * Settings → Find Support (category sub-screen). Reworked to the design's
 * SupportScreen visuals while keeping the spec'd logic:
 *  - SOS contact CARD (avatar + name + phone + Edit), wired to the real support
 *    person (SecureStore, GU Spec §B1). Edit → the existing setup flow.
 *  - Notifications stays the SPEC model (PROF-10 master toggle + 3-tier
 *    frequency, PROF-11 quiet hours) via rows — NOT the design's four per-
 *    category toggles, which aren't spec'd ("Friend activity" is V2 social).
 *  - Quit helpline uses the app's already-verified RESOURCE_CARDS (National
 *    Tobacco Quitline + iCall), NOT the design's raw numbers — verified contacts
 *    are required before shipping helpline numbers (security constraint).
 */
export default function SupportSettings() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const { person } = useSupportPerson()

  const initial = person?.name?.trim()?.[0]?.toUpperCase() ?? '+'

  return (
    <EditScreen title="Find Support" showSos showNav>
      <Section title="SOS contact">
        <Pressable
          onPress={() => router.push('/(modals)/support-person')}
          className="rounded-2xl bg-card border border-border p-4 active:opacity-[0.97]"
        >
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <View className="h-10 w-10 rounded-full bg-secondary items-center justify-center">
              <Text className="text-sm font-sans-semibold text-foreground">{initial}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-sans-semibold text-foreground">
                {person?.name ?? 'Not set'}
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                {person?.phone ?? 'Tap to add your person'}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Pencil size={14} color="#7FC200" strokeWidth={2.5} />
              <Text className="text-primary text-xs font-sans-semibold">
                {person ? 'Edit' : 'Add'}
              </Text>
            </View>
          </View>
        </Pressable>
        <Text className="text-xs text-muted-foreground mt-2">
          Called first during SOS &ldquo;Call My Person&rdquo;
        </Text>
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

      <Section title="Quit helpline">
        {RESOURCE_CARDS.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => Linking.openURL(telUrl(r.phone)).catch(() => {})}
            className="flex-row items-center justify-between rounded-2xl bg-card border border-border px-4 py-3.5 mb-2 active:opacity-[0.97]"
          >
            <View className="flex-1 pr-3">
              <Text className="text-sm font-sans-medium text-foreground">{r.organisation}</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">{r.phoneDisplay}</Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Phone size={14} color="#7FC200" strokeWidth={2.5} />
              <Text className="text-primary text-xs font-sans-semibold">Call</Text>
            </View>
          </Pressable>
        ))}
      </Section>
    </EditScreen>
  )
}
