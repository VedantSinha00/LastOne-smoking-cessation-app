import React from 'react'
import { Pressable, View } from 'react-native'

/** A pill toggle ported 1:1 from the Lovable ProfileScreen `Toggle`: a 24×44
 *  rounded track (primary when on, muted when off) with a 20×20 white knob that
 *  slides between the two ends. Replaces RN's platform-native <Switch>, which
 *  renders differently per OS and doesn't match the design. */
export const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void }> = ({
  on,
  onChange,
}) => (
  <Pressable
    accessibilityRole="switch"
    accessibilityState={{ checked: on }}
    onPress={() => onChange(!on)}
    hitSlop={8}
    style={{
      height: 24,
      width: 44,
      borderRadius: 9999,
      justifyContent: 'center',
      backgroundColor: on ? '#7FC200' : '#E9E7E5', // primary / muted
    }}
  >
    <View
      style={{
        position: 'absolute',
        top: 2,
        left: on ? 22 : 2,
        height: 20,
        width: 20,
        borderRadius: 9999,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}
    />
  </Pressable>
)
