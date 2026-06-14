import React, { useState } from 'react'
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { parseProductUrl } from '../../lib/parseProductUrl'
import { Button } from '../../components/ui/button'

/**
 * GOAL-03 — Add Goal: URL input. Parse on submit via the parse-product-url
 * Edge Function. Full/partial parse → GOAL-04 (price blank when partial);
 * failure/unsupported/offline → inline message with the manual-entry path
 * (§5.1). Back clears the input and saves nothing.
 */
export default function AddGoalUrl() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!url.trim() || parsing) return
    setParsing(true)
    setError(null)
    const result = await parseProductUrl(url.trim())
    setParsing(false)

    if (result.status === 'full' || result.status === 'partial') {
      router.push({
        pathname: '/goals/add-confirm',
        params: {
          name: result.name ?? '',
          image: result.imageUrl ?? '',
          price: result.price != null ? String(result.price) : '',
          url: url.trim(),
        },
      })
      return
    }
    setError(
      result.status === 'offline'
        ? 'No connection. Enter details manually.'
        : "We couldn't read this link. Please fill in the details manually.",
    )
  }

  return (
    <View className="flex-1 bg-background p-6 gap-4">
      <View className="flex-row items-center gap-3 mb-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-foreground text-2xl">←</Text>
        </Pressable>
        <Text className="text-foreground font-display text-2xl">Paste a link</Text>
      </View>

      <TextInput
        value={url}
        onChangeText={(t) => {
          setUrl(t)
          setError(null)
        }}
        placeholder="https://…"
        placeholderTextColor="#A8A29E"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
      />
      <Text className="text-muted-foreground text-xs leading-relaxed">
        Works with Amazon, Flipkart, Myntra, Blinkit, Nykaa, and Swiggy Instamart.
      </Text>

      {error && (
        <View className="gap-3">
          <Text className="text-craving text-sm">{error}</Text>
          {/* replace, not push: GOAL-05's back goes to GOAL-02 (flow-reverse, §5.1),
              never back to this dead URL screen. */}
          <Button
            title="Enter details manually"
            variant="secondary"
            onPress={() => router.replace('/goals/add-manual')}
          />
        </View>
      )}

      {parsing ? (
        <View className="flex-row items-center gap-2 py-3">
          <ActivityIndicator color="#7FC200" />
          <Text className="text-muted-foreground text-sm">Reading the link…</Text>
        </View>
      ) : (
        <Button title="Continue" onPress={submit} disabled={!url.trim()} />
      )}
    </View>
  )
}
