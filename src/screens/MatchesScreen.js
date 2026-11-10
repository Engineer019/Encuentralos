import React from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, getCategory } from '../theme';

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

const RANK = { pending: 0, claimed: 1, confirmed: 2, rejected: 3 };

const STATUS = {
  pending: { text: 'Posible coincidencia', color: colors.primary },
  claimed: { text: 'En contacto', color: colors.lost },
  confirmed: { text: 'Recuperado', color: colors.found },
  rejected: { text: 'Descartada', color: colors.muted },
};

function Row({ report, label, color, gradient }) {
  return (
    <View style={styles.row}>
      {report.photo ? (
        <Image source={{ uri: report.photo }} style={styles.rowPhoto} />
      ) : (
        <LinearGradient colors={gradient} style={[styles.rowPhoto, styles.rowPlaceholder]}>
          <Text style={styles.rowInitial}>{report.title.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color }]}>
          {label} · {report.mine ? 'Tuyo' : 'Otra persona'}
        </Text>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {report.title}
        </Text>
        <Text style={styles.rowPlace} numberOfLines={1}>
          {report.place} · {fmtDate(report.date)}
        </Text>
        {report.description ? (
          <Text style={styles.rowDesc} numberOfLines={3}>
            {report.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function MatchesScreen({ matches, reports, onAction }) {
  const sorted = [...matches].sort((a, b) => RANK[a.status] - RANK[b.status]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Coincidencias</Text>

      {sorted.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sin coincidencias</Text>
          <Text style={styles.emptyText}>
            Cuando alguien publique algo parecido, aparecerá aquí y en el reloj.
          </Text>
        </View>
      )}

      {sorted.map((m) => {
        const lost = reports.find((r) => r.id === m.lostId);
        const found = reports.find((r) => r.id === m.foundId);
        if (!lost || !found) return null;

        const other = lost.mine ? found : lost;
        const status = STATUS[m.status];

        return (
          <View key={m.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>
            </View>

            {m.status === 'pending' && (
              <Text style={styles.note}>
                La app solo sugiere coincidencias. Compara las fotos y la descripción: tú decides
                si es el mismo objeto.
              </Text>
            )}

            <Row report={lost} label="PERDIDO" color={colors.lost} gradient={gradients.lost} />
            <View style={styles.divider} />
            <Row report={found} label="ENCONTRADO" color={colors.found} gradient={gradients.found} />

            {m.status === 'pending' && (
              <View style={styles.actions}>
                <Pressable style={{ flex: 1, marginRight: 8 }} onPress={() => onAction(m.id, 'reject')}>
                  <View style={styles.btnOutline}>
                    <Text style={styles.btnOutlineText}>No es el mismo</Text>
                  </View>
                </Pressable>
                <Pressable style={{ flex: 1.3 }} onPress={() => onAction(m.id, 'claim')}>
                  <LinearGradient colors={gradients.found} style={styles.btn}>
                    <Text style={styles.btnText}>Parece el mismo</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {m.status === 'claimed' && (
              <View>
                <View style={styles.contactBox}>
                  <Text style={styles.contactLabel}>Contacto de la otra persona</Text>
                  <Text style={styles.contactValue}>
                    {other.contact ? other.contact : 'No dejó datos de contacto'}
                  </Text>
                  <Text style={styles.contactTip}>
                    Pónganse de acuerdo y hagan la entrega en un lugar público. Antes de entregar,
                    pregunta algo que solo el dueño sabría.
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Pressable style={{ flex: 1, marginRight: 8 }} onPress={() => onAction(m.id, 'reject')}>
                    <View style={styles.btnOutline}>
                      <Text style={styles.btnOutlineText}>No era el mismo</Text>
                    </View>
                  </Pressable>
                  <Pressable style={{ flex: 1.3 }} onPress={() => onAction(m.id, 'finish')}>
                    <LinearGradient colors={gradients.found} style={styles.btn}>
                      <Text style={styles.btnText}>Objeto recuperado</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 30 },
  heading: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 14 },
  empty: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: { marginBottom: 8 },
  status: { fontWeight: 'bold', fontSize: 14 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rowPhoto: { width: 84, height: 84, borderRadius: 14, marginRight: 12 },
  rowPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  rowInitial: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  rowLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  rowPlace: { color: colors.muted, fontSize: 12 },
  rowDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  actions: { flexDirection: 'row', marginTop: 12 },
  btn: { borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  btnOutline: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnOutlineText: { color: colors.muted, fontWeight: '600' },
  contactBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactLabel: { color: colors.muted, fontSize: 12 },
  contactValue: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  contactTip: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 8 },
});
