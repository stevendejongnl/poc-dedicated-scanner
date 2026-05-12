import React, {useCallback, useState} from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {HiddenScannerInput} from '@/presentation/components/HiddenScannerInput';
import {ScanLog} from '@/presentation/components/ScanLog';
import type {ScanEvent} from '@/domain/scanner/ScanEvent';
let eventCounter = 0;

function openBluetoothSettings() {
  if (Platform.OS === 'ios') {
    Linking.openURL('App-Prefs:root=Bluetooth').catch(() => Linking.openSettings());
  } else {
    Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS').catch(() =>
      Linking.openSettings(),
    );
  }
}

export function HidScannerScreen() {
  const [events, setEvents] = useState<ScanEvent[]>([]);

  const handleBarcode = useCallback((barcode: string) => {
    setEvents(prev => [
      ...prev,
      {
        id: String(++eventCounter),
        barcode,
        timestamp: new Date(),
        source: 'hid',
      },
    ]);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <HiddenScannerInput onBarcode={handleBarcode} />

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>HID Scanner active</Text>
        <Text style={styles.bannerSub}>
          Scanner must be paired via{' '}
          <Text style={styles.link} onPress={openBluetoothSettings}>
            Bluetooth Settings
          </Text>
        </Text>
      </View>

      <View style={styles.logHeader}>
        <Text style={styles.logTitle}>Scan log ({events.length})</Text>
        {events.length > 0 && (
          <Pressable onPress={() => setEvents([])}>
            <Text style={styles.clearBtn}>Clear</Text>
          </Pressable>
        )}
      </View>

      <ScanLog events={events} />

      <Pressable style={styles.settingsBtn} onPress={openBluetoothSettings}>
        <Text style={styles.settingsBtnText}>Manage paired devices</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFF'},
  banner: {
    backgroundColor: '#EEF7FF',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C0D8F0',
  },
  bannerTitle: {fontSize: 15, fontWeight: '600', color: '#1A5276'},
  bannerSub: {fontSize: 13, color: '#555', marginTop: 2},
  link: {color: '#1A5276', textDecorationLine: 'underline'},
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  logTitle: {fontSize: 13, fontWeight: '600', color: '#555', textTransform: 'uppercase', letterSpacing: 0.5},
  clearBtn: {fontSize: 13, color: '#E74C3C'},
  settingsBtn: {
    margin: 16,
    backgroundColor: '#1A5276',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  settingsBtnText: {color: '#FFF', fontSize: 15, fontWeight: '600'},
});
