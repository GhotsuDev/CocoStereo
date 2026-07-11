import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { COLORS } from '../styles/colors';

const { width, height } = Dimensions.get('window');

const getApiUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000';
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) return `http://${debuggerHost.split(':')[0]}:3000`;
  return 'http://172.30.66.91:3000'; 
};

const API_URL = getApiUrl();

export default function LoginView({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Animación del fondo Blur
  const blob1 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const blob2 = useRef(new Animated.ValueXY({ x: width, y: height })).current;

  useEffect(() => {
    const moveBlobs = () => {
      Animated.parallel([
        Animated.timing(blob1, { toValue: { x: Math.random() * width, y: Math.random() * height }, duration: 10000, useNativeDriver: false }),
        Animated.timing(blob2, { toValue: { x: Math.random() * width, y: Math.random() * height }, duration: 12000, useNativeDriver: false })
      ]).start(() => moveBlobs());
    };
    moveBlobs();
  }, []);

  const procesarFormulario = async () => {
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/registro';
      const body = isLogin ? { correo, password } : { nombre, correo, password };
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        onLoginSuccess(await res.json());
      } else { 
        alert(isLogin ? 'Credenciales incorrectas' : 'Error al registrar.'); 
      }
    } catch (error) { alert('Error de conexión con el servidor.'); }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Fondo Animado Simulación Blur */}
      <Animated.View style={[styles.blob, { backgroundColor: COLORS.primaryLight, left: blob1.x, top: blob1.y }]} />
      <Animated.View style={[styles.blob, { backgroundColor: COLORS.accent, left: blob2.x, top: blob2.y, opacity: 0.2 }]} />
      <View style={styles.blurOverlay} />

      {/* Contenedor del Formulario (Glassmorphism) */}
      <View style={styles.glassPanel}>
        <View style={styles.header}>
          <Ionicons name="musical-notes" size={40} color={COLORS.accent} style={{marginBottom: 10}}/>
          <Text style={styles.title}>CocoStereo</Text>
          <Text style={styles.subtitle}>{isLogin ? 'Bienvenido de vuelta' : 'Guarda tu estilo'}</Text>
        </View>

        <View style={styles.formPanel}>
          {!isLogin && (
            <TextInput style={styles.inputNeumorphic} placeholder="Nombre de usuario" value={nombre} onChangeText={setNombre} placeholderTextColor={COLORS.textSecondary} />
          )}
          <TextInput style={styles.inputNeumorphic} placeholder="Correo electrónico" value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={COLORS.textSecondary} />
          <TextInput style={styles.inputNeumorphic} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={COLORS.textSecondary} />

          <TouchableOpacity style={styles.btnAction} onPress={procesarFormulario} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnActionText}>{isLogin ? 'ENTRAR' : 'REGISTRARSE'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setNombre(''); setPassword(''); }}>
            <Text style={styles.switchText}>
              {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.1, filter: 'blur(40px)' },
  blurOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0)' }, // Efecto cristal oscuro
  glassPanel: { width: '85%', maxWidth: 400, backgroundColor: 'rgba(26, 36, 23, 0.6)', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: COLORS.borderHighlight, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, letterSpacing: 2 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 5 },
  formPanel: { width: '100%' },
  inputNeumorphic: { backgroundColor: COLORS.surfaceInset, color: COLORS.text, padding: 16, fontSize: 15, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderShadow, marginBottom: 15 },
  btnAction: { backgroundColor: COLORS.accent, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  btnActionText: { color: '#000', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  switchText: { color: COLORS.accent, fontSize: 13, textAlign: 'center', fontWeight: '600' }
});