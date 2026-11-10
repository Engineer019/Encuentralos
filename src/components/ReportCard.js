import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, getCategory } from '../theme';

const daysAgo = (iso) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'hoy';
  if (d === 1) return 'ayer';
  return `hace ${d} días`;
};

const STATUS = {
  match: { text: 'Posible coincidencia', color: colors.primary },
  recovered: { text: 'Recuperado', color: colors.found },
};

export default function ReportCard({ report }) {
  const cat = getCategory(report.category);
  const isLost = report.type === 'lost';
  const accent = isLost ? colors.lost : colors.found;
  const status = STATUS[report.status];

  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      {report.photo ? (
        <Image source={{ uri: report.photo }} style={styles.thumb} />
      ) : (
        <LinearGradient
          colors={isLost ? gradients.lost : gradients.found}
          style={[styles.thumb, styles.placeholder]}
        >
          <Text style={styles.initial}>{report.title.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
      )}

      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={[styles.badge, { color: accent }]}>
            {isLost ? 'PERDIDO' : 'ENCONTRADO'}
          </Text>
          <Text style={styles.owner}>{report.mine ? 'Tuyo' : 'Comunidad'}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {report.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {report.place} · {daysAgo(report.date)}
        </Text>
        {status && (
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: status.color }]} />
            <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  thumb: { width: 64, height: 64, borderRadius: 14 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  info: { flex: 1, marginLeft: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  badge: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  owner: { fontSize: 11, color: colors.muted },
  title: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  status: { fontSize: 12, fontWeight: '600' },
});