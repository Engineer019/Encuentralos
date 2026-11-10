import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ReportCard from '../components/ReportCard';
import { colors, gradients, getCategory } from '../theme';

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'lost', label: 'Perdidos' },
  { key: 'found', label: 'Encontrados' },
];

const STATUS_LABEL = {
  active: 'Activo',
  match: 'Posible coincidencia',
  recovered: 'Recuperado',
};

const formatLong = (iso) =>
  new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function PhoneHomeScreen({ reports, onSimulate, onReset, onDelete }) {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const visible = reports.filter((r) => filter === 'all' || r.type === filter);
  const recovered = reports.filter((r) => r.mine && r.status === 'recovered').length;
  const active = reports.filter((r) => r.mine && r.status !== 'recovered').length;
  const community = reports.filter((r) => !r.mine).length;

  const handleSimulate = () => {
    const ok = onSimulate();
    if (!ok) {
      Alert.alert(
        'Primero publica un reporte',
        'Publica un objeto perdido y luego simula que otra persona lo encontró.'
      );
    }
  };

  const handleReset = () => {
    Alert.alert('Reiniciar demo', '¿Borrar todos los reportes y coincidencias?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: onReset },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Eliminar reporte', '¿Seguro que quieres eliminar este reporte?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          onDelete(selected.id);
          setSelected(null);
        },
      },
    ]);
  };

  const isLost = selected ? selected.type === 'lost' : true;
  const accent = isLost ? colors.lost : colors.found;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient
          colors={gradients.main}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.stats}
        >
          <View style={styles.stat}>
            <Text style={styles.statNum}>{recovered}</Text>
            <Text style={styles.statLabel}>Recuperados</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{active}</Text>
            <Text style={styles.statLabel}>Perdidos activos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{community}</Text>
            <Text style={styles.statLabel}>Encontrados</Text>
          </View>
        </LinearGradient>

        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, filter === f.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sin reportes</Text>
            <Text style={styles.emptyText}>Publica el primero en la pestaña Publicar.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.tapHint}>Toca un reporte para ver todos sus detalles</Text>
            {visible.map((r) => (
              <Pressable key={r.id} onPress={() => setSelected(r)}>
                <ReportCard report={r} />
              </Pressable>
            ))}
          </>
        )}

        <Pressable onPress={handleSimulate} style={styles.demoBtn}>
          <Text style={styles.demoText}>Simular que otra persona lo encontró</Text>
        </Pressable>

        <Pressable onPress={handleReset}>
          <Text style={styles.reset}>Reiniciar demo</Text>
        </Pressable>
      </ScrollView>

      {/* Detalle del reporte */}
      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selected.photo ? (
                  <Image source={{ uri: selected.photo }} style={styles.bigPhoto} />
                ) : (
                  <LinearGradient
                    colors={isLost ? gradients.lost : gradients.found}
                    style={[styles.bigPhoto, styles.bigPlaceholder]}
                  >
                    <Text style={styles.bigInitial}>
                      {selected.title.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}

                <Text style={[styles.detailBadge, { color: accent }]}>
                  {isLost ? 'PERDIDO' : 'ENCONTRADO'}
                </Text>
                <Text style={styles.detailTitle}>{selected.title}</Text>

                <DetailRow label="Lugar" value={selected.place} />
                <DetailRow label="Fecha" value={formatLong(selected.date)} />
                <DetailRow label="Estado" value={STATUS_LABEL[selected.status] || 'Activo'} />
                <DetailRow
                  label="Publicado por"
                  value={selected.mine ? 'Tú' : 'Otra persona'}
                />
                {selected.description ? (
                  <DetailRow label="Descripción" value={selected.description} />
                ) : null}
                {selected.mine && selected.contact ? (
                  <DetailRow label="Tu contacto" value={selected.contact} />
                ) : null}

                <View style={styles.sheetActions}>
                  {selected.mine && (
                    <Pressable style={{ flex: 1, marginRight: 8 }} onPress={handleDelete}>
                      <View style={styles.deleteBtn}>
                        <Text style={styles.deleteText}>Eliminar</Text>
                      </View>
                    </Pressable>
                  )}
                  <Pressable style={{ flex: 1 }} onPress={() => setSelected(null)}>
                    <LinearGradient colors={gradients.main} style={styles.closeBtn}>
                      <Text style={styles.closeText}>Cerrar</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 30 },
  stats: {
    flexDirection: 'row',
    borderRadius: 22,
    paddingVertical: 18,
    marginBottom: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  filters: { flexDirection: 'row', marginBottom: 14 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  tapHint: { color: colors.muted, fontSize: 12, marginBottom: 10 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: colors.muted, textAlign: 'center', marginTop: 6 },
  demoBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  demoText: { color: colors.primary, fontWeight: 'bold' },
  reset: { color: colors.muted, textAlign: 'center', marginTop: 16, fontSize: 12 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  bigPhoto: { width: '100%', height: 220, borderRadius: 18 },
  bigPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  bigInitial: { color: '#fff', fontSize: 64, fontWeight: 'bold' },
  detailBadge: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginTop: 14 },
  detailTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold', marginTop: 4, marginBottom: 8 },
  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: { color: colors.muted, fontSize: 12 },
  detailValue: { color: colors.text, fontSize: 15, marginTop: 2, lineHeight: 21 },
  sheetActions: { flexDirection: 'row', marginTop: 18, marginBottom: 10 },
  deleteBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteText: { color: colors.danger, fontWeight: 'bold' },
  closeBtn: { borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  closeText: { color: '#fff', fontWeight: 'bold' },
});