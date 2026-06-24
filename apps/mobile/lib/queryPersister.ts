import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'

/**
 * Disk persistence for the React Query cache (AsyncStorage). On a cold app start
 * the last session's data (e.g. the Home "For You Today" carousel, dashboard,
 * insights) is restored instantly from disk, so screens render immediately and
 * revalidate in the background instead of blocking on the network every launch.
 *
 * AsyncStorage is already a native dep in the build, so this needs no rebuild —
 * the persist packages themselves are pure JS.
 */
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'lastone-rq-cache',
  // Coalesce rapid cache writes so persistence never thrashes the JS thread.
  throttleTime: 1000,
})

/** Wipe the persisted cache from disk. Call on sign-out alongside
 *  queryClient.clear() so the next user/launch never rehydrates the prior
 *  user's data. */
export function clearPersistedQueryCache() {
  return persister.removeClient()
}

// Bump when the cache shape changes incompatibly (query keys / stored types) to
// drop stale persisted data instead of rehydrating something the app can't read.
// v2: sosData no longer stores a Map (was crashing on rehydration).
const BUSTER = 'v2'

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  // Discard anything older than 24h on restore — stale enough that we'd rather
  // refetch than show yesterday's numbers as if current.
  maxAge: 24 * 60 * 60 * 1000,
  buster: BUSTER,
  dehydrateOptions: {
    // Only persist successful queries; never cache errors/loading states, and
    // skip anything explicitly opted out via meta.persist === false.
    shouldDehydrateQuery: (query) =>
      query.state.status === 'success' && query.meta?.persist !== false,
  },
}
