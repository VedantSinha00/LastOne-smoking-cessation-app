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
      <Text className="text-foreground font-display text-[28px] leading-tight">{title}</Text>
      {subtitle ? <Text className="text-muted-foreground text-sm mt-2 leading-relaxed">{subtitle}</Text> : null}
    </View>
  )
}

// ── Eyebrow + progress (design's question-screen chrome) ─────────────────────

// Pill chip above question titles, e.g. "GETTING TO KNOW YOU  1 OF 3".
export function OBEyebrow({ label }: { label: string }) {
  return (
    <View className="self-start rounded-full border border-border px-3 py-1">
      <Text className="text-muted-foreground text-[10px] uppercase" style={{ letterSpacing: 1.8 }}>
        {label}
      </Text>
    </View>
  )
}

// Thin 2px progress bar (value 0..1).
export function OBProgress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <View className="mt-3 h-[2px] w-full rounded bg-border overflow-hidden">
      <View className="h-full rounded bg-foreground" style={{ width: `${pct}%` }} />
    </View>
  )
}

// ── Primary CTA ──────────────────────────────────────────────────────────────

// Design's outline pill: transparent fill, thin foreground border, dark fill on
// press (active:bg-foreground inverts the label). Disabled = 40% opacity.
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
      className={`py-4 rounded-2xl items-center justify-center border border-foreground/80 ${
        inactive ? '' : 'active:bg-foreground'
      }`}
      style={disabled ? { opacity: 0.4 } : undefined}
    >
      {loading ? (
        <ActivityIndicator color="#0D140B" />
      ) : (
        <Text className="font-display text-base text-foreground">{title}</Text>
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
      className={`px-5 py-4 rounded-2xl mb-3 border ${
        selected ? 'border-foreground bg-secondary' : 'border-border active:border-foreground/40'
      }`}
    >
      <Text className={`text-[15px] ${selected ? 'text-foreground font-sans-medium' : 'text-foreground'}`}>{label}</Text>
    </Pressable>
  )
}

export type Choice<T extends string> = { value: T; label: string }

/** Single-select question screen — pick one, then Continue (Spec: button inactive until a selection). */
export function SingleChoiceScreen<T extends string>({
  onBack,
  eyebrow,
  progress,
  title,
  subtitle,
  options,
  value,
  onSelect,
  onContinue,
}: {
  onBack?: () => void
  eyebrow?: string
  progress?: number
  title: string
  subtitle?: string
  options: Choice<T>[]
  value: T | null
  onSelect: (v: T) => void
  onContinue: () => void
}) {
  return (
    <OBScreen onBack={onBack} footer={<OBContinue disabled={value == null} onPress={onContinue} />}>
      {eyebrow ? <OBEyebrow label={eyebrow} /> : null}
      {progress != null ? <OBProgress value={progress} /> : null}
      <View className={eyebrow || progress != null ? 'mt-6' : ''}>
        <OBHeader title={title} subtitle={subtitle} />
      </View>
      {options.map((o) => (
        <OptionRow key={o.value} label={o.label} selected={value === o.value} onPress={() => onSelect(o.value)} />
      ))}
    </OBScreen>
  )
}

/** Multi-select question screen — pick one or more (Spec: button inactive until ≥1 selected). */
export function MultiChoiceScreen<T extends string>({
  onBack,
  eyebrow,
  progress,
  title,
  subtitle,
  options,
  values,
  onToggle,
  onContinue,
}: {
  onBack?: () => void
  eyebrow?: string
  progress?: number
  title: string
  subtitle?: string
  options: Choice<T>[]
  values: T[]
  onToggle: (v: T) => void
  onContinue: () => void
}) {
  return (
    <OBScreen onBack={onBack} footer={<OBContinue disabled={values.length === 0} onPress={onContinue} />}>
      {eyebrow ? <OBEyebrow label={eyebrow} /> : null}
      {progress != null ? <OBProgress value={progress} /> : null}
      <View className={eyebrow || progress != null ? 'mt-6' : ''}>
        <OBHeader title={title} subtitle={subtitle} />
      </View>
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
