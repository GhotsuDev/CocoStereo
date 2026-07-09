import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  cancelAnimation 
} from 'react-native-reanimated';

export default function AuroraBackground({ children, isPlaying }) {
  const opacity = useSharedValue(0.4);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0); // Añadimos rotación para más movimiento

  useEffect(() => {
    // 1. Limpiamos cualquier animación previa antes de cambiar el ritmo
    cancelAnimation(opacity);
    cancelAnimation(scale);
    cancelAnimation(rotation);

    // 2. Si hay música (isPlaying), todo va 3 veces más rápido e intenso
    const duracion = isPlaying ? 1200 : 4000;

    opacity.value = withRepeat(
      withTiming(isPlaying ? 1 : 0.4, { duration: duracion, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );

    scale.value = withRepeat(
      withTiming(isPlaying ? 1.3 : 1, { duration: duracion, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
    
    rotation.value = withRepeat(
      withTiming(isPlaying ? 15 : 5, { duration: duracion * 2, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({ 
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` } // Aplicamos el giro suave
    ]
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#05000A', '#1A0033', '#05000A']} style={StyleSheet.absoluteFillObject} />
      
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle]}>
        {/* Aquí puedes ajustar los colores para que parezcan más una Aurora Neón */}
        <LinearGradient
          colors={['rgba(16,0,32,0.8)', 'rgba(176,38,255,0.7)', 'rgba(0,243,255,0.7)', 'rgba(49,10,93,0.8)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>
      
      <View style={StyleSheet.absoluteFillObject}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#000' } });