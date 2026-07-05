import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import HomeView from './src/views/HomeView';
import ProfileView from './src/views/ProfileView';
import AnimatedInput from './src/components/AnimatedInput';
import AuroraBackground from './src/components/AuroraBackground';
import { COLORS } from './src/styles/colors';
import { Ionicons } from '@expo/vector-icons';
import PlaylistsView from './src/views/PlaylistsView';

// ⚠️ TU IP AQUI
const API_URL = 'http://192.168.1.103:3000'; 

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('home'); 
  const [isPlayingGlobal, setIsPlayingGlobal] = useState(false); // <--- Controla la Aurora
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nombre })
      });
      if (res.ok) {
        setUsuario(await res.json());
      } else {
        alert('Error en las credenciales.');
      }
    } catch (e) { console.log(e); }
  };

  const renderContent = () => {
    if (!usuario) {
      return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.loginContainer}>
          <Ionicons name="headset" size={80} color={COLORS.accentSecondary} style={{ marginBottom: 10 }} />
          <Text style={styles.title}>COCOSTEREO</Text>
          <Text style={styles.subtitle}>NEON EDITION</Text>
          
          <View style={styles.formBox}>
            <AnimatedInput placeholder="Tu Nombre (Nuevo usuario)" value={nombre} onChangeText={setNombre} />
            <AnimatedInput placeholder="Correo Electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <AnimatedInput placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
            
            <TouchableOpacity style={styles.btnLogin} onPress={handleLogin}>
              <Text style={styles.btnText}>ENTRAR AL SISTEMA</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      );
    }

    if (vista === 'profile') {
      return <ProfileView usuario={usuario} onVolver={() => setVista('home')} onActualizar={setUsuario} />;
    }

    if (vista === 'playlists') {
      return <PlaylistsView usuario={usuario} onVolver={() => setVista('home')} setIsPlayingGlobal={setIsPlayingGlobal} />;
    }

    return (
      <HomeView 
        usuario={usuario} 
        onLogout={() => { setUsuario(null); setIsPlayingGlobal(false); }} 
        onEditProfile={() => setVista('profile')}
        setIsPlayingGlobal={setIsPlayingGlobal} // Pasamos la función para animar el fondo
      />
    );
  };

  return (
    <AuroraBackground isPlaying={isPlayingGlobal}>
      {renderContent()}
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 36, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 4, textShadowColor: COLORS.accent, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  subtitle: { color: COLORS.accentSecondary, letterSpacing: 5, marginBottom: 40, fontWeight: 'bold' },
  formBox: { width: '100%', backgroundColor: COLORS.cardBackground, padding: 25, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  btnLogin: { backgroundColor: COLORS.accent, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, shadowColor: COLORS.accent, shadowOpacity: 0.8, shadowRadius: 15 },
  btnText: { color: '#FFF', fontWeight: 'bold', letterSpacing: 1 }
});