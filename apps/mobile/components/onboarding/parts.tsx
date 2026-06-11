import React from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// ── Layout shell ─────────────────────────────────────────────────────────────

export function OBScreen({
  onBack,
  footer,
  scroll = true,
  children,
}: {
  onBack?: () => void
  footer?: React.ReactNode
  scroll?: boolean
  children: React.ReactNode
}) {
  const Body: any = scroll ? ScrollView : View
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="h-11 justify-center px-4">
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={16} className="w-10">
            <Text className="text-muted-foreground text-3xl leading-7">‹</Text>
          </Pressable>
        ) : null}
      </View>
      <Body
        className="flex-1 px-6"
        {...(scroll ? { contentContainerStyle: { paddingBottom: 24 }, keyboardShouldPersistTaps: 'handled' } : {})}
      >
        {children}
      </Body>
      {footer ? <View className="px-6 pt-2 pb-2">{footer}</View> : null}
    </SafeAreaView>
  )
}

export function OBHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-7 mt-2">
      <Text className="text-foreground font-display text-2xl leading-8">{title}</Text>
      {subtitle ? <Text className="text-muted-foreground text-base mt-3 leading-relaxed">{subtitle}</Text> : null}
    </View>
  )
}

// ── Primary CTA ──────────────────────────────────────────────────────────────

export function OBContinue({
  onPress,
  disabled = false,
  loading = false,
  title = 'Continue',
}: {
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  title?: string
}) {
  const inactive = disabled || loading
  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      className={`py-4 rounded-2xl items-center justify-center ${
        disabled ? 'bg-muted' : 'bg-primary active:opacity-90'
      }`}
      style={disabled ? { opacity: 0.5 } : undefined}
    >
      {loading ? (
        <ActivityIndicator color="#0D140B" />
      ) : (
        <Text className={`font-sans-bold text-base ${disabled ? 'text-muted-foreground' : 'text-primary-foreground'}`}>{title}</Text>
      )}
    </Pressable>
  )
}

export function OBTextLink({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} className="items-center py-3">
      <Text className="text-muted-foreground text-sm underline">{title}</Text>
    </Pressable>
  )
}

// ── Option rows ──────────────────────────────────────────────────────────────

export function OptionRow({
  label,
  selected,
  multi = false,
  onPress,
}: {
  label: string
  selected: boolean
  multi?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between px-5 py-4 rounded-2xl mb-3 border ${
        selected ? 'bg-primary/15 border-primary' : 'bg-card border-border active:bg-muted'
      }`}
    >
      <Text className={`text-base flex-1 ${selected ? 'text-foreground font-sans-medium' : 'text-foreground'}`}>{label}</Text>
      {selected ? <Text className="text-primary text-lg ml-3">{multi ? '✓' : '●'}</Text> : null}
    </Pressable>
  )
}

export type Choice<T extends string> = { value: T; label: string }

/** Single-select question screen — pick one, then Continue (Spec: button inactive until a selection). */
export function SingleChoiceScreen<T extends string>({
  onBack,
  title,
  subtitle,
  options,
  value,
  onSelect,
  onContinue,
}: {
  onBack?: () => void
  title: string
  subtitle?: string
  options: Choice<T>[]
  value: T | null
  onSelect: (v: T) => void
  onContinue: () => void
}) {
  return (
    <OBScreen onBack={onBack} footer={<OBContinue disabled={value == null} onPress={onContinue} />}>
      <OBHeader title={title} subtitle={subtitle} />
      {options.map((o) => (
        <OptionRow key={o.value} label={o.label} selected={value === o.value} onPress={() => onSelect(o.value)} />
      ))}
    </OBScreen>
  )
}

/** Multi-select question screen — pick one or more (Spec: button inactive until ≥1 selected). */
export function MultiChoiceScreen<T extends string>({
  onBack,
  title,
  subtitle,
  options,
  values,
  onToggle,
  onContinue,
}: {
  onBack?: () => void
  title: string
  subtitle?: string
  options: Choice<T>[]
  values: T[]
  onToggle: (v: T) => void
  onContinue: () => void
}) {
  return (
    <OBScreen onBack={onBack} footer={<OBContinue disabled={values.length === 0} onPress={onContinue} />}>
      <OBHeader title={title} subtitle={subtitle} />
      {options.map((o) => (
        <OptionRow
          key={o.value}
          label={o.label}
          multi
          selected={values.includes(o.value)}
          onPress={() => onToggle(o.value)}
        />
      ))}
    </OBScreen>
  )
}
