import AsyncStorage from '@react-native-async-storage/async-storage';

const REPORTS_KEY = 'encuentralo:reports';
const MATCHES_KEY = 'encuentralo:matches';

export async function loadData() {
  try {
    const [r, m] = await Promise.all([
      AsyncStorage.getItem(REPORTS_KEY),
      AsyncStorage.getItem(MATCHES_KEY),
    ]);
    return {
      reports: r ? JSON.parse(r) : [],
      matches: m ? JSON.parse(m) : [],
    };
  } catch (e) {
    return { reports: [], matches: [] };
  }
}

export async function saveData(reports, matches) {
  try {
    await Promise.all([
      AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports)),
      AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(matches)),
    ]);
  } catch (e) {}
}