export const colors = {
  bg: '#0B1220',
  surface: '#121A2E',
  card: '#1A2440',
  border: '#27345A',
  text: '#F2F5FF',
  muted: '#8B97B8',
  primary: '#4F8CFF',
  lost: '#FF7A59',
  found: '#22D3B6',
  danger: '#FF4D6D',
};

export const gradients = {
  main: ['#4F8CFF', '#7B5CFF'],
  lost: ['#FF7A59', '#FF4D6D'],
  found: ['#22D3B6', '#4F8CFF'],
  bg: ['#0B1220', '#17133A'],
  watch: ['#101A3A', '#2A1A5E'],
};

export const categories = [
  { key: 'cartera', label: 'Cartera' },
  { key: 'llaves', label: 'Llaves' },
  { key: 'celular', label: 'Celular' },
  { key: 'mochila', label: 'Mochila' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'mascota', label: 'Mascota' },
  { key: 'otro', label: 'Otro' },
];

export const getCategory = (key) =>
  categories.find((c) => c.key === key) || categories[categories.length - 1];