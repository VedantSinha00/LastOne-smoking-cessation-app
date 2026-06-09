/**
 * Canonical chip tokens for the logging flows (Logging Spec §A2/§B2 + Onboarding
 * enums). Stored values are the snake_case tokens; labels are display-only.
 */

export interface ChipOption {
  value: string
  label: string
}

/** 10 canonical trigger tokens (Architecture Guide §9.4). */
export const TRIGGER_TOKENS: ChipOption[] = [
  { value: 'stress', label: 'Stress' },
  { value: 'boredom', label: 'Boredom' },
  { value: 'social', label: 'Social' },
  { value: 'after_meal', label: 'After a meal' },
  { value: 'morning', label: 'Morning routine' },
  { value: 'alcohol', label: 'Drinking' },
  { value: 'study_work', label: 'Study / work' },
  { value: 'anxiety', label: 'Anxiety' },
  { value: 'celebration', label: 'Celebrating' },
  { value: 'craving', label: 'Just a craving' },
]

export const LOCATION_TOKENS: ChipOption[] = [
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work / college' },
  { value: 'outside', label: 'Outside' },
  { value: 'tapri', label: 'Tapri / cafe' },
  { value: 'car', label: 'Car / commute' },
  { value: 'party', label: 'Party / bar' },
]

export const SOCIAL_TOKENS: ChipOption[] = [
  { value: 'alone', label: 'Alone' },
  { value: 'friends', label: 'With friends' },
  { value: 'family', label: 'With family' },
  { value: 'colleagues', label: 'With colleagues' },
  { value: 'strangers', label: 'Around strangers' },
]

/** "What helped" tokens for Flow B / SOS-3 (Logging Spec §3, §6). */
export const WHAT_HELPED_TOKENS: ChipOption[] = [
  { value: 'waited', label: 'Waited it out' },
  { value: 'breathing', label: 'Breathing' },
  { value: 'water', label: 'Drank water' },
  { value: 'walk', label: 'Went for a walk' },
  { value: 'distraction', label: 'Distracted myself' },
  { value: 'talked', label: 'Talked to someone' },
  { value: 'reminded_why', label: 'Remembered why' },
]

/** Sentinel for '5+' cigarettes (Logging Spec §3 / Data Schema §3). Never shown. */
export const CIGARETTE_COUNT_SENTINEL = 99

/** Map a stored cigarette_count to its display string (99 → '5+'). */
export function displayCigaretteCount(count: number | null | undefined): string | null {
  if (count == null) return null
  if (count >= CIGARETTE_COUNT_SENTINEL || count >= 5) return '5+'
  return String(count)
}
