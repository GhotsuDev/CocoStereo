import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { itemStyles as styles } from '../styles/itemStyles';
import { COLORS } from '../styles/colors';

export default function SongItem({ cancion, onToggleFavorito, onEliminar }) {
  const escalaAnim = useRef(new Animated.Value(1)).current;
  const esFavorito = cancion.favorito === 1;

  const animarYAlternar = () => {
    Animated.sequence([
      Animated.timing(escalaAnim, { toValue: 1.4, duration: 150, useNativeDriver: true }),
      Animated.spring(escalaAnim, { toValue: 1, friction: 4, useNativeDriver: true })
    ]).start();
    
    onToggleFavorito(cancion.id, esFavorito ? 0 : 1);
  };

  // Lógica de asignación de colores según la paleta solicitada
  const obtenerColorGenero = (genero) => {
    const g = genero?.toLowerCase() || '';
    if (g.includes('pop') || g.includes('rock')) return COLORS.genrePopRock;
    if (g.includes('electrónica') || g.includes('electronica') || g.includes('indie')) return COLORS.genreElectroIndie;
    return COLORS.textSecondary; // Color por defecto
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>{cancion.titulo}</Text>
          <Text style={styles.artista}>{cancion.artista}</Text>
        </View>
        <TouchableOpacity onPress={animarYAlternar} style={styles.favoriteButton}>
          <Animated.View style={{ transform: [{ scale: escalaAnim }] }}>
            <Ionicons 
              name={esFavorito ? "star" : "star-outline"} 
              size={28} 
              color={esFavorito ? COLORS.favoriteActive : COLORS.textSecondary} 
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={[styles.chip, { backgroundColor: obtenerColorGenero(cancion.genero) }]}>
          <Text style={styles.chipText}>{cancion.genero}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>
            <Ionicons name="musical-notes-outline" size={14} /> {cancion.calificacion}/5
          </Text>
          <Text style={styles.statText}>
            <Ionicons name="time-outline" size={14} /> {cancion.duracion_segundos}s
          </Text>
        </View>
      </View>
      
      <TouchableOpacity onPress={() => onEliminar(cancion.id)} style={styles.deleteButton}>
        <Text style={styles.deleteText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );
}