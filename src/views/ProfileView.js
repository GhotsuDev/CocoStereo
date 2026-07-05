import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/colors';
import AnimatedInput from '../components/AnimatedInput';

export default function ProfileView({ usuario, onVolver, onActualizar }) {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [foto, setFoto] = useState(usuario.foto);
  const [descripcion, setDescripcion] = useState(usuario.descripcion || '');

  const guardarCambios = async () => {
    try {
      // ⚠️ REEMPLAZA LA IP
      const API_URL = 'http://192.168.1.103:3000'; 
      const res = await fetch(`${API_URL}/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, foto, descripcion })
      });
      
      if (res.ok) {
        onActualizar({ ...usuario, nombre, foto, descripcion });
        Alert.alert('Éxito', 'Perfil actualizado con estilo');
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btnVolver} onPress={onVolver}>
        <Ionicons name="arrow-back" size={28} color={COLORS.accentSecondary} />
      </TouchableOpacity>

      <Text style={styles.titulo}>MODIFICAR PERFIL</Text>
      
      <Image source={{ uri: foto }} style={styles.avatarPreview} />

      <View style={styles.form}>
        <Text style={styles.label}>Nombre de usuario</Text>
        <AnimatedInput value={nombre} onChangeText={setNombre} />
        
        <Text style={styles.label}>URL de la Foto</Text>
        <AnimatedInput value={foto} onChangeText={setFoto} />
        
        <Text style={styles.label}>Tu vibra (Descripción)</Text>
        <AnimatedInput value={descripcion} onChangeText={setDescripcion} multiline />

        <TouchableOpacity style={styles.btnGuardar} onPress={guardarCambios}>
          <Text style={styles.textoBtn}>ACTUALIZAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  btnVolver: { marginBottom: 20 },
  titulo: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
  avatarPreview: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.accent, alignSelf: 'center', marginBottom: 20 },
  form: { backgroundColor: COLORS.cardBackground, padding: 20, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border },
  label: { color: COLORS.accentSecondary, marginBottom: 5, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  btnGuardar: { backgroundColor: COLORS.accent, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  textoBtn: { color: '#FFF', fontWeight: 'bold', letterSpacing: 1 }
});