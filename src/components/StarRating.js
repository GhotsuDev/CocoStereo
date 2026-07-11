import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/colors';

export default function StarRating({ calificacion, setCalificacion, readOnly = false }) {
  const renderStar = (index) => {
    const isFilled = index <= calificacion;
    return (
      <TouchableOpacity 
        key={index} 
        onPress={() => !readOnly && setCalificacion(index)}
        activeOpacity={readOnly ? 1 : 0.7}
      >
        <Ionicons 
          name={isFilled ? "star" : "star-outline"} 
          size={readOnly ? 16 : 28} 
          color={COLORS.accent} // 🟢 AMARILLO DEL SISTEMA
          style={styles.star}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map(renderStar)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  star: { marginHorizontal: 2 }
});