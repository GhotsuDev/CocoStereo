import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSpring } from 'react-native-reanimated';

export default function AuroraBackground({ children, isPlaying }) {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Si está reproduciendo, pulsa a 1.5 segundos (rápido). En pausa, 4 segundos (lento).
    const duracion = isPlaying ? 1500 : 4000;
    
    opacity.value = withRepeat(
      withTiming(isPlaying ? 1 : 0.4, { duration: duracion, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    scale.value = withRepeat(
      withTiming(isPlaying ? 1.1 : 1, { duration: duracion, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({ 
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#05000A', '#1A0033', '#05000A']} style={StyleSheet.absoluteFillObject} />
      
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle]}>
        <LinearGradient
          colors={['#100020', '#B026FF', '#00F3FF', '#310A5D']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ opacity: 0.6 }}
        />
      </Animated.View>
      
      <View style={StyleSheet.absoluteFillObject}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#000' } });