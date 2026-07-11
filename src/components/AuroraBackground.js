import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { COLORS } from '../styles/colors';

const { width, height } = Dimensions.get('window');

const RadialRing = ({ size, color, reverse, isPlaying, dash, baseSpeed }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const rotateAnim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: isPlaying ? baseSpeed / 1.8 : baseSpeed,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    rotateAnim.start();
    return () => rotateAnim.stop();
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      const pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.05, duration: 300 + Math.random() * 200, easing: Easing.out(Easing.ease), useNativeDriver: false }),
          Animated.timing(scale, { toValue: 0.98, duration: 300 + Math.random() * 200, easing: Easing.in(Easing.ease), useNativeDriver: false })
        ])
      );
      pulseAnim.start();
      return () => pulseAnim.stop();
    } else {
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: false }).start();
    }
  }, [isPlaying]);

  const rotateZ = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ['360deg', '0deg'] : ['0deg', '360deg']
  });

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size, height: size, borderRadius: size / 2, borderColor: color,
          borderWidth: dash ? 4 : 1.5, borderStyle: dash ? 'dashed' : 'solid',
          opacity: isPlaying ? 0.5 : 0.15, // Más brillantes para que se vean a través del cristal
          transform: [{ rotateZ }, { scale }]
        }
      ]}
    />
  );
};

export default function AuroraBackground({ children, isPlaying }) {
  const darkOverlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(darkOverlay, {
      toValue: isPlaying ? 0.5 : 0.2, // 🟢 Menos oscuridad para lucir los anillos
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [isPlaying]);

  const maxSize = Math.max(width, height);

  return (
    <View style={styles.container}>
      <View style={styles.coreContainer}>
        {/* 🟢 10 ANILLOS PARA UN EFECTO MASIVO Y DENSO 🟢 */}
        <RadialRing size={maxSize * 1.5} color={COLORS.primaryLight} reverse={false} isPlaying={isPlaying} dash={false} baseSpeed={50000} />
        <RadialRing size={maxSize * 1.35} color={COLORS.accent} reverse={true} isPlaying={isPlaying} dash={true} baseSpeed={45000} />
        <RadialRing size={maxSize * 1.2} color={COLORS.textSecondary} reverse={false} isPlaying={isPlaying} dash={false} baseSpeed={40000} />
        <RadialRing size={maxSize * 1.05} color={COLORS.primaryLight} reverse={true} isPlaying={isPlaying} dash={true} baseSpeed={35000} />
        <RadialRing size={maxSize * 0.9} color={COLORS.accent} reverse={false} isPlaying={isPlaying} dash={false} baseSpeed={30000} />
        <RadialRing size={maxSize * 0.75} color={COLORS.textSecondary} reverse={true} isPlaying={isPlaying} dash={true} baseSpeed={25000} />
        <RadialRing size={maxSize * 0.6} color={COLORS.primaryLight} reverse={false} isPlaying={isPlaying} dash={false} baseSpeed={20000} />
        <RadialRing size={maxSize * 0.45} color={COLORS.accent} reverse={true} isPlaying={isPlaying} dash={true} baseSpeed={15000} />
        <RadialRing size={maxSize * 0.3} color={COLORS.textSecondary} reverse={false} isPlaying={isPlaying} dash={false} baseSpeed={10000} />
        <RadialRing size={maxSize * 0.15} color={COLORS.accent} reverse={true} isPlaying={isPlaying} dash={true} baseSpeed={6000} />
      </View>
      <Animated.View style={[styles.darkness, { opacity: darkOverlay }]} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, overflow: 'hidden' },
  content: { flex: 1, zIndex: 10 },
  darkness: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', zIndex: 5 },
  coreContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  ring: { position: 'absolute', justifyContent: 'center', alignItems: 'center' }
});