import React, { useState } from 'react';
import { StatusBar } from 'react-native';

// Importación de tus Vistas
import LoginView from './src/views/LoginView';
import HomeView from './src/views/HomeView';
import PlaylistsView from './src/views/PlaylistsView';
import ProfileView from './src/views/ProfileView'; 

// Componentes
import AuroraBackground from './src/components/AuroraBackground'; 

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('login'); 
  const [isPlayingGlobal, setIsPlayingGlobal] = useState(false);

  // 1. VISTA: LOGIN / REGISTRO (La que acabamos de crear)
  if (!usuario || vista === 'login') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <LoginView 
          onLoginSuccess={(datosUsuario) => {
            setUsuario(datosUsuario);
            setVista('home');
          }} 
        />
      </>
    );
  }

  // 2. VISTA: PERFIL DEL USUARIO
  if (vista === 'profile') {
    return (
      <AuroraBackground isPlaying={isPlayingGlobal}>
        <StatusBar barStyle="light-content" />
        <ProfileView 
          usuario={usuario} 
          onVolver={() => setVista('home')}
          onUpdateUser={(usuarioActualizado) => setUsuario(usuarioActualizado)}
        />
      </AuroraBackground>
    );
  }

  // 3. VISTA: DETALLE DE PLAYLISTS
  if (vista === 'playlists') {
    return (
      <AuroraBackground isPlaying={isPlayingGlobal}>
        <StatusBar barStyle="light-content" />
        <PlaylistsView 
          usuario={usuario} 
          onVolver={() => setVista('home')}
          setIsPlayingGlobal={setIsPlayingGlobal} 
        />
      </AuroraBackground>
    );
  }

  // 4. VISTA: HOME PRINCIPAL
  return (
    <AuroraBackground isPlaying={isPlayingGlobal}>
      <StatusBar barStyle="light-content" />
      <HomeView 
        usuario={usuario} 
        onLogout={() => { 
          setUsuario(null); 
          setIsPlayingGlobal(false); 
          setVista('login'); 
        }} 
        onEditProfile={() => setVista('profile')} 
        onGoToPlaylists={() => setVista('playlists')} 
        setIsPlayingGlobal={setIsPlayingGlobal} 
      />
    </AuroraBackground>
  );
}