import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import PhoneHomeScreen from './src/screens/PhoneHomeScreen';
import NewReportScreen from './src/screens/NewReportScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import WatchScreen from './src/screens/WatchScreen';
import { loadData, saveData } from './src/lib/storage';
import { findNewMatches } from './src/lib/matching';
import { colors, gradients } from './src/theme';

const TOP_PAD = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 50;

const TABS = [
  { key: 'home', label: 'Inicio' },
  { key: 'new', label: 'Publicar' },
  { key: 'matches', label: 'Coincidencias' },
];

// ¿El reporte todavía tiene otra coincidencia abierta (pendiente o en contacto)?
const hasOpenMatch = (list, reportId, exceptId) =>
  list.some(
    (x) =>
      x.id !== exceptId &&
      (x.status === 'pending' || x.status === 'claimed') &&
      (x.lostId === reportId || x.foundId === reportId)
  );

export default function App() {
  const [reports, setReports] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [device, setDevice] = useState('phone'); // phone | watch
  const [tab, setTab] = useState('home'); // home | new | matches

  // Cargar datos guardados
  useEffect(() => {
    loadData().then((data) => {
      setReports(data.reports);
      setMatches(data.matches);
      setLoaded(true);
    });
  }, []);

  // Guardar cada vez que cambian
  useEffect(() => {
    if (loaded) saveData(reports, matches);
  }, [reports, matches, loaded]);

  // Publica un reporte, busca coincidencias sugeridas y devuelve cuántas encontró.
  // "Perdí" es de quien usa la app (el dueño); "Encontré" es de otra persona (quien lo encontró).
  const addReport = (data) => {
    const mine = data.type === 'lost';

    const report = {
      id: `r_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      ...data,
      mine,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const newMatches = findNewMatches(report, reports, matches);

    const involved = new Set();
    newMatches.forEach((m) => {
      involved.add(m.lostId);
      involved.add(m.foundId);
    });

    const updated = [report, ...reports].map((r) =>
      involved.has(r.id) && r.status === 'active' ? { ...r, status: 'match' } : r
    );

    setReports(updated);
    if (newMatches.length > 0) {
      setMatches([...newMatches, ...matches]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    return newMatches.length;
  };

  // Atajo para la demo: crea un reporte "encontrado" parecido a tu último reporte de objeto perdido
  const simulateOther = () => {
    const base = reports.find((r) => r.type === 'lost' && r.status !== 'recovered');
    if (!base) return false;

    addReport({
      type: 'found',
      category: base.category,
      title: base.title,
      description: base.description,
      place: base.place,
      date: base.date,
      contact: 'Tel. 653 000 0000 (simulado)',
    });
    return true;
  };

  // Acciones sobre una coincidencia: 'reject' | 'claim' | 'finish'
  const updateMatch = (matchId, action) => {
    const m = matches.find((x) => x.id === matchId);
    if (!m) return;

    const nextStatus = { reject: 'rejected', claim: 'claimed', finish: 'confirmed' }[action];
    if (!nextStatus) return;

    setMatches(matches.map((x) => (x.id === matchId ? { ...x, status: nextStatus } : x)));

    if (action === 'finish') {
      setReports(
        reports.map((r) =>
          r.id === m.lostId || r.id === m.foundId ? { ...r, status: 'recovered' } : r
        )
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (action === 'reject') {
      setReports(
        reports.map((r) =>
          (r.id === m.lostId || r.id === m.foundId) &&
          r.status === 'match' &&
          !hasOpenMatch(matches, r.id, matchId)
            ? { ...r, status: 'active' }
            : r
        )
      );
    }
  };

  // Elimina un reporte y las coincidencias que lo incluían
  const deleteReport = (id) => {
    const remaining = matches.filter((m) => m.lostId !== id && m.foundId !== id);
    setMatches(remaining);
    setReports(
      reports
        .filter((r) => r.id !== id)
        .map((r) =>
          r.status === 'match' && !hasOpenMatch(remaining, r.id, null)
            ? { ...r, status: 'active' }
            : r
        )
    );
  };

  const resetAll = () => {
    setReports([]);
    setMatches([]);
  };

  // Desde el reloj: ir al teléfono, pestaña de coincidencias
  const openFromWatch = () => {
    setTab('matches');
    setDevice('phone');
  };

  if (!loaded) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const pendingCount = matches.filter((m) => m.status === 'pending').length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFill} />

      {/* Barra superior: cambia entre teléfono y reloj */}
      <View style={[styles.topBar, { paddingTop: TOP_PAD + 8 }]}>
        <Text style={styles.logo}>Encuéntralo</Text>
        <View style={styles.switch}>
          {[
            { key: 'phone', label: 'Teléfono' },
            { key: 'watch', label: 'Reloj' },
          ].map((d) => (
            <Pressable
              key={d.key}
              onPress={() => setDevice(d.key)}
              style={[styles.switchBtn, device === d.key && styles.switchBtnActive]}
            >
              <Text style={[styles.switchText, device === d.key && styles.switchTextActive]}>
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {device === 'phone' ? (
        <View style={styles.body}>
          <View style={styles.content}>
            {tab === 'home' && (
              <PhoneHomeScreen
                reports={reports}
                onSimulate={simulateOther}
                onReset={resetAll}
                onDelete={deleteReport}
              />
            )}
            {tab === 'new' && (
              <NewReportScreen
                onSubmit={(data) => addReport(data)}
                onDone={(next) => setTab(next)}
              />
            )}
            {tab === 'matches' && (
              <MatchesScreen matches={matches} reports={reports} onAction={updateMatch} />
            )}
          </View>

          <View style={styles.tabBar}>
            {TABS.map((t) => (
              <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
                <View
                  style={[styles.tabIndicator, tab === t.key && styles.tabIndicatorActive]}
                />
                <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
                  {t.label}
                </Text>
                {t.key === 'matches' && pendingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingCount}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <WatchScreen matches={matches} reports={reports} onOpen={openFromWatch} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  switch: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  switchBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  switchBtnActive: { backgroundColor: colors.primary },
  switchText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  switchTextActive: { color: '#fff' },
  body: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 14,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabIndicator: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  tabIndicatorActive: { backgroundColor: colors.primary },
  tabLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: colors.text, fontWeight: 'bold' },
  badge: {
    position: 'absolute',
    top: 4,
    right: '14%',
    backgroundColor: colors.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});