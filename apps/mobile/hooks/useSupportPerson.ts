import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  clearSupportPerson,
  getSupportPerson,
  setSupportPerson,
  type SupportPerson,
} from '../lib/givingUp'

const KEY = ['support_person'] as const

/**
 * The single support contact (GU Spec §B1 / T-F). Read from SecureStore —
 * device-only, never on the server. `configured` is derived: name AND phone
 * both present. Shared by GU-5/6, the SOS escalation tools, and (Step 20)
 * Settings PROF-09.
 */
export function useSupportPerson() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: KEY,
    queryFn: getSupportPerson,
    staleTime: Infinity, // only our own save/remove mutates it
  })

  return {
    person: query.data ?? null,
    configured: !!query.data,
    isLoading: query.isLoading,
    save: async (person: SupportPerson) => {
      await setSupportPerson(person.name, person.phone)
      qc.invalidateQueries({ queryKey: KEY })
    },
    remove: async () => {
      await clearSupportPerson()
      qc.invalidateQueries({ queryKey: KEY })
    },
  }
}
