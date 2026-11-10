// La app solo SUGIERE posibles coincidencias: quienes verifican son las personas.
// Por eso el puntaje mínimo es bajo y es mejor sugerir de más que de menos.
export const MATCH_THRESHOLD = 30;

const STOPWORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'con', 'en', 'y', 'o', 'que',
  'por', 'para', 'del', 'al', 'mi', 'su', 'se', 'es', 'lo', 'le', 'me', 'muy', 'sin', 'fue',
]);

// Minúsculas, sin acentos ni signos
const normalize = (text = '') =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');

// Compara por la raíz de la palabra (primeras 4 letras),
// así "negra", "negro" y "negros" cuentan como la misma palabra
const words = (text) =>
  new Set(
    normalize(text)
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
      .map((w) => (w.length > 4 ? w.slice(0, 4) : w))
  );

export function scoreMatch(a, b) {
  let score = 0;

  // 1) Palabras parecidas en título y descripción: 15 c/u, máximo 60
  const wa = words(`${a.title} ${a.description}`);
  const wb = words(`${b.title} ${b.description}`);
  let shared = 0;
  wa.forEach((w) => {
    if (wb.has(w)) shared += 1;
  });
  score += Math.min(shared * 15, 60);

  // 2) Lugar parecido: 25 puntos
  const pa = words(a.place);
  const pb = words(b.place);
  let sharedPlace = 0;
  pa.forEach((w) => {
    if (pb.has(w)) sharedPlace += 1;
  });
  if (sharedPlace > 0) score += 25;

  // La fecha no cuenta: un objeto puede aparecer días o semanas después

  return Math.min(score, 100);
}

// Compara un reporte nuevo contra los existentes y devuelve las coincidencias nuevas
export function findNewMatches(newReport, reports, matches) {
  const result = [];

  reports.forEach((other) => {
    if (other.id === newReport.id) return;
    if (other.type === newReport.type) return; // debe ser perdido vs encontrado
    if (other.mine === newReport.mine) return; // debe ser de personas distintas
    if (other.status === 'recovered' || newReport.status === 'recovered') return;

    const lost = newReport.type === 'lost' ? newReport : other;
    const found = newReport.type === 'found' ? newReport : other;

    const exists = matches.some((m) => m.lostId === lost.id && m.foundId === found.id);
    if (exists) return;

    const score = scoreMatch(newReport, other);
    if (score >= MATCH_THRESHOLD) {
      result.push({
        id: `m_${lost.id}_${found.id}`,
        lostId: lost.id,
        foundId: found.id,
        score,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
  });

  return result;
}