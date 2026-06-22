import React from 'react'
import { View, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useInsights } from '../../hooks/useInsights'
import { useDeleteNote } from '../../hooks/useDeleteNote'
import { JournalView } from '../../components/insights/JournalView'
import { TopBar } from '../../components/home/TopBar'

/**
 * Settings → Your Journey → View all notes. A dedicated route for the Journal so
 * it lives in the Profile stack: pushed from JourneySettings, it pops cleanly
 * back to Your Journey (the old deep-link into the Insights *tab* stranded the
 * user on Insights on back). Reuses the exact same JournalView component + data
 * the Insights tab uses, so the two stay in sync.
 *
 * Layout: the pinned LastOne TopBar on top (profile flow), then JournalView —
 * which renders its own "Journal ←" ScreenHeader. ScreenHeader adds its own
 * status-bar inset, so we pull JournalView up by exactly one inset to avoid a
 * double gap under the notch.
 */
export default function JournalScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { logs } = useInsights()
  const deleteNote = useDeleteNote()

  return (
    <View className="flex-1 bg-background">
      <TopBar inProfile />
      <View className="flex-1" style={{ marginTop: -insets.top }}>
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
    </View>
  )
}
