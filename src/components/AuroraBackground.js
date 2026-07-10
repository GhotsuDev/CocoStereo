import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  withDelay,
  withSequence,
  interpolate
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// --- SUB-COMPONENTE: Onda de Estanque / Gota de Lluvia (Ripple Effect) ---
const RippleEffect = ({ isPlaying, delay, color, x, y, maxScale, duration }) => {
  const scale = useSharedValue(0.1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      // Inicialización limpia de valores
      scale.value = 0.1;
      opacity.value = 0;

      // Animación de expansión circular
      scale.value = withDelay(
        delay,
        withRepeat(
          withTiming(maxScale, { duration: duration, easing: Easing.out(Easing.ease) }),
          -1, 
          false
        )
      );

      // Animación de desvanecimiento (Fade In rápido y Fade Out lento)
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.8, { duration: duration * 0.2 }), 
            withTiming(0, { duration: duration * 0.8, easing: Easing.in(Easing.ease) })
          ),
          -1, 
          false
        )
      );
    } else {
      // Apagado progresivo al pausar la canción
      opacity.value = withTiming(0, { duration: 1000 });
      scale.value = withTiming(0.1, { duration: 1000 });
    }
  }, [isPlaying]);

  // Estilo animado inyectado directamente para evitar caídas en Expo
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    borderColor: color,
  }));

  return (
    <Animated.View 
      style={[
        styles.ripple, 
        { left: x - 50, top: y - 50 },
        animatedStyle
      ]} 
    />
  );
};

// --- COMPONENTE PRINCIPAL: Aurora & Ondas Reactivas ---
export default function AuroraBackground({ children, isPlaying }) {
  const darkOverlayOpacity = useSharedValue(0);
  
  // Movimiento espacial acelerado (Modo Reposo Dinámico)
  const waveShift1 = useSharedValue(0);
  const waveShift2 = useSharedValue(0);
  
  // Velocidad de transición entre tonalidades moradas y azules
  const colorPhase = useSharedValue(0);

  useEffect(() => {
    // Oscurecimiento gradual hacia fondo negro profundo al dar Play
    darkOverlayOpacity.value = withTiming(isPlaying ? 0.85 : 0, { duration: 1500 });

    // 🚀 CICLOS ACELERADOS: Reducidos a 4, 5 y 3.5 segundos para apreciar el movimiento neón de inmediato
    waveShift1.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1, true
    );
    waveShift2.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      -1, true
    );
    colorPhase.value = withRepeat(
      withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
      -1, true
    );
  }, [isPlaying]);

  // Generación matemática de 30 ondas dispersas distribuidas aleatoriamente por la pantalla
  const ripples = useMemo(() => {
    const colors = ['#B026FF', '#00F3FF', '#ffe600', '#4A148C', '#1E90FF', '#00FF9D'];
    return Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 4000,
      maxScale: Math.random() * 3 + 1.5,
      duration: Math.random() * 2000 + 2000
    }));
  }, []);

  // Estilos de transformación y distorsión para las olas de color
  const spatialStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: waveShift1.value * 60 },
      { translateY: waveShift1.value * 30 },
      { scale: 1.6 },
      { rotate: '15deg' }
    ]
  }));

  const spatialStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: waveShift2.value * -80 },
      { translateY: waveShift2.value * -20 },
      { scale: 1.6 },
      { rotate: '-10deg' }
    ]
  }));

  // Lógica de Opacidades Cruzadas (Crossfade) automática para mezclar los colores fluidamente
  const colorLayerAStyle = useAnimatedStyle(() => ({
    opacity: interpolate(colorPhase.value, [0, 1], [0.8, 0.2])
  }));
  
  const colorLayerBStyle = useAnimatedStyle(() => ({
    opacity: interpolate(colorPhase.value, [0, 1], [0.1, 0.9])
  }));

  const darkOverlayStyle = useAnimatedStyle(() => ({
    opacity: darkOverlayOpacity.value,
  }));

  return (
    <View style={styles.container}>
      
      {/* Fondo Negro Absoluto de Seguridad */}
      <View style={StyleSheet.absoluteFillObject} backgroundColor="#03000A" />

      {/* --- CAPA DE ENERGÍA DE GRADIENTES 1 --- */}
      <Animated.View style={[StyleSheet.absoluteFillObject, spatialStyle1]}>
        {/* Variación Morada */}
        <Animated.View style={[StyleSheet.absoluteFillObject, colorLayerAStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(176,38,255,0.3)', 'rgba(74,20,140,0.35)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }}
          />
        </Animated.View>
        {/* Variación Azul Eléctrico */}
        <Animated.View style={[StyleSheet.absoluteFillObject, colorLayerBStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(0,191,255,0.3)', 'rgba(0,0,139,0.35)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }}
          />
        </Animated.View>
      </Animated.View>

      {/* --- CAPA DE ENERGÍA DE GRADIENTES 2 (Dirección Inversa) --- */}
      <Animated.View style={[StyleSheet.absoluteFillObject, spatialStyle2]}>
        {/* Variación Azul Oscuro */}
        <Animated.View style={[StyleSheet.absoluteFillObject, colorLayerAStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(30,144,255,0.25)', 'rgba(25,25,112,0.4)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 1, y: 0.1 }} end={{ x: 0, y: 0.9 }}
          />
        </Animated.View>
        {/* Variación Cyan y Púrpura */}
        <Animated.View style={[StyleSheet.absoluteFillObject, colorLayerBStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(138,43,226,0.3)', 'rgba(0,243,255,0.25)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 1, y: 0.1 }} end={{ x: 0, y: 0.9 }}
          />
        </Animated.View>
      </Animated.View>

      {/* Máscara de atenuación que oscurece el fondo cuando arranca la música */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }, darkOverlayStyle]} />

      {/* Capa de renderizado de las ondas expansivas de estanque */}
      <View style={StyleSheet.absoluteFillObject}>
        {ripples.map((ripple) => (
          <RippleEffect 
            key={ripple.id}
            isPlaying={isPlaying}
            delay={ripple.delay}
            color={ripple.color}
            x={ripple.x}
            y={ripple.y}
            maxScale={ripple.maxScale}
            duration={ripple.duration}
          />
        ))}
      </View>
      
      {/* Contenedor frontal de las vistas del sistema */}
      <View style={StyleSheet.absoluteFillObject}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ 
  container: { 
    flex: 1, 
    backgroundColor: '#000',
    overflow: 'hidden'
  },
  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    backgroundColor: 'transparent',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  }
});