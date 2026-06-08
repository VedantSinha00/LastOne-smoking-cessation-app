import type { Choice } from './parts'
import type {
  AgeRange,
  CravingIntensity,
  Intent,
  LifeStage,
  Motivation,
  QuitHistory,
  QuitStruggle,
  SmokingReason,
  TimeToFirstCigarette,
  TriggerTime,
} from '../../types/database'

// Enum → display label. Enum values are fixed by Onboarding Spec §B1; the
// display copy below is V1 build copy. Craving + first-cigarette labels are
// verbatim from §B2.1.

export const AGE_OPTIONS: Choice<AgeRange>[] = [
  { value: 'under_16', label: 'Under 16' },
  { value: '16_18', label: '16–18' },
  { value: '18_22', label: '18–22' },
  { value: '22_26', label: '22–26' },
  { value: '26_plus', label: '26+' },
]

export const LIFE_STAGE_OPTIONS: Choice<LifeStage>[] = [
  { value: 'college_student', label: 'College student' },
  { value: 'final_year', label: 'Final year' },
  { value: 'fresh_graduate', label: 'Fresh graduate' },
  { value: 'working', label: 'Working' },
]

export const INTENT_OPTIONS: Choice<Intent>[] = [
  { value: 'quit', label: "I want to quit" },
  { value: 'figuring_out', label: "I'm still figuring it out" },
]

export const SMOKING_REASON_OPTIONS: Choice<SmokingReason>[] = [
  { value: 'stress', label: 'Stress' },
  { value: 'boredom', label: 'Boredom' },
  { value: 'social', label: 'Social' },
  { value: 'habit', label: 'Just habit' },
  { value: 'focus', label: 'To focus' },
  { value: 'post_meal', label: 'After meals' },
]

export const TRIGGER_TIME_OPTIONS: Choice<TriggerTime>[] = [
  { value: 'morning', label: 'First thing in the morning' },
  { value: 'post_meal', label: 'After a meal' },
  { value: 'break', label: 'On a break' },
  { value: 'study_work', label: 'While studying or working' },
  { value: 'friends', label: 'With friends' },
  { value: 'stress', label: 'When stressed' },
  { value: 'boredom', label: 'When bored' },
  { value: 'late_night', label: 'Late at night' },
]

export const FIRST_CIGARETTE_OPTIONS: Choice<TimeToFirstCigarette>[] = [
  { value: 'within_5', label: 'Within 5 minutes' },
  { value: 'within_30', label: 'Within 30 minutes' },
  { value: 'within_60', label: 'Within an hour' },
  { value: 'later', label: 'Later in the day' },
  { value: 'not_daily', label: "I don't smoke every day" },
]

export const CRAVING_OPTIONS: Choice<CravingIntensity>[] = [
  { value: 'low', label: 'Barely noticeable' },
  { value: 'medium', label: 'Uncomfortable, but I push through' },
  { value: 'high', label: 'Strong, hard to focus on anything else' },
  { value: 'overwhelming', label: 'I almost always end up giving in' },
]

export const QUIT_HISTORY_OPTIONS: Choice<QuitHistory>[] = [
  { value: 'never', label: 'Never, this is my first time' },
  { value: 'one_two', label: 'Once or twice' },
  { value: 'three_five', label: 'Three to five times' },
  { value: 'five_plus', label: 'More than five times' },
  { value: 'lost_count', label: "I've lost count" },
]

export const QUIT_STRUGGLE_OPTIONS: Choice<QuitStruggle>[] = [
  { value: 'social', label: 'Social situations' },
  { value: 'stress', label: 'Stress got to me' },
  { value: 'withdrawal', label: 'Withdrawal was rough' },
  { value: 'weak_moments', label: 'Weak moments' },
  { value: 'no_plan', label: "I didn't really have a plan" },
]

export const MOTIVATION_OPTIONS: Choice<Motivation>[] = [
  { value: 'health', label: 'My health' },
  { value: 'money', label: 'The money' },
  { value: 'others', label: 'Someone who matters to me' },
  { value: 'independence', label: 'Taking back control' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'wake_up_call', label: 'A wake-up call' },
  { value: 'no_reason', label: 'No single reason' },
]

// relatable_category — canonical enum (Data Schema §1 / profiles.relatable_category).
// These exact values are required; the column is a DB enum. Default 'food_delivery'.
export const RELATABLE_CATEGORY_OPTIONS: Choice<string>[] = [
  { value: 'food_delivery', label: 'Food delivery' },
  { value: 'movies_ott', label: 'Movies & OTT' },
  { value: 'music_podcasts', label: 'Music & podcasts' },
  { value: 'travel', label: 'Travel' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'clothes_shopping', label: 'Clothes & shopping' },
]

// OB-22 commitment chip sets.
export const COMMITMENT_REASON_CHIPS = [
  'my health',
  'the money I waste',
  'someone I love',
  'proving I can',
  'how it makes me feel',
]

export const COMMITMENT_IDENTITY_CHIPS = [
  'someone who follows through',
  'a non-smoker',
  'in control of this',
  'stronger than the craving',
  'done making excuses',
]
