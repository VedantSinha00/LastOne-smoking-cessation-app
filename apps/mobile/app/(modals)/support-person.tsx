import React, { useState } from 'react'
import { View, Text, Pressable, TextInput, ScrollView, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useSupportPerson } from '../../hooks/useSupportPerson'
import {
  briefingMessage,
  guVoice,
  GU_COPY,
  normalizePhone,
  setBriefingSent,
  smsUrl,
  whatsappUrl,
} from '../../lib/givingUp'
import { Button } from '../../components/ui/button'

/**
 * GU-9/GU-10 — Support person setup + briefing message preview.
 *
 * V1 deviation (deliberate): the spec's device contact picker needs
 * expo-contacts — a native module NOT in the current dev build — so V1 uses
 * manual name + phone entry. Picker can land at Step 21 when a new build
 * happens anyway. Contact is stored in SecureStore ONLY (T-F / F-1); the
 * briefing-sent flag is device-side (no server column exists).
 */
export default function SupportPersonSetup() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { person, save, remove } = useSupportPerson()
  const voice = guVoice(profile?.voice_style ?? null)

  const [step, setStep] = useState<'contact' | 'brief'>('contact')
  const [name, setName] = useState(person?.name ?? '')
  const [phone, setPhone] = useState(person?.phone ?? '')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState(false)

  const continueToBrief = () => {
    const normalized = normalizePhone(phone)
    if (!name.trim()) {
      setPhoneError('Add a name to continue.')
      return
    }
    if (!normalized) {
      setPhoneError('Enter a valid phone number (10 digits, or with country code).')
      return
    }
    setPhone(normalized)
    setMessage(briefingMessage(name.trim()))
    setStep('brief')
  }

  /** Contact is saved on every exit from GU-10 — sending the briefing is optional. */
  const saveContact = async () => {
    await save({ name: name.trim(), phone })
  }

  const sendVia = async (channel: 'whatsapp' | 'sms') => {
    await saveContact()
    if (user) setBriefingSent(user.id)
    try {
      await Linking.openURL(
        channel === 'whatsapp' ? whatsappUrl(phone, message) : smsUrl(phone, message),
      )
    } catch {
      // Channel unavailable (e.g. no WhatsApp) — contact is saved either way.
    }
    router.back()
  }

  const skipSending = async () => {
    await saveContact()
    router.back()
  }

  if (step === 'contact') {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="p-6 gap-4"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-3 mb-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-foreground text-2xl">←</Text>
          </Pressable>
          <Text className="text-foreground font-display text-2xl">Who&apos;s in your corner?</Text>
        </View>
        <Text className="text-muted-foreground text-sm leading-relaxed">
          {GU_COPY.setupBody[voice]}
        </Text>

        <View>
          <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
            Their name
          </Text>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t)
              setPhoneError(null)
            }}
            placeholder="e.g. Aman"
            placeholderTextColor="#A8A29E"
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
          />
        </View>

        <View>
          <Text className="text-muted-foreground text-xs font-sans-bold uppercase tracking-wider mb-2">
            Their phone number
          </Text>
          <TextInput
            value={phone}
            onChangeText={(t) => {
              setPhone(t)
              setPhoneError(null)
            }}
            placeholder="98765 43210"
            placeholderTextColor="#A8A29E"
            keyboardType="phone-pad"
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
          />
          <Text className="text-muted-foreground text-[11px] mt-1">
            Stays on your phone only — never uploaded.
          </Text>
        </View>

        {phoneError && <Text className="text-craving text-sm">{phoneError}</Text>}

        <Button title="Continue" onPress={continueToBrief} />
        <Pressable onPress={() => router.back()} className="self-center mt-1" hitSlop={8}>
          <Text className="text-muted-foreground text-sm">Skip for now</Text>
        </Pressable>

        {person && (
          <Pressable
            onPress={async () => {
              await remove()
              router.back()
            }}
            className="self-center mt-4"
            hitSlop={8}
          >
            <Text className="text-craving text-sm">Remove current support person</Text>
          </Pressable>
        )}
      </ScrollView>
    )
  }

  // ── GU-10 — Briefing message preview ─────────────────────────────────────────
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center gap-3 mb-2">
        <Pressable onPress={() => setStep('contact')} hitSlop={12}>
          <Text className="text-foreground text-2xl">←</Text>
        </Pressable>
        <Text className="text-foreground font-display text-xl flex-1">
          Here&apos;s a message for {name.trim()}
        </Text>
      </View>
      <Text className="text-muted-foreground text-sm">Edit it if you like, then send.</Text>

      {editing ? (
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          textAlignVertical="top"
          className="bg-card border border-primary/40 rounded-2xl px-4 py-3 text-foreground text-sm leading-relaxed min-h-[220px]"
        />
      ) : (
        <View className="bg-card border border-border rounded-2xl px-4 py-4">
          <Text className="text-foreground text-sm leading-relaxed">{message}</Text>
        </View>
      )}

      <View className="gap-3 mt-2">
        {editing ? (
          <Button title="Save & Send via WhatsApp" onPress={() => sendVia('whatsapp')} />
        ) : (
          <>
            <Button title="Send via WhatsApp" onPress={() => sendVia('whatsapp')} />
            <Button title="Send via SMS" variant="secondary" onPress={() => sendVia('sms')} />
            <Button title="Edit" variant="secondary" onPress={() => setEditing(true)} />
          </>
        )}
        <Pressable onPress={skipSending} className="self-center mt-1" hitSlop={8}>
          <Text className="text-muted-foreground text-sm">Skip sending — just save the contact</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
