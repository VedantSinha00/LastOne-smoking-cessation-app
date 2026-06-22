import React, { useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { useProfile } from '../../hooks/useProfile'
import { useSettings } from '../../hooks/useSettings'
import { EditScreen } from '../../components/settings/EditScreen'
import { Pills } from '../../components/settings/Pills'
import { Button } from '../../components/ui/button'
import { VOICE_OPTIONS, CATEGORY_OPTIONS } from '../../lib/settings'
import type { VoiceStyle, RelatableCategory } from '../../types/database'

/** Section label matching the design's spacing rhythm: 24px above, 12px below
 *  (mt-6 / mb-3). `first` drops the top margin for the leading section. */
const Label: React.FC<{ children: React.ReactNode; first?: boolean }> = ({ children, first }) => (
  <Text
    className={`text-muted-foreground text-[11px] font-sans-bold uppercase tracking-[0.18em] mb-3 ${
      first ? '' : 'mt-7'
    }`}
  >
    {children}
  </Text>
)

/**
 * Settings → Preferences (category sub-screen). Reworked to the design's inline
 * controls: voice + spending-category PILLS and a display-name TEXT INPUT live
 * directly on this page instead of pushing to leaf edit screens. App richness is
 * kept — below the pills we still show the selected option's example/description
 * (the leaf screens had these), and the name input keeps the same validation.
 * Voice / category autosave on tap (the selection IS the decision, §5 Flows 5–6).
 * Spacing follows the design's mt-6/mb-3 section rhythm so it doesn't read cramped.
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
      {/* One wrapper so EditScreen's gap-4 applies once; the section rhythm below
          is driven entirely by our own mt-7/mb-3 margins (matches the design). */}
      <View>
        <Label first>Voice style</Label>
        <Pills options={VOICE_OPTIONS} value={voice} onChange={pickVoice} />
        <Text className="text-muted-foreground text-xs mt-3">How LastOne talks to you</Text>
        {voiceExample && (
          <Text className="text-foreground text-sm italic mt-2 leading-relaxed">
            &ldquo;{voiceExample}&rdquo;
          </Text>
        )}

        <Label>Spending category</Label>
        <Pills options={CATEGORY_OPTIONS} value={category} onChange={pickCategory} />
        {categoryDesc && (
          <Text className="text-muted-foreground text-xs mt-3">{categoryDesc}</Text>
        )}

        <Label>Display name</Label>
        <TextInput
          value={name}
          onChangeText={(t) => {
            setName(t)
            setNameError(null)
          }}
          maxLength={30}
          placeholder="Your name"
          placeholderTextColor="#A8A29E"
          className="bg-card border border-border rounded-2xl px-4 py-3.5 text-foreground text-base"
        />
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-muted-foreground text-xs">{name.length}/30</Text>
          {nameError && <Text className="text-craving text-xs">{nameError}</Text>}
        </View>
        {nameDirty && (
          <View className="mt-4">
            <Button title="Save name" onPress={saveName} loading={updateProfile.isPending} />
          </View>
        )}
      </View>
    </EditScreen>
  )
}
