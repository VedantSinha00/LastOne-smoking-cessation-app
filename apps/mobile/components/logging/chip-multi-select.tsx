import React, { useState } from 'react'
import { View, Text, Pressable, TextInput } from 'react-native'
import type { ChipOption } from '../../lib/logOptions'

interface ChipMultiSelectProps {
  label: string
  options: ChipOption[]
  selected: string[]
  onChange: (next: string[]) => void
  /** Whether to show the 'Other' chip → inline free text (max 60). */
  allowOther?: boolean
  otherText?: string
  onOtherTextChange?: (text: string) => void
}

const OTHER = '__other__'

/**
 * Multi-select chip row with an optional 'Other' chip that reveals an inline
 * free-text field (max 60 chars → stored in log.other_text). Logging Spec §A2.
 */
export const ChipMultiSelect: React.FC<ChipMultiSelectProps> = ({
  label,
  options,
  selected,
  onChange,
  allowOther = true,
  otherText = '',
  onOtherTextChange,
}) => {
  const [otherOpen, setOtherOpen] = useState(false)

  const toggle = (value: string) => {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    )
  }

  const renderChip = (value: string, text: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={value}
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${
        active ? 'bg-primary border-primary' : 'bg-card border-border'
      } active:opacity-80`}
    >
      <Text className={`text-sm ${active ? 'text-primary-foreground font-sans-bold' : 'text-muted-foreground'}`}>
        {text}
      </Text>
    </Pressable>
  )

  return (
    <View className="my-2">
      <Text className="text-muted-foreground text-sm font-sans-medium mb-3">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => renderChip(o.value, o.label, selected.includes(o.value), () => toggle(o.value)))}
        {allowOther && renderChip(OTHER, 'Other', otherOpen, () => setOtherOpen((v) => !v))}
      </View>
      {allowOther && otherOpen && (
        <TextInput
          className="bg-input text-foreground px-4 py-3 rounded-xl border border-border mt-3"
          placeholder="Tell us more (optional)"
          placeholderTextColor="#76706C"
          maxLength={60}
          value={otherText}
          onChangeText={onOtherTextChange}
        />
      )}
    </View>
  )
}
