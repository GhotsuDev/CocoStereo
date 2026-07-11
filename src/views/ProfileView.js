import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Platform, KeyboardAvoidingView, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../styles/colors';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000';
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) return `http://${debuggerHost.split(':')[0]}:3000`;
  return 'http://172.30.66.91:3000'; 
};
const API_URL = getApiUrl();

export default function ProfileView({ usuario, onVolver, onUpdateUser }) {
  const [nombre, setNombre] = useState(usuario.nombre || '');
  const [descripcion, setDescripcion] = useState(usuario.descripcion || '');
  const [foto, setFoto] = useState(usuario.foto || '');

  const seleccionarFotoPerfil = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled) {
        const file = result.assets[0];
        const formData = new FormData();
        Alert.alert('Subiendo...', 'Espera...');
        if (Platform.OS === 'web') {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          formData.append('archivo', blob, file.name || 'perfil.jpg');
        } else {
          formData.append('archivo', { uri: file.uri, name: file.fileName || 'perfil.jpg', type: file.mimeType || 'image/jpeg' });
        }
        const uploadRes = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          setFoto(data.url); 
        }
      }
    } catch (error) { console.error(error); }
  };

  const guardarCambios = async () => {
    if (!nombre) return Alert.alert('Error', 'El nombre no puede estar vacío.');
    try {
      const res = await fetch(`${API_URL}/usuarios/${usuario.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, descripcion, foto })
      });
      if (res.ok) {
        Alert.alert('¡Hecho!', 'Perfil actualizado.');
        onUpdateUser({ ...usuario, nombre, descripcion, foto });
      }
    } catch (error) { Alert.alert('Error', error.message); }
  };

  const obtenerImagenUrl = (url) => url ? (url.startsWith('/') ? `${API_URL}${url}` : url) : 'https://via.placeholder.com/150/1A2417/FF8C00?text=User';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={onVolver} style={styles.btnVolver}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.tituloSecundario}>MI PERFIL</Text>
          <View style={{ width: 46 }} /> 
        </View>

        <View style={styles.avatarContainer}>
          <Image source={{ uri: obtenerImagenUrl(foto) }} style={styles.avatarImage} />
        </View>

        <View style={styles.form}>
          <TextInput style={styles.inputNeumorphic} placeholder="Nombre de Usuario" value={nombre} onChangeText={setNombre} placeholderTextColor={COLORS.textSecondary} />
          <TextInput style={styles.inputNeumorphic} placeholder="Descripción" value={descripcion} onChangeText={setDescripcion} placeholderTextColor={COLORS.textSecondary} />
          
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <TextInput style={[styles.inputNeumorphic, {marginBottom: 0}]} placeholder="URL de la Foto" value={foto} onChangeText={setFoto} placeholderTextColor={COLORS.textSecondary} />
            </View>
            <TouchableOpacity style={styles.btnUpload} onPress={seleccionarFotoPerfil}>
              <Ionicons name="image" size={24} color={COLORS.background} />
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
  btnVolver: { padding: 10, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderHighlight, shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  tituloSecundario: { fontSize: 18, fontWeight: '900', color: COLORS.text, letterSpacing: 2, position: 'absolute', left: 0, right: 0, textAlign: 'center', zIndex: -1 },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatarImage: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: COLORS.accent, backgroundColor: COLORS.surfaceInset },
  form: { backgroundColor: COLORS.surface, padding: 25, borderRadius: 20, borderWidth: 1, borderColor: COLORS.borderHighlight, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  inputNeumorphic: { backgroundColor: COLORS.surfaceInset, color: COLORS.text, padding: 16, fontSize: 15, borderRadius: 10, borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 1, borderRightWidth: 1, borderTopColor: COLORS.borderShadow, borderLeftColor: COLORS.borderShadow, borderBottomColor: COLORS.borderHighlight, borderRightColor: COLORS.borderHighlight, marginBottom: 15 },
  btnUpload: { backgroundColor: COLORS.primaryLight, padding: 14, borderRadius: 10, justifyContent: 'center', alignItems: 'center', height: 52 },
  btnGuardar: { backgroundColor: COLORS.accent, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  btnGuardarText: { color: COLORS.background, fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});