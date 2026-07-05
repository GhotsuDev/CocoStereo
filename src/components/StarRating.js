import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/colors';

export default function StarRating({ calificacion, setCalificacion, readOnly = false }) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((estrella) => (
        <TouchableOpacity 
          key={estrella} 
          disabled={readOnly}
          onPress={() => setCalificacion(estrella)}
        >
          <Ionicons 
            name={estrella <= calificacion ? "star" : "star-outline"} 
            size={readOnly ? 16 : 28} 
            color={estrella <= calificacion ? COLORS.starActive : COLORS.starInactive} 
            style={styles.star}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  star: { marginRight: 5 }
});