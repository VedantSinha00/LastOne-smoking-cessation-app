import React from 'react'
import { View, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useInsights } from '../../hooks/useInsights'
import { useDeleteNote } from '../../hooks/useDeleteNote'
import { JournalView } from '../../components/insights/JournalView'

/**
 * Settings → Your Journey → View all notes. A dedicated route for the Journal so
 * it lives in the Profile stack: pushed from JourneySettings, it pops cleanly
 * back to Your Journey (the old deep-link into the Insights *tab* stranded the
 * user on Insights on back). Reuses the exact same JournalView component + data
 * the Insights tab uses, so the two stay in sync.
 *
 * JournalView renders its own "← Journal" ScreenHeader (back arrow + title +
 * safe-area inset), so we DON'T also render the LastOne TopBar here — stacking
 * both produced a redundant second bar / empty gap above the title. This makes
 * the page look identical to opening Journal from Insights; the back arrow
 * returns to Your Journey.
 */
export default function JournalScreen() {
  const router = useRouter()
  const { logs } = useInsights()
  const deleteNote = useDeleteNote()

  return (
    <View className="flex-1 bg-background">
      <JournalView
        logs={logs}
        onBack={() => router.back()}
        onAddNote={() =>
          router.push({ pathname: '/(modals)/log-d', params: { from: 'settings-journal' } })
        }
        onDelete={(logId) =>
          deleteNote.mutate(logId, {
            onError: (e: any) =>
              Alert.alert("Couldn't delete", e?.message ?? 'Please try again.'),
          })
        }
      />
    </View>
  )
}
