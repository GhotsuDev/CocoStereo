import React, { useRef } from 'react';
import { TextInput, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../styles/colors';

export default function AnimatedInput({ ...props }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1.02, useNativeDriver: true }),
      Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false })
    ]).start();
  };

  const handleBlur = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false })
    ]).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.accent]
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: props.style?.flex ? undefined : '100%', flex: props.style?.flex }}>
      <Animated.View style={[styles.container, { borderColor }]}>
        <TextInput
          {...props}
          style={[styles.input, props.style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={COLORS.textSecondary}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 10, marginBottom: 12, backgroundColor: COLORS.inputBackground, overflow: 'hidden' },
  input: { color: COLORS.textPrimary, padding: 14, fontSize: 16 }
});