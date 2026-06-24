import React from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useProfile } from '../../hooks/useProfile'
import { EditScreen } from '../../components/settings/EditScreen'
import {
  AGE_OPTIONS,
  LIFE_STAGE_OPTIONS,
  INTENT_OPTIONS,
  SMOKING_REASON_OPTIONS,
  TRIGGER_TIME_OPTIONS,
  FIRST_CIGARETTE_OPTIONS,
  CRAVING_OPTIONS,
  QUIT_HISTORY_OPTIONS,
  QUIT_STRUGGLE_OPTIONS,
  MOTIVATION_OPTIONS,
} from '../../components/onboarding/options'

export default function OnboardingAnswersScreen() {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) {
    return (
      <EditScreen title="Onboarding Answers">
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator color="#7FC200" />
        </View>
      </EditScreen>
    )
  }

  // Helpers to resolve labels
  const getLabel = (value: any, options: { value: any; label: string }[]) => {
    return options.find((o) => o.value === value)?.label ?? String(value || 'Not set')
  }

  const getMultiLabel = (values: any[] | null | undefined, options: { value: any; label: string }[]) => {
    if (!values || values.length === 0) return 'Not set'
    return values.map((v) => options.find((o) => o.value === v)?.label ?? String(v)).join(', ')
  }

  return (
    <EditScreen title="Onboarding Answers">
      <View className="gap-5">
        <View>
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 font-sans-bold">Age Range</Text>
          <View className="bg-card border border-border rounded-2xl px-4 py-3.5 min-h-[56px] justify-center">
            <Text className="text-foreground text-base font-sans-medium">
              {getLabel(profile?.age_range, AGE_OPTIONS)}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 font-sans-bold">Life Stage</Text>
          <View className="bg-card border border-border rounded-2xl px-4 py-3.5 min-h-[56px] justify-center">
            <Text className="text-foreground text-base font-sans-medium">
              {getLabel(profile?.life_stage, LIFE_STAGE_OPTIONS)}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 font-sans-bold">Intent</Text>
          <View className="bg-card border border-border rounded-2xl px-4 py-3.5 min-h-[56px] justify-center">
            <Text className="text-foreground text-base font-sans-medium">
              {getLabel(profile?.intent, INTENT_OPTIONS)}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 font-sans-bold">Cigarettes Per Day</Text>
          <View className="bg-card border border-border rounded-2xl px-4 py-3.5 min-h-[56px] justify-center">
            <Text className="text-foreground text-base font-sans-medium">
              {profile?.cigarettes_per_day != null ? `${profile.cigarettes_per_day} cigarettes` : 'Not set'}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 font-sans-bold">Price Per Cigarette</Text>
          <View className="bg-card border border-border rounded-2xl px-4 py-3.5 min-h-[56px] justify-center">
            <Text className="text-foreground text-base font-sans-medium">
              {profile?.price_per_cigarette != null ? `₹${profile.price_per_cigarette}` : 'Not set'}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 font-sans-bold">Reasons for Smoking</Text>
          <View className="bg-card border border-border rounded-2xl px-4 py-3.5 min-h-[56px] justify-center">
            <Text className="text-foreground text-base font-sans-medium">
              {getMultiLabel(profile?.smoking_reasons, SMOKING_REASON_OPTIONS)}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 font-sans-bold">Typical Trigger Times</Text>
          <View className="bg-card border border-border rounded-2xl px-4 py-3.5 min-h-[56px] justify-center">
            <Text className="text-foreground text-base font-sans-medium">
              {getMultiLabel(profile?.trigger_times, TRIGGER_TIME_OPTIONS)}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 font-sans-bold">Time to First Cigarette</Text>
          <View className="bg-card border border-border rounded-2xl px-4 py-3.5 min-h-[56px] justify-center">
            <Text className="text-foreground text-base font-sans-medium">
              {getLabel(profile?.time_to_first_cigarette, FIRST_CIGARETTE_OPTIONS)}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 font-sans-bold">Typical Craving Intensity</Text>
          <View className="bg-card border border-border rounded-2xl px-4 py-3.5 min-h-[56px] justify-center">
            <Text className="text-foreground text-base font-sans-medium">
              {getLabel(profile?.craving_intensity, CRAVING_OPTIONS)}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 font-sans-bold">Previous Quit Attempts</Text>
          <View className="bg-card border border-border rounded-2xl px-4 py-3.5 min-h-[56px] justify-center">
            <Text className="text-foreground text-base font-sans-medium">
              {getLabel(profile?.previous_quit_attempts, QUIT_HISTORY_OPTIONS)}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 font-sans-bold">Quit Struggles</Text>
          <View className="bg-card border border-border rounded-2xl px-4 py-3.5 min-h-[56px] justify-center">
            <Text className="text-foreground text-base font-sans-medium">
              {getMultiLabel(profile?.quit_struggles, QUIT_STRUGGLE_OPTIONS)}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 font-sans-bold">Core Motivation</Text>
          <View className="bg-card border border-border rounded-2xl px-4 py-3.5 min-h-[56px] justify-center mb-8">
            <Text className="text-foreground text-base font-sans-medium">
              {getLabel(profile?.motivation, MOTIVATION_OPTIONS)}
            </Text>
          </View>
        </View>
      </View>
    </EditScreen>
  )
}
