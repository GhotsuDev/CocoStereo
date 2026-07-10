import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Platform, Image, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/colors';
import AudioPlayer from '../components/AudioPlayer';
import AnimatedInput from '../components/AnimatedInput';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000';
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) return `http://${debuggerHost.split(':')[0]}:3000`;
  return 'http://172.30.66.91:3000'; 
};

const API_URL = getApiUrl();

export default function PlaylistsView({ usuario, onVolver, setIsPlayingGlobal }) {
  const [playlists, setPlaylists] = useState([]);
  const [playlistActiva, setPlaylistActiva] = useState(null);
  const [canciones, setCanciones] = useState([]);
  const [todasLasCanciones, setTodasLasCanciones] = useState([]);
  const [indiceActual, setIndiceActual] = useState(null);
  
  // Modales
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);

  // Formulario Edición Playlist
  const [editNombre, setEditNombre] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFoto, setEditFoto] = useState('');

  useEffect(() => { cargarPlaylists(); }, []);

  const cargarPlaylists = async () => {
    try {
      const res = await fetch(`${API_URL}/playlists/${usuario.id}`);
      if (res.ok) setPlaylists(await res.json());
    } catch (e) { console.error(e); }
  };

  const abrirPlaylist = async (playlist) => {
    try {
      const res = await fetch(`${API_URL}/playlists/${playlist.id}/canciones`);
      const resTodas = await fetch(`${API_URL}/canciones/${usuario.id}`);
      if (res.ok && resTodas.ok) {
        setCanciones(await res.json());
        setTodasLasCanciones(await resTodas.json());
        setPlaylistActiva(playlist);
      }
    } catch (e) { console.error(e); }
  };

  const agregarCancionDirecta = async (cancionId) => {
    try {
      const res = await fetch(`${API_URL}/playlists/${playlistActiva.id}/canciones-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canciones_ids: [cancionId] })
      });
      if (res.ok) {
        setModalAgregarVisible(false);
        abrirPlaylist(playlistActiva);
      }
    } catch (e) { console.error(e); }
  };

  // --- NUEVA LÓGICA: SELECCIONAR FOTO DE PORTADA ---
  const seleccionarFotoEdicion = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        const formData = new FormData();
        Alert.alert('Subiendo...', 'Espera mientras procesamos la imagen...');

        if (Platform.OS === 'web') {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          formData.append('archivo', blob, file.name || 'portada.jpg');
        } else {
          formData.append('archivo', { uri: file.uri, name: file.fileName || 'portada.jpg', type: file.mimeType || 'image/jpeg' });
        }

        const uploadRes = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          setEditFoto(data.url);
          Alert.alert('Éxito', 'Portada cargada de forma local.');
        }
      }
    } catch (error) { console.error(error); }
  };

  // --- NUEVA LÓGICA: GUARDAR CAMBIOS EDITADOS ---
  const guardarCambiosPlaylist = async () => {
    if (!editNombre) return Alert.alert('Error', 'El nombre es obligatorio');
    try {
      const res = await fetch(`${API_URL}/playlists/${playlistActiva.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editNombre, descripcion: editDesc, foto: editFoto })
      });

      if (res.ok) {
        Alert.alert('Éxito', 'Playlist actualizada.');
        setModalEditarVisible(false);
        // Actualizamos el objeto en pantalla
        const playlistActualizada = { ...playlistActiva, nombre: editNombre, descripcion: editDesc, foto: editFoto };
        setPlaylistActiva(playlistActualizada);
        cargarPlaylists();
      }
    } catch (e) { console.error(e); }
  };

  // --- NUEVA LÓGICA: ELIMINAR PLAYLIST (SEGURO) ---
  const confirmarEliminarPlaylist = () => {
    if (Platform.OS === 'web') {
      if (confirm('¿Seguro que deseas eliminar esta playlist? Las canciones guardadas no se borrarán de tu catálogo.')) {
        ejecutarEliminacion();
      }
    } else {
      Alert.alert(
        'Eliminar Playlist',
        '¿Estás seguro? Las canciones que contiene seguirán existiendo en tu biblioteca.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: ejecutarEliminacion }
        ]
      );
    }
  };

  const ejecutarEliminacion = async () => {
    try {
      const res = await fetch(`${API_URL}/playlists/${playlistActiva.id}`, { method: 'DELETE' });
      if (res.ok) {
        setPlaylistActiva(null);
        setCanciones([]);
        setIndiceActual(null);
        setIsPlayingGlobal(false);
        cargarPlaylists();
        Alert.alert('Eliminado', 'La playlist ha sido removida.');
      }
    } catch (e) { console.error(e); }
  };

  const playSong = (index) => setIndiceActual(index);
  const nextSong = () => { if (canciones.length > 0) setIndiceActual((indiceActual + 1) % canciones.length); };
  const prevSong = () => { if (canciones.length > 0) setIndiceActual((indiceActual - 1 + canciones.length) % canciones.length); };
  const obtenerImagenUrl = (url) => url ? (url.startsWith('/uploads') ? `${API_URL}${url}` : url) : 'https://via.placeholder.com/150/110022/B026FF?text=No+Cover';

  if (!playlistActiva) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onVolver} style={styles.btnVolver}><Ionicons name="arrow-back" size={28} color={COLORS.accentSecondary} /></TouchableOpacity>
          <Text style={styles.tituloSecundario}>MIS PLAYLISTS</Text><View style={{ width: 28 }} />
        </View>
        <FlatList data={playlists} keyExtractor={item => item.id.toString()} contentContainerStyle={{ paddingBottom: 40 }} ListEmptyComponent={<Text style={styles.emptyText}>No tienes listas creadas.</Text>} renderItem={({item}) => (
          <TouchableOpacity style={styles.playlistCard} onPress={() => abrirPlaylist(item)}>
            <Image source={{ uri: obtenerImagenUrl(item.foto) }} style={styles.cardImage} />
            <View style={{ flex: 1 }}><Text style={styles.playlistNombre}>{item.nombre}</Text><Text style={styles.playlistDesc}>{item.descripcion || 'Sin descripción'}</Text></View>
            <Ionicons name="play-circle" size={40} color={COLORS.accent} />
          </TouchableOpacity>
        )} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setPlaylistActiva(null); setIndiceActual(null); }} style={styles.btnVolver}><Ionicons name="arrow-back" size={28} color={COLORS.accentSecondary} /></TouchableOpacity>
        <Text style={styles.tituloSecundario}>COLECCIÓN</Text>
        
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Botón Editar */}
          <TouchableOpacity onPress={() => { setEditNombre(playlistActiva.nombre); setEditDesc(playlistActiva.descripcion || ''); setEditFoto(playlistActiva.foto || ''); setModalEditarVisible(true); }} style={[styles.btnVolver, { borderColor: COLORS.accentSecondary }]}>
            <Ionicons name="pencil" size={22} color={COLORS.accentSecondary} />
          </TouchableOpacity>
          
          {/* Botón Eliminar */}
          <TouchableOpacity onPress={confirmarEliminarPlaylist} style={[styles.btnVolver, { borderColor: '#FF3B30' }]}>
            <Ionicons name="trash" size={22} color="#FF3B30" />
          </TouchableOpacity>

          {/* Botón Añadir Canciones */}
          <TouchableOpacity onPress={() => setModalAgregarVisible(true)} style={styles.btnVolver}>
            <Ionicons name="add" size={22} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.heroContainer}>
        <Image source={{ uri: obtenerImagenUrl(playlistActiva.foto) }} style={styles.heroImage} />
        <Text style={styles.heroTitle}>{playlistActiva.nombre}</Text>
        <Text style={styles.heroDesc}>{playlistActiva.descripcion || 'Sin descripción'}</Text>
      </View>

      {/* MODAL EDITAR DATOS PLAYLIST */}
      <Modal visible={modalEditarVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>EDITAR PLAYLIST</Text>
            {editFoto ? ( <Image source={{ uri: obtenerImagenUrl(editFoto) }} style={{ width: 90, height: 90, borderRadius: 10, alignSelf: 'center', marginBottom: 15, borderWidth: 2, borderColor: COLORS.accent }} /> ) : null}
            
            <AnimatedInput placeholder="Nombre" value={editNombre} onChangeText={setEditNombre} />
            <AnimatedInput placeholder="Descripción" value={editDesc} onChangeText={setEditDesc} />
            
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flex: 1 }}><AnimatedInput placeholder="URL de portada" value={editFoto} onChangeText={setEditFoto} style={{ marginBottom: 0 }} /></View>
              <TouchableOpacity style={styles.btnUploadSquare} onPress={seleccionarFotoEdicion}><Ionicons name="image" size={22} color="#FFF" /></TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
              <TouchableOpacity style={[styles.btnActionModal, { backgroundColor: COLORS.textSecondary, flex: 1 }]} onPress={() => setModalEditarVisible(false)}><Text style={styles.btnText}>CANCELAR</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnActionModal, { backgroundColor: COLORS.accent, flex: 1 }]} onPress={guardarCambiosPlaylist}><Text style={styles.btnText}>GUARDAR</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL AÑADIR CANCIÓN REGISTRADA */}
      <Modal visible={modalAgregarVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>AÑADIR CANCIÓN A LA LISTA</Text>
            <FlatList 
              data={todasLasCanciones.filter(tc => !canciones.some(c => c.id === tc.id))} 
              keyExtractor={item => item.id.toString()} 
              ListEmptyComponent={<Text style={{ color: COLORS.textSecondary, textAlign: 'center', padding: 20 }}>Ya tienes todas tus canciones agregadas aquí.</Text>}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.playlistRow} onPress={() => agregarCancionDirecta(item.id)}>
                  <Ionicons name="musical-note" size={20} color={COLORS.accentSecondary} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>{item.titulo}</Text><Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{item.artista}</Text></View>
                  <Ionicons name="add-circle" size={24} color={COLORS.accent} />
                </TouchableOpacity>
            )} />
            <TouchableOpacity style={[styles.btnActionModal, { backgroundColor: '#FF3B30', marginTop: 15 }]} onPress={() => setModalAgregarVisible(false)}><Text style={styles.btnText}>CERRAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList data={canciones} keyExtractor={item => item.id.toString()} contentContainerStyle={{ paddingBottom: 140 }} ListEmptyComponent={<Text style={styles.emptyText}>Esta playlist no tiene canciones todavía.</Text>} renderItem={({item, index}) => (
        <View style={[styles.item, indiceActual === index && { borderColor: COLORS.accentSecondary, borderWidth: 2 }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => playSong(index)}>
            <Text style={{color: indiceActual === index ? COLORS.accentSecondary : '#FFF', fontSize: 18, fontWeight: 'bold'}}>{item.titulo}</Text>
            <Text style={{color: COLORS.textSecondary}}>{item.artista}</Text>
          </TouchableOpacity>
        </View>
      )} />

      {indiceActual !== null && (
        <AudioPlayer cancionActual={canciones[indiceActual]} onNext={nextSong} onPrev={prevSong} setIsPlayingGlobal={setIsPlayingGlobal} onClose={() => { setIndiceActual(null); setIsPlayingGlobal(false); }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative' },
  btnVolver: { padding: 8, backgroundColor: 'rgba(25, 5, 45, 0.6)', borderRadius: 10, borderWidth: 1, borderColor: '#4A148C', justifyContent: 'center', alignItems: 'center' },
  tituloSecundario: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 2, position: 'absolute',left: 0, right: 0, textAlign: 'center', zIndex: -1 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 30, fontSize: 15 },
  playlistCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(25, 5, 45, 0.7)', padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#4A148C' },
  cardImage: { width: 60, height: 60, borderRadius: 10, marginRight: 15, borderWidth: 1, borderColor: '#00F3FF' },
  playlistNombre: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  playlistDesc: { color: '#A993C9', fontSize: 12 },
  heroContainer: { alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#4A148C' },
  heroImage: { width: 130, height: 130, borderRadius: 15, marginBottom: 10, borderWidth: 3, borderColor: '#B026FF' },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  heroDesc: { fontSize: 13, color: '#A993C9', textAlign: 'center', paddingHorizontal: 15 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(25, 5, 45, 0.7)', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#4A148C' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'rgba(25, 5, 45, 0.95)', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#B026FF', maxHeight: '80%' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, letterSpacing: 1 },
  playlistRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'rgba(25,5,45,0.4)', borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#4A148C' },
  btnUploadSquare: { backgroundColor: '#4A148C', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', height: 48 },
  btnActionModal: { padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontWeight: '900', color: '#FFF', letterSpacing: 1 }
});