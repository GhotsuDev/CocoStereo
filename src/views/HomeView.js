import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, Alert, Modal, Platform, KeyboardAvoidingView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../styles/colors';
import StarRating from '../components/StarRating';
import AudioPlayer from '../components/AudioPlayer';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000';
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) return `http://${debuggerHost.split(':')[0]}:3000`;
  return 'http://172.30.66.91:3000'; 
};
const API_URL = getApiUrl();
const obtenerImagenUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/150/1A2417/FF8C00?text=User';
  return url.startsWith('/') ? `${API_URL}${url}` : url;
};

export default function HomeView({ usuario, onLogout, onEditProfile, setIsPlayingGlobal, onGoToPlaylists }) {
  const [canciones, setCanciones] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [indiceActual, setIndiceActual] = useState(null);
  
  const [modoEdicion, setModoEdicion] = useState(null); 
  const [titulo, setTitulo] = useState('');
  const [artista, setArtista] = useState('');
  const [genero, setGenero] = useState('');
  const [urlAudio, setUrlAudio] = useState('');
  const [calificacion, setCalificacion] = useState(0);

  const [modalSeleccionarVisible, setModalSeleccionarVisible] = useState(false);
  const [modalPlaylistVisible, setModalPlaylistVisible] = useState(false);
  const [nombrePlaylist, setNombrePlaylist] = useState('');
  
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
    if (seleccionadas.includes(id)) setSeleccionadas(seleccionadas.filter(item => item !== id));
    else setSeleccionadas([...seleccionadas, id]);
  };

  const seleccionarArchivo = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!res.canceled && res.assets.length > 0) {
        const file = res.assets[0];
        const formData = new FormData();
        Alert.alert('Subiendo...', 'Espera...');
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
          Alert.alert('Éxito', 'Archivo cargado.');
        } else { Alert.alert('Error', 'Rechazado.'); }
      }
    } catch (error) { Alert.alert('Error', 'Problema con el archivo.'); }
  };

  const procesarFormulario = async () => {
    if (!titulo || !artista) return Alert.alert('Error', 'Título y Artista son obligatorios.');
    const payload = { usuario_id: usuario.id, titulo, artista, genero, url_audio: urlAudio, calificacion };
    try {
        let res = modoEdicion 
            ? await fetch(`${API_URL}/canciones/${modoEdicion}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            : await fetch(`${API_URL}/canciones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Error en el servidor');
        
        // Limpiamos el formulario y recargamos la lista
        setTitulo(''); setArtista(''); setGenero(''); setUrlAudio(''); setCalificacion(0); setModoEdicion(null);
        cargarDatos();
    } catch (error) { Alert.alert('Error', error.message); }
  };


const confirmarEliminarCancion = (id) => {
    if (Platform.OS === 'web') {
      if (window.confirm("¿Estás seguro de eliminar esta canción para siempre?")) eliminarCancionGlobal(id);
    } else {
      Alert.alert('Eliminar Canción', '¿Seguro que deseas eliminar esta canción de tu biblioteca? Se borrará también de tus playlists.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminarCancionGlobal(id) }
      ]);
    }
  };

  const eliminarCancionGlobal = async (id) => {
    try {
      const res = await fetch(`${API_URL}/canciones/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (canciones[indiceActual]?.id === id) setIndiceActual(null); // Apaga la música si borras lo que está sonando
        cargarDatos();
      }
    } catch (error) { console.error(error); }
  };

  const agregarAPlaylistExistente = async (playlistId) => {
    try {
      const res = await fetch(`${API_URL}/playlists/${playlistId}/canciones-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canciones_ids: seleccionadas })
      });
      if (!res.ok) throw new Error('Error al añadir');
      Alert.alert('Éxito', 'Canciones agregadas a la playlist');
      setModalSeleccionarVisible(false);
      setSeleccionadas([]);
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const guardarPlaylistNueva = async () => {
    if (!nombrePlaylist) return Alert.alert('Error', 'Dale un nombre');
    try {
      const res = await fetch(`${API_URL}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuario.id, nombre: nombrePlaylist, canciones_ids: seleccionadas })
      });
      if (res.ok) {
        Alert.alert('Éxito', 'Playlist creada');
        setModalPlaylistVisible(false);
        setNombrePlaylist('');
        setSeleccionadas([]);
        cargarDatos();
      }
    } catch (e) { console.error(e); }
  };

  const playSong = (index) => setIndiceActual(index);
  const nextSong = () => { if (canciones.length > 0) setIndiceActual((indiceActual + 1) % canciones.length); };
  const prevSong = () => { if (canciones.length > 0) setIndiceActual((indiceActual - 1 + canciones.length) % canciones.length); };

  const renderFormulario = () => (
    <View style={{ paddingBottom: 20 }}>
      {seleccionadas.length > 0 ? (
        <View style={styles.actionBar}>
          <Text style={styles.actionText}>{seleccionadas.length} seleccionadas</Text>
          <TouchableOpacity style={styles.btnAccionMasiva} onPress={() => setModalSeleccionarVisible(true)}>
            <Ionicons name="folder-open" size={18} color="#000" />
            <Text style={{color: '#000', fontWeight: 'bold', marginLeft: 8}}>Añadir a Playlist</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
  <TextInput 
    style={styles.inputNeumorphic} 
    placeholder="Título" 
    value={titulo} 
    onChangeText={setTitulo} 
    placeholderTextColor={COLORS.textSecondary}
  />
  <TextInput 
    style={styles.inputNeumorphic} 
    placeholder="Artista" 
    value={artista} 
    onChangeText={setArtista} 
    placeholderTextColor={COLORS.textSecondary}
  />

  {/* Contenedor en fila para la URL y el botón */}
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
    <TextInput 
      style={[styles.inputNeumorphic, { flex: 1, marginBottom: 0, marginRight: 10 }]} 
      placeholder="URL de audio" 
      value={urlAudio} 
      onChangeText={setUrlAudio} 
      placeholderTextColor={COLORS.textSecondary}
    />
    <TouchableOpacity 
      style={[styles.btnUpload, { height: 50, width: 50, justifyContent: 'center', alignItems: 'center', color: COLORS }]} 
      onPress={seleccionarArchivo}
    >
      <Ionicons name="cloud-upload" size={24} color={COLORS.accent} />
    </TouchableOpacity>
  </View>

  <StarRating calificacion={calificacion} setCalificacion={setCalificacion} />
  
  <TouchableOpacity style={styles.btnAction} onPress={procesarFormulario}>
    <Text style={styles.btnActionText}>{modoEdicion ? 'GUARDAR' : 'AÑADIR CANCIÓN'}</Text>
  </TouchableOpacity>
</View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      
      <View style={styles.headerTopBar}>
        <TouchableOpacity style={styles.userInfo} onPress={onEditProfile}>
          <Image source={{ uri: obtenerImagenUrl(usuario.foto) }} style={styles.avatar} />
          <View>
            <Text style={styles.appName}><Ionicons name="musical-notes" size={14} color={COLORS.accent}/> CocoStereo</Text>
            <Text style={styles.userName}>{usuario.nombre}</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 15 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={onGoToPlaylists}>
            <Ionicons name="albums" size={24} color={COLORS.accent} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList 
        data={canciones}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderFormulario()} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }} 
        renderItem={({item, index}) => (
          <View style={[styles.item, indiceActual === index && { borderColor: COLORS.accent }]}>
            <Checkbox value={seleccionadas.includes(item.id)} onValueChange={() => toggleSeleccion(item.id)} color={seleccionadas.includes(item.id) ? COLORS.accent : undefined} style={{ marginRight: 15 }} />
            <TouchableOpacity style={{ flex: 1 }} onPress={() => playSong(index)}>
              <Text style={{color: indiceActual === index ? COLORS.accent : COLORS.text, fontSize: 16, fontWeight: 'bold'}}>{item.titulo}</Text>
              <Text style={{color: COLORS.textSecondary, marginBottom: 4, fontSize: 12}}>{item.artista}</Text>
              <StarRating calificacion={item.calificacion} readOnly={true} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => { 
                setTitulo(item.titulo); 
                setArtista(item.artista); 
                setGenero(item.genero || ''); 
                setUrlAudio(item.url_audio || ''); 
                setCalificacion(item.calificacion || 0); 
                setModoEdicion(item.id); 
              }} 
              style={{ padding: 10 }}
            >
              <Ionicons name="pencil" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => confirmarEliminarCancion(item.id)} style={{ padding: 10 }}>
                <Ionicons name="trash" size={20} color="#FF3B30" />
              </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalSeleccionarVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>AÑADIR A PLAYLIST</Text>
            
            <TouchableOpacity 
              style={styles.playlistRowNuevo} 
              onPress={() => { setModalSeleccionarVisible(false); setModalPlaylistVisible(true); }}
            >
              <Ionicons name="add-circle" size={24} color={COLORS.accent} style={{ marginRight: 10 }} />
              <Text style={{ color: COLORS.accent, fontWeight: 'bold', fontSize: 16 }}>Crear Nueva Playlist</Text>
            </TouchableOpacity>

            <FlatList 
              data={playlists} 
              keyExtractor={item => item.id.toString()} 
              style={{ maxHeight: 250, marginTop: 10 }}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.playlistRow} onPress={() => agregarAPlaylistExistente(item.id)}>
                  <Ionicons name="folder" size={20} color={COLORS.primaryLight} style={{ marginRight: 10 }} />
                  <Text style={{ color: COLORS.text, fontSize: 16 }}>{item.nombre}</Text>
                </TouchableOpacity>
            )} />
            
            <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalSeleccionarVisible(false)}>
              <Text style={styles.btnCancelarText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalPlaylistVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>NUEVA PLAYLIST</Text>
            <TextInput style={styles.inputNeumorphic} placeholder="Nombre de la Playlist" value={nombrePlaylist} onChangeText={setNombrePlaylist} placeholderTextColor={COLORS.textSecondary} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
              <TouchableOpacity style={[styles.btnAction, { flex: 1, backgroundColor: COLORS.surfaceInset }]} onPress={() => setModalPlaylistVisible(false)}>
                <Text style={{color: COLORS.text, fontWeight: 'bold'}}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnAction, { flex: 1 }]} onPress={guardarPlaylistNueva}>
                <Text style={styles.btnActionText}>CREAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {indiceActual !== null && (
        <AudioPlayer cancionActual={canciones[indiceActual]} onNext={nextSong} onPrev={prevSong} setIsPlayingGlobal={setIsPlayingGlobal} onClose={() => setIndiceActual(null)} usuario={usuario}/>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 20 },
  headerTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, zIndex: 100 },
  userInfo: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: COLORS.surface, borderRadius: 30, borderWidth: 1, borderColor: COLORS.borderHighlight, shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 5 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  appName: { color: COLORS.accent, fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  userName: { color: COLORS.text, fontSize: 13, fontWeight: 'bold' },
  iconBtn: { backgroundColor: COLORS.surface, padding: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.borderHighlight, shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  form: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: COLORS.borderHighlight, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  inputNeumorphic: { backgroundColor: COLORS.surfaceInset, color: COLORS.text, padding: 16, fontSize: 15, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderShadow, marginBottom: 15 },
  btnAction: { backgroundColor: COLORS.accent, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 15, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  btnActionText: { color: '#000', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderHighlight },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: COLORS.borderHighlight },
  actionText: { color: COLORS.text, fontWeight: 'bold', fontSize: 16 },
  btnAccionMasiva: { backgroundColor: COLORS.accent, flexDirection: 'row', padding: 12, borderRadius: 10, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.surface, padding: 25, borderRadius: 20, borderWidth: 1, borderColor: COLORS.borderHighlight },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  playlistRowNuevo: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.accent, borderStyle: 'dashed' },
  playlistRow: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: COLORS.surfaceInset, borderRadius: 10, marginBottom: 10 },
  btnCancelar: { backgroundColor: COLORS.surfaceInset, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: COLORS.borderShadow },
  btnCancelarText: { color: COLORS.text, fontWeight: 'bold' }
});