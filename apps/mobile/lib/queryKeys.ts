export const queryKeys = {
  profile:        (userId: string) => ['profile', userId] as const,
  // Narrow onboarding-gate check used by the root layout. Kept on a SEPARATE key so
  // its slim select('onboarding_complete') never clobbers the full profile cache
  // (which useProfile/useDashboard read) under a shared key.
  onboardingGate: (userId: string) => ['profile', userId, 'onboarding_gate'] as const,
  currentAttempt: (userId: string) => ['quit_attempt', 'current', userId] as const,
  allAttempts:    (userId: string) => ['quit_attempt', 'all', userId] as const,
  streakRecord:   (userId: string) => ['streak_record', userId] as const,
  slipState:      (userId: string) => ['slip_state', userId] as const,
  logs:           (userId: string, attemptId: number) => ['logs', userId, attemptId] as const,
  logsByType:     (userId: string, type: string) => ['logs', userId, 'type', type] as const,
  toolScores:     (userId: string) => ['tool_scores', userId] as const,
  copingTools:    () => ['coping_tools'] as const,
  sosState:       (userId: string) => ['sos_state', userId] as const,
  insights:       (userId: string, attemptId: number) => ['insights', userId, attemptId] as const,
  contentCards:   () => ['content_cards'] as const,
  cardHistory:    (userId: string) => ['card_history', userId] as const,
  goals:          (userId: string) => ['goals', userId] as const,
  topUpLog:       (goalId: string) => ['top_up_log', goalId] as const,
  causesLog:      (userId: string) => ['causes_card_log', userId] as const,
  notifState:     (userId: string) => ['notification_state', userId] as const,
  cpdLog:         (userId: string) => ['cpd_log', userId] as const,
  priceLog:       (userId: string) => ['price_log', userId] as const,
  gameStreak:     (userId: string) => ['game_streak', userId] as const,
  streakNudge:    (userId: string) => ['streak_nudge_log', userId] as const,
}
