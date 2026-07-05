import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

export const itemStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    padding: 18,
    borderRadius: 16, // Estilo Cupertino
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoContainer: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  artist: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  favoriteButton: {
    padding: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, // Línea fina nativa de iOS
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20, // Bordes totalmente redondeados
  },
  chipText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  deleteButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  deleteText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  }
});