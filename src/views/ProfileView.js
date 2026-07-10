import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../styles/colors';
import AnimatedInput from '../components/AnimatedInput';
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

export default function ProfileView({ usuario, onVolver, onUpdateUser }) {
  // Inicializamos los estados con los datos actuales del usuario
  const [nombre, setNombre] = useState(usuario.nombre || '');
  const [descripcion, setDescripcion] = useState(usuario.descripcion || '');
  const [foto, setFoto] = useState(usuario.foto || '');

  // Lógica para subir imagen local
  const seleccionarFotoPerfil = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsEditing: true, 
        aspect: [1, 1], 
        quality: 0.8 
      });

      if (!result.canceled) {
        const file = result.assets[0];
        const formData = new FormData();
        Alert.alert('Subiendo...', 'Espera mientras procesamos tu nueva foto...');

        if (Platform.OS === 'web') {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          formData.append('archivo', blob, file.name || 'perfil.jpg');
        } else {
          formData.append('archivo', { 
            uri: file.uri, 
            name: file.fileName || 'perfil.jpg', 
            type: file.mimeType || 'image/jpeg' 
          });
        }

        const uploadRes = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          setFoto(data.url); 
          Alert.alert('Éxito', 'Foto de perfil cargada correctamente.');
        } else { 
          Alert.alert('Error', 'El backend rechazó el archivo.'); 
        }
      }
    } catch (error) { 
      console.error(error); 
      Alert.alert('Error', 'Hubo un problema al leer la imagen.'); 
    }
  };

  const guardarCambios = async () => {
    if (!nombre) return Alert.alert('Error', 'El nombre no puede estar vacío.');

    try {
      const res = await fetch(`${API_URL}/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion, foto })
      });

      if (res.ok) {
        Alert.alert('¡Hecho!', 'Tu perfil ha sido actualizado con estilo.');
        // Esta es la línea mágica que actualiza toda la app en tiempo real
        onUpdateUser({ ...usuario, nombre, descripcion, foto });
      } else {
        throw new Error('No se pudo actualizar el perfil');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const obtenerImagenUrl = (url) => {
    return url ? (url.startsWith('/') ? `${API_URL}${url}` : url) : 'https://via.placeholder.com/150/110022/B026FF?text=No+Cover';
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onVolver} style={styles.btnVolver}>
            <Ionicons name="arrow-back" size={28} color={COLORS.accentSecondary} />
          </TouchableOpacity>
          <Text style={styles.tituloSecundario}>MI PERFIL</Text>
          <View style={{ width: 46 }} /> 
        </View>

        {/* AVATAR PREVIEW */}
        <View style={styles.avatarContainer}>
          <Image source={{ uri: obtenerImagenUrl(foto) }} style={styles.avatarImage} />
        </View>

        {/* FORMULARIO */}
        <View style={styles.form}>
          <AnimatedInput placeholder="Nombre de Usuario" value={nombre} onChangeText={setNombre} />
          <AnimatedInput placeholder="Frase o Descripción" value={descripcion} onChangeText={setDescripcion} />
          
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <AnimatedInput placeholder="URL de la Foto o Local" value={foto} onChangeText={setFoto} style={{ marginBottom: 0 }} />
            </View>
            <TouchableOpacity style={styles.btnUploadSquare} onPress={seleccionarFotoPerfil}>
              <Ionicons name="image" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btnGuardar} onPress={guardarCambios}>
            <Text style={styles.btnGuardarText}>GUARDAR CAMBIOS</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, position: 'relative', width: '100%' },
  btnVolver: { padding: 8, backgroundColor: 'rgba(25, 5, 45, 0.6)', borderRadius: 10, borderWidth: 1, borderColor: '#4A148C', justifyContent: 'center', alignItems: 'center' },
  tituloSecundario: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 2, position: 'absolute', left: 0, right: 0, textAlign: 'center', zIndex: -1 },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatarImage: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: COLORS.accent, backgroundColor: COLORS.cardBackground },
  form: { backgroundColor: 'rgba(25, 5, 45, 0.8)', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  btnUploadSquare: { backgroundColor: '#4A148C', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', height: 48 },
  btnGuardar: { backgroundColor: COLORS.accent, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnGuardarText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});