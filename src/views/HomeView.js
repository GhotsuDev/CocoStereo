import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, Alert, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from '../styles/colors';
import AnimatedInput from '../components/AnimatedInput';
import StarRating from '../components/StarRating';
import AudioPlayer from '../components/AudioPlayer'; // NUEVO REPRODUCTOR
import Constants from 'expo-constants';


const getApiUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000';
  
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0]; // Extrae solo la IP
    return `http://${ip}:3000`;
  }
  return 'http://192.168.1.103:3000'; // Fallback de seguridad
};

const API_URL = getApiUrl();

export default function HomeView({ usuario, onLogout, onEditProfile, setIsPlayingGlobal }) {
  const [canciones, setCanciones] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  
  // Estado del Reproductor
  const [indiceActual, setIndiceActual] = useState(null);
  
  // Estados del Formulario
  const [modoEdicion, setModoEdicion] = useState(null); 
  const [titulo, setTitulo] = useState('');
  const [artista, setArtista] = useState('');
  const [genero, setGenero] = useState('');
  const [urlAudio, setUrlAudio] = useState('');
  const [calificacion, setCalificacion] = useState(0);

  // Estados para el Modal de Crear Playlist
  const [modalPlaylistVisible, setModalPlaylistVisible] = useState(false);
  const [nombrePlaylist, setNombrePlaylist] = useState('');
  const [descPlaylist, setDescPlaylist] = useState('');

  const cargarCanciones = async () => {
    try {
      const res = await fetch(`${API_URL}/canciones/${usuario.id}`);
      if (res.ok) setCanciones(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { cargarCanciones(); }, []);

  // --- SUBIDA DE ARCHIVO LOCAL ---
  const seleccionarArchivo = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!res.canceled && res.assets.length > 0) {
        const file = res.assets[0];
        
        const formData = new FormData();

        if (Platform.OS === 'web') {
        // En la web, Expo guarda el objeto binario real en 'file'
        formData.append('archivo', file.file);
        } else {
        // En móvil se usa el URI nativo
        formData.append('archivo', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'audio/mpeg'
        });
        }
        
        

        Alert.alert('Subiendo...', 'Espera un momento');
        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          setUrlAudio(data.url); // Recibimos /uploads/12345.mp3
          Alert.alert('Éxito', 'Archivo cargado. Termina de guardar la canción.');
        } else {
          Alert.alert('Error', 'No se pudo subir el archivo');
        }
      }
    } catch (error) { console.log(error); }
  };

  const limpiarFormulario = () => {
    setTitulo(''); setArtista(''); setGenero(''); setUrlAudio(''); setCalificacion(0); setModoEdicion(null);
  };

  const procesarFormulario = async () => {
    if (!titulo || !artista) return Alert.alert('Error', 'Título y Artista son obligatorios.');
    const payload = { usuario_id: usuario.id, titulo, artista, genero, url_audio: urlAudio, calificacion };
    try {
        let res = modoEdicion 
            ? await fetch(`${API_URL}/canciones/${modoEdicion}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            : await fetch(`${API_URL}/canciones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        
        if (!res.ok) throw new Error('Error en el servidor');
        limpiarFormulario();
        cargarCanciones();
    } catch (error) { Alert.alert('Error', error.message); }
  };

  // NUEVO: Función para guardar la playlist en la BD
  const guardarPlaylist = async () => {
    if (!nombrePlaylist) return Alert.alert('Error', 'Dale un nombre a tu playlist');
    try {
      const res = await fetch(`${API_URL}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuario.id,
          nombre: nombrePlaylist,
          descripcion: descPlaylist,
          canciones_ids: seleccionadas // Los IDs de las canciones que marcaste
        })
      });
      if (res.ok) {
        Alert.alert('Éxito', 'Playlist creada con estilo');
        setModalPlaylistVisible(false);
        setNombrePlaylist('');
        setDescPlaylist('');
        setSeleccionadas([]); // Limpiamos selección
      }
    } catch (e) { Alert.alert('Error', 'No se pudo crear'); }
  };

  // --- CONTROLES DE REPRODUCCIÓN ---
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
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.accent }]} onPress={() => setModalPlaylistVisible(true)}>
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Playlist</Text>
            </TouchableOpacity>
          <TouchableOpacity onPress={onLogout}>
            <Ionicons name="log-out-outline" size={28} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

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
          <Text style={[styles.btnText, { color: modoEdicion ? '#000' : '#FFF' }]}>{modoEdicion ? 'GUARDAR' : 'AÑADIR'}</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL PARA CREAR PLAYLIST */}
      <Modal visible={modalPlaylistVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>NUEVA PLAYLIST</Text>
            <AnimatedInput placeholder="Nombre de la Playlist" value={nombrePlaylist} onChangeText={setNombrePlaylist} />
            <AnimatedInput placeholder="Descripción (Opcional)" value={descPlaylist} onChangeText={setDescPlaylist} />
            
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
        contentContainerStyle={{ paddingBottom: 130 }} // Espacio para el reproductor flotante
        renderItem={({item, index}) => (
          <View style={[styles.item, indiceActual === index && { borderColor: COLORS.accentSecondary, borderWidth: 2 }]}>
            <Checkbox value={seleccionadas.includes(item.id)} onValueChange={() => toggleSeleccion(item.id)} color={seleccionadas.includes(item.id) ? COLORS.accent : undefined} style={{ marginRight: 15 }} />
            
            <TouchableOpacity style={{ flex: 1 }} onPress={() => playSong(index)}>
              <Text style={{color: indiceActual === index ? COLORS.accentSecondary : '#FFF', fontSize: 18, fontWeight: 'bold'}}>{item.titulo}</Text>
              <Text style={{color: COLORS.textSecondary}}>{item.artista}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => {
              setTitulo(item.titulo); setArtista(item.artista); setGenero(item.genero || ''); setUrlAudio(item.url_audio || ''); setCalificacion(item.calificacion || 0); setModoEdicion(item.id);
            }} style={{ padding: 10 }}>
              <Ionicons name="pencil" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* REPRODUCTOR FLOTANTE */}
      {/* REPRODUCTOR CON PROP ONCLOSE */}
      {indiceActual !== null && (
        <AudioPlayer 
          cancionActual={canciones[indiceActual]} 
          onNext={nextSong} 
          onPrev={prevSong} 
          setIsPlayingGlobal={setIsPlayingGlobal} 
          onClose={() => setIndiceActual(null)} // Cierra el reproductor
        />
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
  btnText: { fontWeight: '900', letterSpacing: 1 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground, padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.cardBackground, padding: 25, borderRadius: 20, borderWidth: 1, borderColor: COLORS.accent },
  modalTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, letterSpacing: 2 }

});