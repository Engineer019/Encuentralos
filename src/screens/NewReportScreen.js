import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { colors, gradients } from '../theme';

// Pon false si quieres que la foto sea opcional
const PHOTO_REQUIRED = true;

// Límites de caracteres por campo
const LIMITS = { title: 50, description: 200, place: 60, date: 10, phone: 10 };

// Solo deja pasar los caracteres que corresponden a cada campo
const cleanText = (t) => t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,#\-\/]/g, '');
const cleanDescription = (t) =>
  t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,#()¿?¡!:;"'\-\/]/g, '');
const cleanPhone = (t) => t.replace(/\D/g, '').slice(0, LIMITS.phone);

// Fecha: solo números, con diagonales automáticas (DD/MM/AAAA)
const maskDate = (text) => {
  const d = text.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

const formatDate = (d) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

// Devuelve la fecha si es real (por ejemplo, rechaza 31/02/2026), o null
const parseDate = (text) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(year, month - 1, day, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  error,
  multiline,
  keyboardType,
}) {
  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      </View>
      <TextInput
        style={[styles.input, multiline && styles.multiline, error ? styles.inputError : null]}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        multiline={multiline}
        keyboardType={keyboardType}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export default function NewReportScreen({ onSubmit, onDone }) {
  const [type, setType] = useState('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState('');
  const [dateText, setDateText] = useState(formatDate(new Date()));
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});

  const clearError = (key) => {
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  // La foto carga directo, sin pantalla de recorte
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso necesario', 'Permite el acceso a la cámara para tomar la foto.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.5 });
    if (!res.canceled) {
      setPhoto(res.assets[0].uri);
      clearError('photo');
    }
  };

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.5,
    });
    if (!res.canceled) {
      setPhoto(res.assets[0].uri);
      clearError('photo');
    }
  };

  const validate = () => {
    const e = {};
    const cleanTitle = title.replace(/\s+/g, ' ').trim();
    const cleanDesc = description.replace(/\s+/g, ' ').trim();
    const cleanPlace = place.replace(/\s+/g, ' ').trim();

    if (PHOTO_REQUIRED && !photo) e.photo = 'Agrega una foto del objeto';
    if (cleanTitle.length < 3) e.title = 'Escribe al menos 3 caracteres';
    if (cleanDesc.length < 10) e.description = 'Escribe al menos 10 caracteres';
    if (cleanPlace.length < 3) e.place = 'Escribe al menos 3 caracteres';

    const date = parseDate(dateText);
    if (!date) e.date = 'Fecha no válida. Usa el formato DD/MM/AAAA';
    else if (date.getTime() > Date.now()) e.date = 'La fecha no puede ser futura';
    else if (Date.now() - date.getTime() > 365 * 86400000)
      e.date = 'La fecha no puede ser de hace más de un año';

    if (phone.length !== LIMITS.phone) e.phone = 'Escribe los 10 dígitos de tu teléfono';

    return { e, cleanTitle, cleanDesc, cleanPlace, date };
  };

  const submit = () => {
    const { e, cleanTitle, cleanDesc, cleanPlace, date } = validate();
    setErrors(e);

    if (Object.keys(e).length > 0) {
      Alert.alert('Faltan datos', 'Llena todos los campos. Los que faltan están marcados en rojo.');
      return;
    }

    const found = onSubmit({
      type,
      title: cleanTitle,
      description: cleanDesc,
      place: cleanPlace,
      contact: phone,
      date: date.toISOString(),
      photo,
    });

    setTitle('');
    setDescription('');
    setPlace('');
    setDateText(formatDate(new Date()));
    setPhone('');
    setPhoto(null);
    setErrors({});
    Haptics.selectionAsync();

    if (found > 0) {
      Alert.alert(
        'Posible coincidencia',
        'Hay un reporte que podría ser el mismo objeto. Revísalo y decide tú si lo es.',
        [{ text: 'Ver', onPress: () => onDone('matches') }]
      );
    } else {
      Alert.alert(
        'Reporte publicado',
        'Te avisaremos en el reloj si aparece una posible coincidencia.',
        [{ text: 'OK', onPress: () => onDone('home') }]
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Nuevo reporte</Text>

      <View style={styles.segment}>
        <Pressable style={styles.segmentBtn} onPress={() => setType('lost')}>
          {type === 'lost' ? (
            <LinearGradient colors={gradients.lost} style={styles.segmentFill}>
              <Text style={styles.segmentTextActive}>Perdí un objeto</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.segmentText}>Perdí un objeto</Text>
          )}
        </Pressable>
        <Pressable style={styles.segmentBtn} onPress={() => setType('found')}>
          {type === 'found' ? (
            <LinearGradient colors={gradients.found} style={styles.segmentFill}>
              <Text style={styles.segmentTextActive}>Encontré un objeto</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.segmentText}>Encontré un objeto</Text>
          )}
        </Pressable>
      </View>

      <Text style={[styles.fieldLabel, { marginTop: 18, marginBottom: 8 }]}>Foto del objeto</Text>
      {photo ? (
        <View>
          <Image source={{ uri: photo }} style={styles.preview} />
          <Pressable style={styles.removePhoto} onPress={() => setPhoto(null)}>
            <Text style={styles.removePhotoText}>Quitar foto</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.photoRow}>
          <Pressable
            style={[styles.photoBtn, errors.photo ? styles.photoBtnError : null]}
            onPress={takePhoto}
          >
            <Text style={styles.photoText}>Tomar foto</Text>
          </Pressable>
          <Pressable
            style={[styles.photoBtn, errors.photo ? styles.photoBtnError : null]}
            onPress={pickPhoto}
          >
            <Text style={styles.photoText}>Elegir de la galería</Text>
          </Pressable>
        </View>
      )}
      {errors.photo ? <Text style={styles.error}>{errors.photo}</Text> : null}

      <Field
        label="¿Qué objeto es?"
        value={title}
        onChangeText={(t) => {
          setTitle(cleanText(t));
          clearError('title');
        }}
        placeholder="Ej. Cartera negra de piel"
        maxLength={LIMITS.title}
        error={errors.title}
      />

      <Field
        label="Descripción"
        value={description}
        onChangeText={(t) => {
          setDescription(cleanDescription(t));
          clearError('description');
        }}
        placeholder="Con tus palabras: color, marca, señas particulares"
        maxLength={LIMITS.description}
        error={errors.description}
        multiline
      />

      <Field
        label="¿Dónde fue?"
        value={place}
        onChangeText={(t) => {
          setPlace(cleanText(t));
          clearError('place');
        }}
        placeholder="Ej. Plaza del centro"
        maxLength={LIMITS.place}
        error={errors.place}
      />

      <Field
        label="Fecha en que ocurrió"
        value={dateText}
        onChangeText={(t) => {
          setDateText(maskDate(t));
          clearError('date');
        }}
        placeholder="DD/MM/AAAA"
        maxLength={LIMITS.date}
        keyboardType="number-pad"
        error={errors.date}
      />

      <Field
        label="Teléfono de contacto"
        value={phone}
        onChangeText={(t) => {
          setPhone(cleanPhone(t));
          clearError('phone');
        }}
        placeholder="10 dígitos"
        maxLength={LIMITS.phone}
        keyboardType="number-pad"
        error={errors.phone}
      />
      <Text style={styles.hint}>
        Solo se muestra a la otra persona si ustedes dos deciden que es el mismo objeto.
      </Text>

      <Pressable onPress={submit} style={{ marginTop: 22 }}>
        <LinearGradient
          colors={gradients.main}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submit}
        >
          <Text style={styles.submitText}>Publicar reporte</Text>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  heading: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 14 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segmentBtn: { flex: 1 },
  segmentFill: { paddingVertical: 13, alignItems: 'center' },
  segmentText: {
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 13,
    fontWeight: '600',
  },
  segmentTextActive: { color: '#fff', fontWeight: 'bold' },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 18,
    marginBottom: 8,
  },
  fieldLabel: { color: colors.muted, fontSize: 13 },
  counter: { color: colors.muted, fontSize: 11 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 6 },
  photoRow: { flexDirection: 'row' },
  photoBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  photoBtnError: { borderColor: colors.danger },
  photoText: { color: colors.primary, fontWeight: '600' },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removePhoto: { alignSelf: 'flex-end', marginTop: 8 },
  removePhotoText: { color: colors.danger, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  submit: { borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});