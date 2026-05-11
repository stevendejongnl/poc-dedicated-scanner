import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {
  getBondedDevices,
  deviceClassLabel,
  isKeyboardClass,
} from '@/infrastructure/bondedDevices/BondedDevicesService';
import type {HidDevice} from '@/domain/scanner/ScannerDevice';

export function DeviceInfoScreen() {
  const [devices, setDevices] = useState<HidDevice[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const bonded = await getBondedDevices();
    setDevices(bonded);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (Platform.OS !== 'android') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.notAvailable}>
            Bonded device inspection is not available on iOS.{'\n\n'}iOS does not expose HID-paired devices to apps.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bonded Bluetooth devices</Text>
        <Pressable onPress={load} disabled={loading}>
          <Text style={styles.refreshBtn}>{loading ? 'Loading…' : 'Refresh'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.spinner} color="#1A5276" />
      ) : (
        <FlatList
          data={devices}
          keyExtractor={d => d.address}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No bonded devices found.</Text>
            </View>
          }
          renderItem={({item}) => {
            const isScanner = isKeyboardClass(item.deviceClass);
            return (
              <View style={[styles.row, isScanner && styles.rowHighlight]}>
                <View style={styles.rowLeft}>
                  <Text style={styles.deviceName}>{item.name}</Text>
                  <Text style={styles.deviceAddress}>{item.address}</Text>
                  <Text style={[styles.deviceClass, isScanner && styles.deviceClassHighlight]}>
                    {deviceClassLabel(item.deviceClass)}
                    {isScanner ? '  ← likely your scanner' : ''}
                  </Text>
                </View>
                {isScanner && <Text style={styles.badge}>SCANNER</Text>}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFF'},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {fontSize: 15, fontWeight: '600', color: '#1A1A1A'},
  refreshBtn: {fontSize: 14, color: '#1A5276'},
  spinner: {marginTop: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32},
  empty: {fontSize: 15, color: '#888', textAlign: 'center'},
  notAvailable: {fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22},
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowHighlight: {backgroundColor: '#F0FFF4'},
  rowLeft: {flex: 1},
  deviceName: {fontSize: 15, fontWeight: '600', color: '#1A1A1A'},
  deviceAddress: {fontSize: 12, color: '#888', marginTop: 2},
  deviceClass: {fontSize: 12, color: '#888', marginTop: 2},
  deviceClassHighlight: {color: '#27AE60', fontWeight: '600'},
  badge: {
    backgroundColor: '#27AE60',
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
