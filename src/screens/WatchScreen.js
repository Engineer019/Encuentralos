import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, gradients, getCategory } from '../theme';

export default function WatchScreen({ matches, reports, onOpen }) {
  const [now, setNow] = useState(new Date());
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const pending = matches.filter((m) => m.status === 'pending');
  const recovered = reports.filter((r) => r.mine && r.status === 'recovered').length;

  // Datos de la primera coincidencia pendiente
  let data = null;
  const current = pending[0];
  if (current) {
    const lost = reports.find((r) => r.id === current.lostId);
    const found = reports.find((r) => r.id === current.foundId);
    if (lost && found) {
      const mine = lost.mine ? lost : found;
      const other = lost.mine ? found : lost;
      data = {
        message:
          mine.type === 'lost' ? 'Encontraron algo parecido' : 'Alguien busca algo parecido',
        other,
      };
    }
  }

  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onOpen();
  };

  const time = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.wrap}>
      <View style={styles.strap} />

      <View style={styles.watchCase}>
        <LinearGradient colors={gradients.watch} style={styles.screen}>
          {data ? (
            <>
              <Text style={styles.alert}>
                AVISO{pending.length > 1 ? `  ·  1/${pending.length}` : ''}
              </Text>

              {data.other.photo ? (
                <Image source={{ uri: data.other.photo }} style={styles.photo} />
              ) : (
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                  <LinearGradient colors={gradients.main} style={[styles.photo, styles.avatar]}>
                    <Text style={styles.initial}>
                     {data.other.title.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                </Animated.View>
              )}

              <Text style={styles.message}>{data.message}</Text>
              <Text style={styles.title} numberOfLines={1}>
                {data.other.title}
              </Text>
              <Text style={styles.place} numberOfLines={1}>
                {data.other.place}
              </Text>

              <Pressable onPress={open} style={{ marginTop: 12 }}>
                <LinearGradient
                  colors={gradients.main}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.openBtn}
                >
                  <Text style={styles.openText}>Ver en el teléfono</Text>
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.time}>{time}</Text>
              <Text style={styles.idleText}>Sin avisos</Text>
              <Text style={styles.idleSub}>{recovered} recuperados</Text>
            </>
          )}
        </LinearGradient>
      </View>

      <View style={styles.strap} />

      <Text style={styles.caption}>Simulación de smartwatch</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  strap: {
    width: 120,
    height: 50,
    backgroundColor: '#1B2240',
    borderRadius: 14,
  },
  watchCase: {
    width: 240,
    height: 280,
    borderRadius: 64,
    borderWidth: 8,
    borderColor: '#2C3766',
    overflow: 'hidden',
    backgroundColor: '#000',
    marginVertical: -8,
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  alert: { color: colors.primary, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.primary,
    marginVertical: 6,
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  message: { color: colors.muted, fontSize: 12 },
  title: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginTop: 2 },
  place: { color: colors.muted, fontSize: 11, marginTop: 2 },
  openBtn: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 22 },
  openText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  time: { color: '#fff', fontSize: 44, fontWeight: 'bold' },
  idleText: { color: colors.text, fontSize: 15, marginTop: 8 },
  idleSub: { color: colors.muted, fontSize: 12, marginTop: 4 },
  caption: { color: colors.muted, fontSize: 12, marginTop: 26 },
});