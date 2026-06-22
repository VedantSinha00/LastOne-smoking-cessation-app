import React, { useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { useProfile } from '../../hooks/useProfile'
import { useSettings } from '../../hooks/useSettings'
import { EditScreen } from '../../components/settings/EditScreen'
import { Pills } from '../../components/settings/Pills'
import { Button } from '../../components/ui/button'
import { Section } from '../../components/settings/Row'
import { VOICE_OPTIONS, CATEGORY_OPTIONS } from '../../lib/settings'
import type { VoiceStyle, RelatableCategory } from '../../types/database'

/**
 * Settings → Preferences (category sub-screen). Reworked to the design's inline
 * controls: voice + spending-category PILLS and a display-name TEXT INPUT live
 * directly on this page instead of pushing to leaf edit screens. App richness is
 * kept — below the pills we still show the selected option's example/description
 * (the leaf screens had these), and the name input keeps the same validation.
 * Voice / category autosave on tap (the selection IS the decision, §5 Flows 5–6).
 *
 * Skipped from the design (no real backing, logic-wins): the display toggles
 * (Show savings / Show streak / Dark mode) and "View onboarding answers".
 */
export default function PreferencesSettings() {
  const { data: profile } = useProfile()
  const { updateProfile } = useSettings()

  const voice = profile?.voice_style ?? null
  const category = profile?.relatable_category ?? null
  const voiceExample = VOICE_OPTIONS.find((o) => o.value === voice)?.example
  const categoryDesc = CATEGORY_OPTIONS.find((o) => o.value === category)?.description

  const pickVoice = (v: VoiceStyle) => {
    if (v !== voice) updateProfile.mutate({ voice_style: v })
  }
  const pickCategory = (v: RelatableCategory) => {
    if (v !== category) updateProfile.mutate({ relatable_category: v })
  }

  // Display name — prefill from display_name, falling back to onboarding
  // first_name (the name we actually collected). Saves on the Save button.
  const [name, setName] = useState(
    profile?.display_name?.trim() || profile?.first_name?.trim() || '',
  )
  const [nameError, setNameError] = useState<string | null>(null)
  const savedName = profile?.display_name?.trim() || profile?.first_name?.trim() || ''
  const nameDirty = name.trim() !== savedName

  const saveName = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Name cannot be empty.')
      return
    }
    updateProfile.mutate({ display_name: trimmed.slice(0, 30) })
    setNameError(null)
  }

  return (
    <EditScreen title="Preferences" showSos>
      <Section title="Voice style">
        <Pills options={VOICE_OPTIONS} value={voice} onChange={pickVoice} />
        <Text className="text-muted-foreground text-xs mt-2">How LastOne talks to you</Text>
        {voiceExample && (
          <Text className="text-foreground text-sm italic mt-2 leading-relaxed">
            &ldquo;{voiceExample}&rdquo;
          </Text>
        )}
      </Section>

      <Section title="Spending category">
        <Pills options={CATEGORY_OPTIONS} value={category} onChange={pickCategory} />
        {categoryDesc && (
          <Text className="text-muted-foreground text-xs mt-2">{categoryDesc}</Text>
        )}
      </Section>

      <Section title="Display name">
        <TextInput
          value={name}
          onChangeText={(t) => {
            setName(t)
            setNameError(null)
          }}
          maxLength={30}
          placeholder="Your name"
          placeholderTextColor="#A8A29E"
          className="bg-card border border-border rounded-2xl px-4 py-3 text-foreground text-base"
        />
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-muted-foreground text-xs">{name.length}/30</Text>
          {nameError && <Text className="text-craving text-xs">{nameError}</Text>}
        </View>
        {nameDirty && (
          <View className="mt-2">
            <Button title="Save name" onPress={saveName} loading={updateProfile.isPending} />
          </View>
        )}
      </Section>
    </EditScreen>
  )
}
