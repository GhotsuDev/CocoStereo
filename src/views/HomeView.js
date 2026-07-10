import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, Alert, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../styles/colors';
import AnimatedInput from '../components/AnimatedInput';
import StarRating from '../components/StarRating';
import AudioPlayer from '../components/AudioPlayer';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000';
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000`;
  }
  return 'http://172.30.66.91:3000'; 
};

const API_URL = getApiUrl();

export default function HomeView({ usuario, onLogout, onEditProfile, setIsPlayingGlobal, onGoToPlaylists }) {
  const [canciones, setCanciones] = useState([]);
  const [playlists, setPlaylists] = useState([]); // Recuperamos el estado de las playlists
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [indiceActual, setIndiceActual] = useState(null);
  
  const [modoEdicion, setModoEdicion] = useState(null); 
  const [titulo, setTitulo] = useState('');
  const [artista, setArtista] = useState('');
  const [genero, setGenero] = useState('');
  const [urlAudio, setUrlAudio] = useState('');
  const [calificacion, setCalificacion] = useState(0);

  const [modalSeleccionarVisible, setModalSeleccionarVisible] = useState(false); // Modal intermedio
  const [modalPlaylistVisible, setModalPlaylistVisible] = useState(false);
  const [nombrePlaylist, setNombrePlaylist] = useState('');
  const [descPlaylist, setDescPlaylist] = useState('');
  const [fotoPlaylist, setFotoPlaylist] = useState('');

  const cargarDatos = async () => {
    try {
      const resCanciones = await fetch(`${API_URL}/canciones/${usuario.id}`);
      if (resCanciones.ok) setCanciones(await resCanciones.json());
      
      const resPlaylists = await fetch(`${API_URL}/playlists/${usuario.id}`);
      if (resPlaylists.ok) setPlaylists(await resPlaylists.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const toggleSeleccion = (id) => {
    if (seleccionadas.includes(id)) {
      setSeleccionadas(seleccionadas.filter(item => item !== id));
    } else {
      setSeleccionadas([...seleccionadas, id]);
    }
  };

  const seleccionarArchivo = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!res.canceled && res.assets.length > 0) {
        const file = res.assets[0];
        const formData = new FormData();
        Alert.alert('Subiendo...', 'Espera mientras procesamos el archivo...');

        if (Platform.OS === 'web') {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          formData.append('archivo', blob, file.name);
        } else {
          formData.append('archivo', { uri: file.uri, name: file.name, type: file.mimeType || 'audio/mpeg' });
        }

        const uploadRes = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          setUrlAudio(data.url); 
          Alert.alert('Éxito', 'Archivo cargado correctamente.');
        } else { Alert.alert('Error', 'El backend rechazó el archivo.'); }
      }
    } catch (error) { console.error(error); Alert.alert('Error', 'Hubo un problema con el archivo.'); }
  };

  const seleccionarFotoPlaylist = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
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
          setFotoPlaylist(data.url); 
          Alert.alert('Éxito', 'Portada cargada correctamente.');
        } else { Alert.alert('Error', 'El backend rechazó el archivo.'); }
      }
    } catch (error) { console.error(error); Alert.alert('Error', 'Hubo un problema al leer la imagen.'); }
  };

  const limpiarFormulario = () => { setTitulo(''); setArtista(''); setGenero(''); setUrlAudio(''); setCalificacion(0); setModoEdicion(null); };

  const procesarFormulario = async () => {
    if (!titulo || !artista) return Alert.alert('Error', 'Título y Artista son obligatorios.');
    const payload = { usuario_id: usuario.id, titulo, artista, genero, url_audio: urlAudio, calificacion };
    try {
        let res = modoEdicion 
            ? await fetch(`${API_URL}/canciones/${modoEdicion}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            : await fetch(`${API_URL}/canciones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Error en el servidor');
        limpiarFormulario();
        cargarDatos();
    } catch (error) { Alert.alert('Error', error.message); }
  };

  // --- NUEVA LÓGICA: ASIGNAR A EXISTENTE ---
  const agregarAPlaylistExistente = async (playlistId) => {
    try {
      const res = await fetch(`${API_URL}/playlists/${playlistId}/canciones-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canciones_ids: seleccionadas })
      });
      
      // Capturamos el error 409 lanzado por el backend para evitar duplicados
      if (res.status === 409) {
        const errorData = await res.json();
        return Alert.alert('Aviso', errorData.error);
      }
      
      if (!res.ok) throw new Error('Error al añadir');
      
      Alert.alert('Éxito', 'Canciones agregadas a la playlist');
      setModalSeleccionarVisible(false);
      setSeleccionadas([]);
    } catch (e) { 
      Alert.alert('Error', e.message); 
    }
  };

  const guardarPlaylist = async () => {
    if (!nombrePlaylist) return Alert.alert('Error', 'Dale un nombre a tu playlist');
    try {
      const res = await fetch(`${API_URL}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuario.id, nombre: nombrePlaylist, descripcion: descPlaylist, foto: fotoPlaylist, canciones_ids: seleccionadas })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error interno del servidor al insertar la playlist');
      }

      Alert.alert('Éxito', 'Playlist creada con estilo');
      setModalPlaylistVisible(false);
      setNombrePlaylist(''); setDescPlaylist(''); setFotoPlaylist(''); setSeleccionadas([]);
      cargarDatos(); // Refrescamos todo para que la nueva playlist aparezca en el menú luego
    } catch (e) { 
      Alert.alert('Error al crear', e.message); 
      console.error(e);
    }
  };

  const borrarSeleccion = async () => {
    try {
      await fetch(`${API_URL}/canciones/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: seleccionadas }) });
      setSeleccionadas([]);
      cargarDatos();
    } catch (error) { Alert.alert('Error', error.message); }
  };

  const generarCartaPlaylist = async () => {
    const tracks = seleccionadas.length > 0 ? canciones.filter(c => seleccionadas.includes(c.id)) : canciones;
    if (tracks.length === 0) return Alert.alert('Lista vacía', 'No hay canciones.');
    
    const html = `
      <div style="background-color: #6C5B7B; padding: 50px; display: flex; font-family: 'Segoe UI', sans-serif; color: #000; width: 1000px; height: 600px; box-sizing: border-box;">
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 3px solid rgba(0,0,0,0.2); padding-right: 40px;">
          <div style="width: 250px; height: 250px; border-radius: 50%; border: 4px solid #9B59B6; background-color: #FFF; overflow: hidden; display: flex; justify-content: center; align-items: center;">
            <img src="${usuario.foto}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <h1 style="font-size: 45px; margin: 30px 0 10px 0; font-weight: 900; text-align: center;">${usuario.nombre}</h1>
          <h2 style="font-size: 25px; margin: 0; font-weight: 600; text-align: center;">${usuario.descripcion || 'Mi Colección Musical'}</h2>
        </div>
        <div style="flex: 2; padding-left: 60px; display: flex; flex-direction: column; justify-content: center;">
          <h1 style="font-size: 55px; margin: 0 0 10px 0; font-weight: 900;">Mi Selección</h1>
          <div style="font-size: 28px; line-height: 1.8;">
            ${tracks.map(c => `<div style="display: flex; align-items: center; margin-bottom: 15px;"><div style="width: 25px; height: 25px; border: 3px solid #000; margin-right: 15px;"></div><div style="border-bottom: 2px solid #000; flex: 1; padding-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><strong>${c.titulo}</strong> - ${c.artista}</div></div>`).join('')}
          </div>
        </div>
      </div>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html, width: 1000, height: 600 });
      await Sharing.shareAsync(uri);
      setSeleccionadas([]); 
    } catch (error) { Alert.alert('Error', 'No se pudo generar la carta'); }
  };

  const playSong = (index) => setIndiceActual(index);
  const nextSong = () => { if (canciones.length > 0) setIndiceActual((indiceActual + 1) % canciones.length); };
  const prevSong = () => { if (canciones.length > 0) setIndiceActual((indiceActual - 1 + canciones.length) % canciones.length); };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={onEditProfile}>
          <Image source={{ uri: usuario.foto }} style={styles.avatar} />
          <View>
            <Text style={styles.appName}><Ionicons name="headset" size={16} color={COLORS.accentSecondary}/> CocoStereo</Text>
            <Text style={styles.userName}>{usuario.nombre}</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 15 }}>
          <TouchableOpacity onPress={onGoToPlaylists}>
            <Ionicons name="albums" size={28} color={COLORS.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout}>
            <Ionicons name="log-out-outline" size={28} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {seleccionadas.length > 0 ? (
        <View style={styles.actionBar}>
          <Text style={styles.actionText}>{seleccionadas.length} seleccionadas</Text>
          <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
            
            {/* EL ÚNICO BOTÓN: Abre el modal selector */}
            <TouchableOpacity style={styles.btnCrearPlaylist} onPress={() => setModalSeleccionarVisible(true)}>
              <View style={styles.circlePlus}>
                <Ionicons name="add" size={18} color={COLORS.accent} />
              </View>
              <Text style={styles.btnCrearPlaylistText}>Playlist</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.accentSecondary }]} onPress={generarCartaPlaylist}>
              <Ionicons name="share-social" size={20} color="#000" />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]} onPress={borrarSeleccion}>
              <Ionicons name="trash" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.form}>
            <AnimatedInput placeholder="Título" value={titulo} onChangeText={setTitulo} />
            <AnimatedInput placeholder="Artista" value={artista} onChangeText={setArtista} />
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <AnimatedInput placeholder="URL externa o archivo local" value={urlAudio} onChangeText={setUrlAudio} style={{ marginBottom: 0 }} />
              </View>
              <TouchableOpacity style={styles.btnUpload} onPress={seleccionarArchivo}>
                <Ionicons name="cloud-upload" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <StarRating calificacion={calificacion} setCalificacion={setCalificacion} />
            <TouchableOpacity style={[styles.btnAñadir, { backgroundColor: modoEdicion ? COLORS.accentSecondary : COLORS.accent }]} onPress={procesarFormulario}>
              <Text style={[styles.btnText, { color: modoEdicion ? '#000' : '#FFF' }]}>{modoEdicion ? 'GUARDAR CAMBIOS' : 'AÑADIR CANCIÓN'}</Text>
            </TouchableOpacity>
        </View>
      )}

      {/* 1. MODAL SELECTOR (El menú principal al dar + Playlist) */}
      <Modal visible={modalSeleccionarVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>AÑADIR A PLAYLIST</Text>
            
            {/* Botón Destacado: Crear Nueva */}
            <TouchableOpacity 
              style={[styles.playlistRow, { borderColor: COLORS.accent, borderStyle: 'dashed', backgroundColor: 'transparent' }]} 
              onPress={() => { setModalSeleccionarVisible(false); setModalPlaylistVisible(true); }}
            >
              <Ionicons name="add-circle" size={24} color={COLORS.accent} style={{ marginRight: 10 }} />
              <Text style={{ color: COLORS.accent, fontWeight: 'bold', fontSize: 16 }}>Nueva Playlist...</Text>
            </TouchableOpacity>

            <FlatList 
              data={playlists} 
              keyExtractor={item => item.id.toString()} 
              style={{ maxHeight: 250, marginTop: 10 }}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.playlistRow} onPress={() => agregarAPlaylistExistente(item.id)}>
                  <Ionicons name="musical-notes" size={20} color={COLORS.accentSecondary} style={{ marginRight: 10 }} />
                  <Text style={{ color: '#FFF', fontSize: 16 }}>{item.nombre}</Text>
                </TouchableOpacity>
            )} />
            
            <TouchableOpacity style={[styles.btnAñadir, { backgroundColor: '#FF3B30', marginTop: 15 }]} onPress={() => setModalSeleccionarVisible(false)}>
              <Text style={styles.btnText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. MODAL PARA CREAR NUEVA PLAYLIST */}
      <Modal visible={modalPlaylistVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>NUEVA PLAYLIST</Text>
            
            {fotoPlaylist ? (
                <Image source={{ uri: fotoPlaylist.startsWith('/') ? `${API_URL}${fotoPlaylist}` : fotoPlaylist }} style={{ width: 100, height: 100, borderRadius: 10, alignSelf: 'center', marginBottom: 15, borderWidth: 2, borderColor: COLORS.accent }} />
            ) : null}

            <AnimatedInput placeholder="Nombre de la Playlist" value={nombrePlaylist} onChangeText={setNombrePlaylist} />
            <AnimatedInput placeholder="Descripción (Opcional)" value={descPlaylist} onChangeText={setDescPlaylist} />
            
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <AnimatedInput placeholder="URL de Portada o Imagen Local" value={fotoPlaylist} onChangeText={setFotoPlaylist} style={{ marginBottom: 0 }} />
              </View>
              <TouchableOpacity style={styles.btnUpload} onPress={seleccionarFotoPlaylist}>
                <Ionicons name="image" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
              <TouchableOpacity style={[styles.btnAñadir, { flex: 1, backgroundColor: COLORS.textSecondary }]} onPress={() => setModalPlaylistVisible(false)}>
                <Text style={styles.btnText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnAñadir, { flex: 1, backgroundColor: COLORS.accent }]} onPress={guardarPlaylist}>
                <Text style={styles.btnText}>CREAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList 
        data={canciones}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 130 }} 
        renderItem={({item, index}) => (
          <View style={[styles.item, indiceActual === index && { borderColor: COLORS.accentSecondary, borderWidth: 2 }]}>
            <Checkbox value={seleccionadas.includes(item.id)} onValueChange={() => toggleSeleccion(item.id)} color={seleccionadas.includes(item.id) ? COLORS.accent : undefined} style={{ marginRight: 15 }} />
            
            <TouchableOpacity style={{ flex: 1 }} onPress={() => playSong(index)}>
              <Text style={{color: indiceActual === index ? COLORS.accentSecondary : '#FFF', fontSize: 18, fontWeight: 'bold'}}>{item.titulo}</Text>
              <Text style={{color: COLORS.textSecondary, marginBottom: 4}}>{item.artista}</Text>
              <StarRating calificacion={item.calificacion} readOnly={true} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => { setTitulo(item.titulo); setArtista(item.artista); setGenero(item.genero || ''); setUrlAudio(item.url_audio || ''); setCalificacion(item.calificacion || 0); setModoEdicion(item.id); }} style={{ padding: 10 }}>
              <Ionicons name="pencil" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      />

      {indiceActual !== null && (
        <AudioPlayer cancionActual={canciones[indiceActual]} onNext={nextSong} onPrev={prevSong} setIsPlayingGlobal={setIsPlayingGlobal} onClose={() => setIndiceActual(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: 'rgba(25, 5, 45, 0.5)', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 45, height: 45, borderRadius: 25, borderWidth: 2, borderColor: COLORS.accent, marginRight: 10 },
  appName: { color: COLORS.accent, fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  userName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: 'bold' },
  form: { backgroundColor: COLORS.cardBackground, padding: 20, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  btnUpload: { backgroundColor: '#4A148C', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', height: 48 },
  btnAñadir: { padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  btnText: { fontWeight: '900', letterSpacing: 1, color: '#FFF' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground, padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.cardBackground, padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: COLORS.accentSecondary },
  actionText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  actionBtn: { padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnCrearPlaylist: { backgroundColor: COLORS.accent, width: 65, height: 65, justifyContent: 'center', alignItems: 'center', borderRadius: 8, padding: 5 },
  circlePlus: { backgroundColor: '#FFF', borderRadius: 15, width: 26, height: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  btnCrearPlaylistText: { color: '#000', fontSize: 11, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.cardBackground, padding: 25, borderRadius: 20, borderWidth: 1, borderColor: COLORS.accent },
  modalTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
  playlistRow: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: 'rgba(25,5,45,0.4)', borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border }
});