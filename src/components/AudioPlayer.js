import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { COLORS } from '../styles/colors';

export default function AudioPlayer({ cancionActual, onNext, onPrev, setIsPlayingGlobal, onClose }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [errorCarga, setErrorCarga] = useState(false); // Nuevo estado para errores

  const formatTime = (millis) => {
    if (!millis) return "00:00";
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  async function cargarCancion() {
    if (sound) await sound.unloadAsync(); 
    if (!cancionActual?.url_audio) {
        console.warn("Esta canción no tiene URL de audio asignada.");
        setErrorCarga(true);
        return;
    }

    try {
      setErrorCarga(false);
      // ⚠️ Asegúrate de que esta sea tu IP real
      const uri = cancionActual.url_audio.startsWith('/uploads') 
        ? `http://172.30.66.91:3000${cancionActual.url_audio}` 
        : cancionActual.url_audio;
        
      console.log("Intentando reproducir URI:", uri); // <-- ESTO NOS DIRÁ EL PROBLEMA

      const { sound: nuevoSonido } = await Audio.Sound.createAsync(
        { uri }, { shouldPlay: true }, onPlaybackStatusUpdate
      );
      setSound(nuevoSonido);
      setIsPlaying(true);
      setIsPlayingGlobal(true);
    } catch (error) {
      console.error('Error cargando audio en URI:', cancionActual.url_audio, error);
      setErrorCarga(true);
    }
  }

  useEffect(() => {
    cargarCancion();
    return sound ? () => sound.unloadAsync() : undefined;
  }, [cancionActual]);

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      if (status.didJustFinish) onNext(); 
    } else if (status.error) {
      console.error(`Error de Playback: ${status.error}`);
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      setIsPlayingGlobal(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
      setIsPlayingGlobal(true);
    }
  };

  const handleSeek = async (value) => { if (sound) await sound.setPositionAsync(value); };

  const handleClose = async () => {
    if (sound) await sound.unloadAsync();
    setIsPlayingGlobal(false);
    onClose();
  };

  if (!cancionActual) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
        <Ionicons name="close-circle" size={28} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Text style={styles.title}>
        {cancionActual.titulo} - <Text style={styles.artist}>{cancionActual.artista}</Text>
      </Text>
      
      {/* Mensaje de error visual si la URL falla */}
      {errorCarga && (
          <Text style={{ color: '#FF3B30', textAlign: 'center', fontSize: 12, marginBottom: 5 }}>
             No se pudo cargar el audio. (Link no válido o archivo no encontrado)
          </Text>
      )}

      <View style={styles.sliderContainer}>
        <Text style={styles.time}>{formatTime(position)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration > 0 ? duration : 1} // <-- ARREGLO DEL WARNING AQUÍ
          value={position}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor={COLORS.accentSecondary}
          maximumTrackTintColor={COLORS.textSecondary}
          thumbTintColor={COLORS.accent}
          disabled={errorCarga}
        />
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={onPrev}>
          <Ionicons name="play-skip-back" size={32} color={errorCarga ? COLORS.textSecondary : COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.playBtn, errorCarga && { backgroundColor: COLORS.textSecondary }]} onPress={togglePlayPause} disabled={errorCarga}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={36} color="#000" style={{ marginLeft: isPlaying ? 0 : 4 }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext}>
          <Ionicons name="play-skip-forward" size={32} color={errorCarga ? COLORS.textSecondary : COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'rgba(11, 0, 22, 0.95)', padding: 15, borderTopWidth: 1, borderColor: COLORS.accent, position: 'absolute', bottom: 0, width: '100%', elevation: 10, zIndex: 100 },
  closeBtn: { position: 'absolute', top: 10, right: 15, zIndex: 10 },
  title: { color: COLORS.textPrimary, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, paddingHorizontal: 30 },
  artist: { color: COLORS.textSecondary, fontWeight: 'normal' },
  sliderContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  slider: { flex: 1, height: 40, marginHorizontal: 10 },
  time: { color: COLORS.textSecondary, fontSize: 12 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30, marginTop: 5 },
  playBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.accentSecondary, justifyContent: 'center', alignItems: 'center' }
});