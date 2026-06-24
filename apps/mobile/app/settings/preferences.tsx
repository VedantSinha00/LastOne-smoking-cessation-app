import React, { useState, useEffect } from 'react'
import { View, Text, TextInput } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useProfile } from '../../hooks/useProfile'
import { useSettings } from '../../hooks/useSettings'
import { EditScreen } from '../../components/settings/EditScreen'
import { Pills } from '../../components/settings/Pills'
import { Toggle } from '../../components/settings/Toggle'
import { Button } from '../../components/ui/button'
import { VOICE_OPTIONS, CATEGORY_OPTIONS } from '../../lib/settings'
import type { VoiceStyle, RelatableCategory } from '../../types/database'

/** Section label matching the design's SectionLabel exactly: 10px, 0.18em
 *  tracking, 24px above / 12px below (mt-6 / mb-3). `first` drops the top
 *  margin for the leading section. */
const Label: React.FC<{ children: React.ReactNode; first?: boolean }> = ({ children, first }) => (
  <Text
    className={`text-muted-foreground text-[10px] font-sans-semibold uppercase tracking-[0.18em] mb-3 ${
      first ? '' : 'mt-6'
    }`}
  >
    {children}
  </Text>
)

const ToggleRow: React.FC<{
  label: string
  value: boolean
  onChange: (v: boolean) => void
}> = ({ label, value, onChange }) => (
  <View className="flex-row items-center justify-between rounded-2xl bg-card border border-border px-4 py-3.5 mb-2">
    <Text className="text-sm text-foreground font-sans-medium">{label}</Text>
    <Toggle on={value} onChange={onChange} />
  </View>
)

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

  // Display states persisted in AsyncStorage
  const [showSavings, setShowSavings] = useState(true)
  const [showStreak, setShowStreak] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem('show_savings_equivalent').then((val) => {
      if (val !== null) setShowSavings(val === 'true')
    })
    AsyncStorage.getItem('show_streak_home').then((val) => {
      if (val !== null) setShowStreak(val === 'true')
    })
  }, [])

  const toggleSavings = (val: boolean) => {
    setShowSavings(val)
    AsyncStorage.setItem('show_savings_equivalent', String(val)).catch(() => {})
  }

  const toggleStreak = (val: boolean) => {
    setShowStreak(val)
    AsyncStorage.setItem('show_streak_home', String(val)).catch(() => {})
  }

  // Display name — prefill from display_name, falling back to onboarding
  // first_name (the name we actually collected). Saves on the Save button.
  const [name, setName] = useState('')
  const [hasPrefilled, setHasPrefilled] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const savedName = profile?.display_name?.trim() || profile?.first_name?.trim() || ''
  const nameDirty = name.trim() !== savedName && hasPrefilled

  useEffect(() => {
    if (savedName && !hasPrefilled) {
      setName(savedName)
      setHasPrefilled(true)
    }
  }, [savedName, hasPrefilled])

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
    <EditScreen title="Preferences" showSos showNav>
      <View>
        <Label first>Voice style</Label>
        <Pills options={VOICE_OPTIONS} value={voice} onChange={pickVoice} />
        <Text className="text-muted-foreground text-xs mt-2">How LastOne talks to you</Text>
        {voiceExample && (
          <Text className="text-foreground text-sm italic mt-1.5 leading-relaxed">
            &ldquo;{voiceExample}&rdquo;
          </Text>
        )}

        <Label>Spending category</Label>
        <Pills options={CATEGORY_OPTIONS} value={category} onChange={pickCategory} />
        {categoryDesc && (
          <Text className="text-muted-foreground text-xs mt-2">{categoryDesc}</Text>
        )}

        <Label>Display</Label>
        <ToggleRow label="Show savings in equivalent" value={showSavings} onChange={toggleSavings} />
        <ToggleRow label="Show streak on home" value={showStreak} onChange={toggleStreak} />

        <Label>Name</Label>
        <TextInput
          value={name}
          onChangeText={(t) => {
            setName(t)
            setNameError(null)
          }}
          maxLength={30}
          placeholder="Your name"
          placeholderTextColor="#A8A29E"
          className="bg-card border border-border rounded-2xl px-4 py-3 text-foreground text-sm font-sans-medium"
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
