import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Platform, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/colors';
import Constants from 'expo-constants';
import StarRating from '../components/StarRating';
import AudioPlayer from '../components/AudioPlayer';

const getApiUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000';
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) return `http://${debuggerHost.split(':')[0]}:3000`;
  return 'http://172.30.66.91:3000'; 
};
const API_URL = getApiUrl();

export default function PlaylistsView({ usuario, onVolver, setIsPlayingGlobal }) {
  const [playlists, setPlaylists] = useState([]);
  const [playlistSeleccionada, setPlaylistSeleccionada] = useState(null);
  const [cancionesInternas, setCancionesInternas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [indiceActual, setIndiceActual] = useState(null);
  
  const [modalEdicionVisible, setModalEdicionVisible] = useState(false);
  const [editNombre, setEditNombre] = useState('');

  const cargarPlaylists = async () => {
    try {
      const res = await fetch(`${API_URL}/playlists/${usuario.id}`);
      if (res.ok) setPlaylists(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { cargarPlaylists(); }, []);

  const abrirPlaylist = async (playlist) => {
    setPlaylistSeleccionada(playlist);
    setIndiceActual(null);
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/playlists/${playlist.id}/canciones`);
      if (res.ok) setCancionesInternas(await res.json());
    } catch (error) { console.error(error); }
    setCargando(false);
  };

  const playSong = (index) => setIndiceActual(index);
  const nextSong = () => { if (cancionesInternas.length > 0) setIndiceActual((indiceActual + 1) % cancionesInternas.length); };
  const prevSong = () => { if (cancionesInternas.length > 0) setIndiceActual((indiceActual - 1 + cancionesInternas.length) % cancionesInternas.length); };

  const confirmarEliminar = (id) => {
    if (Platform.OS === 'web') {
      if (window.confirm("¿Estás seguro de eliminar esta playlist?")) eliminarPlaylist(id);
    } else {
      Alert.alert('Eliminar', '¿Seguro que deseas eliminar esta playlist?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminarPlaylist(id) }
      ]);
    }
  };

  const eliminarPlaylist = async (id) => {
    try {
      await fetch(`${API_URL}/playlists/${id}`, { method: 'DELETE' });
      setPlaylistSeleccionada(null);
      setIndiceActual(null);
      cargarPlaylists();
    } catch (e) { console.error("Error al eliminar", e); }
  };

  const guardarEdicion = async () => {
    if (!editNombre) return;
    try {
      await fetch(`${API_URL}/playlists/${playlistSeleccionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editNombre, descripcion: playlistSeleccionada.descripcion, foto: playlistSeleccionada.foto })
      });
      setModalEdicionVisible(false);
      setPlaylistSeleccionada({ ...playlistSeleccionada, nombre: editNombre });
      cargarPlaylists();
    } catch (e) { console.error("Error al editar", e); }
  };

  const confirmarRemoverDePlaylist = (cancionId) => {
    if (Platform.OS === 'web') {
      if (window.confirm("¿Quitar esta canción de la playlist?")) removerCancion(cancionId);
    } else {
      Alert.alert('Quitar Canción', '¿Quitar de esta playlist?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Quitar', style: 'destructive', onPress: () => removerCancion(cancionId) }
      ]);
    }
  };

  const removerCancion = async (cancionId) => {
    try {
      const res = await fetch(`${API_URL}/playlists/${playlistSeleccionada.id}/canciones/${cancionId}`, { method: 'DELETE' });
      if (res.ok) {
        if (cancionesInternas[indiceActual]?.id === cancionId) setIndiceActual(null);
        abrirPlaylist(playlistSeleccionada); // Recarga la lista interna
      }
    } catch (e) { console.error("Error al quitar canción", e); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (playlistSeleccionada) {
              setPlaylistSeleccionada(null);
              setIndiceActual(null);
            } else {
              onVolver();
            }
          }} 
          style={styles.btnVolver}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.tituloSecundario}>
          {playlistSeleccionada ? playlistSeleccionada.nombre.toUpperCase() : 'MIS PLAYLISTS'}
        </Text>

        {playlistSeleccionada ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.btnAccionHeader} onPress={() => { setEditNombre(playlistSeleccionada.nombre); setModalEdicionVisible(true); }}>
              <Ionicons name="pencil" size={20} color={COLORS.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAccionHeader} onPress={() => confirmarEliminar(playlistSeleccionada.id)}>
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: 46 }} />
        )}
      </View>

      {!playlistSeleccionada ? (
        <FlatList 
          data={playlists}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.cardNeumorphic} onPress={() => abrirPlaylist(item)}>
              <View style={styles.placeholderImagen}><Ionicons name="folder" size={24} color={COLORS.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombrePlaylist}>{item.nombre}</Text>
                <Text style={styles.descPlaylist}>Abrir colección</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        />
      ) : (
        cargando ? <ActivityIndicator size="large" color={COLORS.accent} style={{marginTop: 50}} /> : (
          <FlatList 
            data={cancionesInternas}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 130 }}
            renderItem={({item, index}) => (
              <View style={[styles.itemCancion, indiceActual === index && { borderColor: COLORS.accent }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{color: indiceActual === index ? COLORS.accent : COLORS.text, fontSize: 16, fontWeight: 'bold'}}>{item.titulo}</Text>
                  <Text style={{color: COLORS.textSecondary, marginBottom: 4, fontSize: 12}}>{item.artista}</Text>
                  <StarRating calificacion={item.calificacion} readOnly={true} />
                </View>
                <TouchableOpacity style={styles.btnPlay} onPress={() => playSong(index)}>
                  <Ionicons name={indiceActual === index ? "pause" : "play"} size={18} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmarRemoverDePlaylist(item.id)}>
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={{color: COLORS.textSecondary, textAlign: 'center', marginTop: 40}}>Esta playlist no tiene canciones aún.</Text>}
          />
        )
      )}

      <Modal visible={modalEdicionVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>EDITAR PLAYLIST</Text>
            <TextInput 
              style={styles.inputNeumorphic} 
              placeholder="Nuevo nombre" 
              value={editNombre} 
              onChangeText={setEditNombre} 
              placeholderTextColor={COLORS.textSecondary} 
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
              <TouchableOpacity style={[styles.btnAction, { flex: 1, backgroundColor: COLORS.surfaceInsetTransparent }]} onPress={() => setModalEdicionVisible(false)}>
                <Text style={{color: COLORS.text, fontWeight: 'bold'}}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnAction, { flex: 1 }]} onPress={guardarEdicion}>
                <Text style={styles.btnActionText}>GUARDAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {indiceActual !== null && (
        <AudioPlayer 
          cancionActual={cancionesInternas[indiceActual]} 
          onNext={nextSong} 
          onPrev={prevSong} 
          setIsPlayingGlobal={setIsPlayingGlobal} 
          onClose={() => setIndiceActual(null)} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, position: 'relative', width: '100%' },
  btnVolver: { padding: 10, backgroundColor: COLORS.surfaceTransparent, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderHighlight },
  btnAccionHeader: { padding: 8, backgroundColor: COLORS.surfaceInsetTransparent, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderShadow },
  tituloSecundario: { fontSize: 16, fontWeight: '900', color: COLORS.text, letterSpacing: 2, position: 'absolute', left: 0, right: 0, textAlign: 'center', zIndex: -1 },
  
  // 🟢 Estilos Glassmorphism Aplicados 🟢
  cardNeumorphic: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceTransparent, padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: COLORS.borderHighlight },
  placeholderImagen: { width: 50, height: 50, borderRadius: 10, marginRight: 15, backgroundColor: COLORS.surfaceInsetTransparent, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderShadow },
  nombrePlaylist: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  descPlaylist: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  itemCancion: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceTransparent, padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderHighlight },
  btnPlay: { backgroundColor: COLORS.accent, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', paddingLeft: 4, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.surface, padding: 25, borderRadius: 20, borderWidth: 1, borderColor: COLORS.borderHighlight },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  inputNeumorphic: { backgroundColor: COLORS.surfaceInsetTransparent, color: COLORS.text, padding: 16, fontSize: 15, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderShadow, marginBottom: 15 },
  btnAction: { backgroundColor: COLORS.accent, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  btnActionText: { color: '#000', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
});