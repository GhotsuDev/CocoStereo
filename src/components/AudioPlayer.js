import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av'; // 🟢 MOTOR DE AUDIO REAL
import { COLORS } from '../styles/colors';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000';
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) return `http://${debuggerHost.split(':')[0]}:3000`;
  return 'http://172.30.66.91:3000'; 
};
const API_URL = getApiUrl();

export default function AudioPlayer({ cancionActual, onNext, onPrev, setIsPlayingGlobal, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const soundRef = useRef(null);

  // 🟢 LÓGICA CORE: CARGAR Y REPRODUCIR 🟢
  useEffect(() => {
    let isMounted = true;

    const cargarAudio = async () => {
      // Si ya hay algo sonando, lo destruimos primero
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (!cancionActual || !cancionActual.url_audio) return;

      // Formatear la URL por si es un archivo local del backend
      const audioUri = cancionActual.url_audio.startsWith('/') 
        ? `${API_URL}${cancionActual.url_audio}` 
        : cancionActual.url_audio;

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }, // Auto-play al cargar
          (status) => {
            if (status.isLoaded && isMounted) {
              setProgress(status.positionMillis / (status.durationMillis || 1));
              setIsPlaying(status.isPlaying);
              
              // Si la canción termina, saltar a la siguiente automáticamente
              if (status.didJustFinish) {
                onNext();
              }
            }
          }
        );
        soundRef.current = sound;
      } catch (error) {
        console.error("Error al reproducir el audio:", error);
      }
    };

    cargarAudio();

    // Limpieza al desmontar o cambiar de canción
    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [cancionActual]);

  const togglePlayPause = async () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  // Efecto visual global
  useEffect(() => {
    setIsPlayingGlobal(isPlaying);
    return () => setIsPlayingGlobal(false);
  }, [isPlaying]);

  if (!cancionActual) return null;

  return (
    <View style={styles.floatingContainer}>
      <View style={styles.playerCard}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.btnClose}>
            <Ionicons name="chevron-down" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.nowPlayingText}>REPRODUCIENDO AHORA</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.songInfo}>
          <View style={styles.coverArtPlaceholder}>
            <Ionicons name="musical-notes" size={40} color={COLORS.accent} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{cancionActual.titulo}</Text>
            <Text style={styles.artist} numberOfLines={1}>{cancionActual.artista}</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={onPrev}>
            <Ionicons name="play-skip-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={32} color={COLORS.background} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={onNext}>
            <Ionicons name="play-skip-forward" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: { position: 'absolute', bottom: Platform.OS === 'web' ? 20 : 30, left: 20, right: 20, zIndex: 1000 },
  playerCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.borderHighlight, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  btnClose: { backgroundColor: COLORS.surfaceInset, borderRadius: 12, padding: 5, borderWidth: 1, borderColor: COLORS.borderShadow },
  nowPlayingText: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  songInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  coverArtPlaceholder: { width: 60, height: 60, backgroundColor: COLORS.surfaceInset, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: COLORS.borderShadow },
  textContainer: { flex: 1 },
  title: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  artist: { color: COLORS.textSecondary, fontSize: 14 },
  progressBarContainer: { marginBottom: 20 },
  progressBackground: { height: 8, backgroundColor: COLORS.surfaceInset, borderRadius: 4, borderWidth: 1, borderColor: COLORS.borderShadow, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 4, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30 },
  controlBtn: { backgroundColor: COLORS.surface, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: COLORS.borderHighlight, shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.4, shadowRadius: 5 },
  playBtn: { backgroundColor: COLORS.accent, padding: 20, borderRadius: 30, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 }
});