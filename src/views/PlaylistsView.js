import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/colors';
import AudioPlayer from '../components/AudioPlayer';

// ⚠️ TU IP ACTUAL
const API_URL = 'http://192.168.1.103:3000'; 

export default function PlaylistsView({ usuario, onVolver, setIsPlayingGlobal }) {
  const [playlists, setPlaylists] = useState([]);
  const [playlistActiva, setPlaylistActiva] = useState(null);
  const [canciones, setCanciones] = useState([]);
  
  // Estado del Reproductor
  const [indiceActual, setIndiceActual] = useState(null);

  useEffect(() => {
    cargarPlaylists();
  }, []);

  const cargarPlaylists = async () => {
    try {
      const res = await fetch(`${API_URL}/playlists/${usuario.id}`);
      if (res.ok) setPlaylists(await res.json());
    } catch (e) { console.error(e); }
  };

  const abrirPlaylist = async (playlist) => {
    try {
      const res = await fetch(`${API_URL}/playlists/${playlist.id}/canciones`);
      if (res.ok) {
        setCanciones(await res.json());
        setPlaylistActiva(playlist);
      }
    } catch (e) { console.error(e); }
  };

  const cerrarPlaylist = () => {
    setPlaylistActiva(null);
    setCanciones([]);
    setIndiceActual(null);
    setIsPlayingGlobal(false);
  };

  // --- CONTROLES DE REPRODUCCIÓN ---
  const playSong = (index) => setIndiceActual(index);
  const nextSong = () => { if (canciones.length > 0) setIndiceActual((indiceActual + 1) % canciones.length); };
  const prevSong = () => { if (canciones.length > 0) setIndiceActual((indiceActual - 1 + canciones.length) % canciones.length); };

  // ----------------------------------------------------
  // VISTA 1: LISTADO DE PLAYLISTS
  // ----------------------------------------------------
  if (!playlistActiva) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onVolver} style={styles.btnVolver}>
            <Ionicons name="arrow-back" size={28} color={COLORS.accentSecondary} />
          </TouchableOpacity>
          <Text style={styles.tituloSecundario}>MIS PLAYLISTS</Text>
          <View style={{ width: 28 }} />
        </View>

        <FlatList 
          data={playlists}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Aún no tienes playlists. Créalas desde tu biblioteca.</Text>}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.playlistCard} onPress={() => abrirPlaylist(item)}>
              <Ionicons name="albums" size={40} color={COLORS.accent} style={{ marginRight: 15 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.playlistNombre}>{item.nombre}</Text>
                <Text style={styles.playlistDesc}>{item.descripcion || 'Sin descripción'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // ----------------------------------------------------
  // VISTA 2: DENTRO DE UNA PLAYLIST (REPRODUCTOR ACTIVO)
  // ----------------------------------------------------
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={cerrarPlaylist} style={styles.btnVolver}>
          <Ionicons name="arrow-back" size={28} color={COLORS.accentSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.tituloSecundario}>{playlistActiva.nombre}</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{canciones.length} canciones</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <FlatList 
        data={canciones}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 130 }}
        renderItem={({item, index}) => (
          <View style={[styles.item, indiceActual === index && { borderColor: COLORS.accentSecondary, borderWidth: 2 }]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => playSong(index)}>
              <Text style={{color: indiceActual === index ? COLORS.accentSecondary : '#FFF', fontSize: 18, fontWeight: 'bold'}}>{item.titulo}</Text>
              <Text style={{color: COLORS.textSecondary}}>{item.artista}</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {indiceActual !== null && (
        <AudioPlayer 
          cancionActual={canciones[indiceActual]} 
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  btnVolver: { padding: 5 },
  tituloSecundario: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 2, textTransform: 'uppercase' },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
  
  playlistCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground, padding: 20, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border },
  playlistNombre: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  playlistDesc: { color: COLORS.textSecondary, fontSize: 14 },
  
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground, padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border }
});