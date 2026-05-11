import AsyncStorage from '@react-native-async-storage/async-storage';
import type {ScannerMode} from '@/domain/scanner/ScannerDevice';

const KEY = 'scanner_preferences';

interface Preferences {
  mode: ScannerMode;
  lastBleDeviceId?: string;
  lastBleDeviceName?: string | null;
}

const defaults: Preferences = {mode: 'hid'};

export async function loadPreferences(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return defaults;
    }
    return {...defaults, ...JSON.parse(raw)} as Preferences;
  } catch {
    return defaults;
  }
}

export async function savePreferences(prefs: Partial<Preferences>): Promise<void> {
  const current = await loadPreferences();
  await AsyncStorage.setItem(KEY, JSON.stringify({...current, ...prefs}));
}
