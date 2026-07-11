import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Modal, FlatList, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av'; 
import { COLORS } from '../styles/colors';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000';
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) return `http://${debuggerHost.split(':')[0]}:3000`;
  return 'http://172.30.66.91:3000'; 
};
const API_URL = getApiUrl();

export default function AudioPlayer({ cancionActual, onNext, onPrev, setIsPlayingGlobal, onClose, usuario }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const soundRef = useRef(null);

  // 🟢 ESTADOS PARA AÑADIR A PLAYLIST 🟢
  const [modalPlaylistsVisible, setModalPlaylistsVisible] = useState(false);
  const [modalNuevaVisible, setModalNuevaVisible] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [nuevaPlaylistNombre, setNuevaPlaylistNombre] = useState('');

  useEffect(() => {
    let isMounted = true;
    const cargarAudio = async () => {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (!cancionActual || !cancionActual.url_audio) return;

      const audioUri = cancionActual.url_audio.startsWith('/') 
        ? `${API_URL}${cancionActual.url_audio}` 
        : cancionActual.url_audio;

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri }, { shouldPlay: true },
          (status) => {
            if (status.isLoaded && isMounted) {
              setProgress(status.positionMillis / (status.durationMillis || 1));
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) onNext();
            }
          }
        );
        soundRef.current = sound;
      } catch (error) { console.error("Error al reproducir el audio:", error); }
    };

    cargarAudio();
    return () => { isMounted = false; if (soundRef.current) soundRef.current.unloadAsync(); };
  }, [cancionActual]);

  const togglePlayPause = async () => {
    if (!soundRef.current) return;
    if (isPlaying) await soundRef.current.pauseAsync();
    else await soundRef.current.playAsync();
  };

  useEffect(() => {
    setIsPlayingGlobal(isPlaying);
    return () => setIsPlayingGlobal(false);
  }, [isPlaying]);

  // 🟢 LÓGICA DE PLAYLISTS DENTRO DEL REPRODUCTOR 🟢
  const abrirModalPlaylists = async () => {
    if (!usuario) return;
    try {
      const res = await fetch(`${API_URL}/playlists/${usuario.id}`);
      if (res.ok) setPlaylists(await res.json());
      setModalPlaylistsVisible(true);
    } catch (error) { console.error(error); }
  };

  const agregarAPlaylist = async (playlistId) => {
    try {
      const res = await fetch(`${API_URL}/playlists/${playlistId}/canciones-batch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canciones_ids: [cancionActual.id] })
      });
      if (res.ok) {
        Alert.alert('Éxito', 'Canción agregada a la lista.');
        setModalPlaylistsVisible(false);
      } else if (res.status === 409) {
        Alert.alert('Aviso', 'Esta canción ya está en esa playlist.');
      }
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const crearPlaylistYAgregar = async () => {
    if (!nuevaPlaylistNombre) return Alert.alert('Error', 'Dale un nombre');
    try {
      const res = await fetch(`${API_URL}/playlists`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuario.id, nombre: nuevaPlaylistNombre, canciones_ids: [cancionActual.id] })
      });
      if (res.ok) {
        Alert.alert('Éxito', 'Lista creada y canción agregada.');
        setModalNuevaVisible(false);
        setNuevaPlaylistNombre('');
      }
    } catch (e) { console.error(e); }
  };

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
          {/* 🟢 BOTÓN PARA AÑADIR A PLAYLIST DESDE EL REPRODUCTOR 🟢 */}
          <TouchableOpacity style={styles.btnAddPlaylist} onPress={abrirModalPlaylists}>
            <Ionicons name="add-circle" size={32} color={COLORS.accent} />
          </TouchableOpacity>
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

      {/* MODALES DEL REPRODUCTOR */}
      <Modal visible={modalPlaylistsVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>AÑADIR A PLAYLIST</Text>
            <TouchableOpacity style={styles.playlistRowNuevo} onPress={() => { setModalPlaylistsVisible(false); setModalNuevaVisible(true); }}>
              <Ionicons name="add-circle" size={24} color={COLORS.accent} style={{ marginRight: 10 }} />
              <Text style={{ color: COLORS.accent, fontWeight: 'bold', fontSize: 16 }}>Crear Nueva Playlist</Text>
            </TouchableOpacity>
            <FlatList data={playlists} keyExtractor={item => item.id.toString()} style={{ maxHeight: 200, marginTop: 10 }}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.playlistRow} onPress={() => agregarAPlaylist(item.id)}>
                  <Ionicons name="folder" size={20} color={COLORS.primaryLight} style={{ marginRight: 10 }} />
                  <Text style={{ color: COLORS.text, fontSize: 16 }}>{item.nombre}</Text>
                </TouchableOpacity>
            )} />
            <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalPlaylistsVisible(false)}>
              <Text style={styles.btnCancelarText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalNuevaVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>NUEVA PLAYLIST</Text>
            <TextInput style={styles.inputNeumorphic} placeholder="Nombre de la Playlist" value={nuevaPlaylistNombre} onChangeText={setNuevaPlaylistNombre} placeholderTextColor={COLORS.textSecondary} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
              <TouchableOpacity style={[styles.btnAction, { flex: 1, backgroundColor: COLORS.surfaceInsetTransparent }]} onPress={() => setModalNuevaVisible(false)}>
                <Text style={{color: COLORS.text, fontWeight: 'bold'}}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnAction, { flex: 1 }]} onPress={crearPlaylistYAgregar}>
                <Text style={styles.btnActionText}>CREAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: { position: 'absolute', bottom: Platform.OS === 'web' ? 20 : 30, left: 20, right: 20, zIndex: 1000 },
  
  // 🟢 CAMBIO A MATE: Usamos COLORS.surface en lugar de surfaceTransparent
  playerCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: COLORS.borderHighlight, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.8, // Subí un poco la sombra para que resalte más sobre el fondo
    shadowRadius: 15, 
    elevation: 15 
  },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  
  // 🟢 CAMBIO A MATE: Usamos COLORS.surfaceInset
  btnClose: { backgroundColor: COLORS.surfaceInset, borderRadius: 12, padding: 5, borderWidth: 1, borderColor: COLORS.borderShadow },
  nowPlayingText: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  songInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  
  // 🟢 CAMBIO A MATE: Usamos COLORS.surfaceInset
  coverArtPlaceholder: { width: 60, height: 60, backgroundColor: COLORS.surfaceInset, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: COLORS.borderShadow },
  textContainer: { flex: 1, paddingRight: 10 },
  title: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  artist: { color: COLORS.textSecondary, fontSize: 14 },
  btnAddPlaylist: { padding: 5 },
  progressBarContainer: { marginBottom: 20 },
  
  // 🟢 CAMBIO A MATE: Usamos COLORS.surfaceInset
  progressBackground: { height: 8, backgroundColor: COLORS.surfaceInset, borderRadius: 4, borderWidth: 1, borderColor: COLORS.borderShadow, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 4, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30 },
  
  // 🟢 CAMBIO A MATE: Usamos COLORS.surface
  controlBtn: { backgroundColor: COLORS.surface, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: COLORS.borderHighlight, shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.6, shadowRadius: 5 },
  playBtn: { backgroundColor: COLORS.accent, padding: 20, borderRadius: 30, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
  
  // Modales (Estos los dejé con un ligero toque transparente para que no tapen TODO, pero opacos)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.surface, padding: 25, borderRadius: 20, borderWidth: 1, borderColor: COLORS.borderHighlight },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  playlistRowNuevo: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.accent, borderStyle: 'dashed' },
  playlistRow: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: COLORS.surfaceInset, borderRadius: 10, marginBottom: 10 },
  btnCancelar: { backgroundColor: COLORS.surfaceInset, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: COLORS.borderShadow },
  btnCancelarText: { color: COLORS.text, fontWeight: 'bold' },
  inputNeumorphic: { backgroundColor: COLORS.surfaceInset, color: COLORS.text, padding: 16, fontSize: 15, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderShadow, marginBottom: 15 },
  btnAction: { backgroundColor: COLORS.accent, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  btnActionText: { color: '#000', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 }
});