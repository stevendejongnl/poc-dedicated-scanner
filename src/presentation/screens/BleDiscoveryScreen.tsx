import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {PermissionsAndroid} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {bleScannerService} from '@/infrastructure/ble/BleScannerService';
import {savePreferences} from '@/infrastructure/storage/ScannerPreferences';
import {ScanLog} from '@/presentation/components/ScanLog';
import type {BleDevice} from '@/domain/scanner/ScannerDevice';
import type {ScanEvent} from '@/domain/scanner/ScanEvent';

let eventCounter = 0;

async function requestAndroidBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  if (Platform.Version >= 31) {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(results).every(r => r === PermissionsAndroid.RESULTS.GRANTED);
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export function BleDiscoveryScreen() {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<BleDevice[]>([]);
  const [connectedId, setConnectedId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [events, setEvents] = useState<ScanEvent[]>([]);

  const stopScan = useCallback(() => {
    bleScannerService.stopScan();
    setScanning(false);
  }, []);

  const startScan = useCallback(async () => {
    const granted = await requestAndroidBlePermissions();
    if (!granted) {
      Alert.alert('Permission required', 'Bluetooth permissions are needed to scan for devices.');
      return;
    }

    setDevices([]);
    setScanning(true);

    bleScannerService.startScan(device => {
      setDevices(prev => {
        if (prev.find(d => d.id === device.id)) {
          return prev;
        }
        return [...prev, device];
      });
    });

    setTimeout(stopScan, 10_000);
  }, [stopScan]);

  const connect = useCallback(async (device: BleDevice) => {
    setConnecting(device.id);
    try {
      stopScan();
      await bleScannerService.connect(device.id, barcode => {
        setEvents(prev => [
          ...prev,
          {id: String(++eventCounter), barcode, timestamp: new Date(), source: 'ble'},
        ]);
      });
      setConnectedId(device.id);
      await savePreferences({
        mode: 'ble',
        lastBleDeviceId: device.id,
        lastBleDeviceName: device.name,
      });
    } catch (e: any) {
      Alert.alert('Connection failed', e?.message ?? 'Could not connect to the device.');
    } finally {
      setConnecting(null);
    }
  }, [stopScan]);

  const disconnect = useCallback(async () => {
    await bleScannerService.disconnect();
    setConnectedId(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopScan();
      };
    }, [stopScan]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {connectedId ? (
        <>
          <View style={styles.connectedBanner}>
            <Text style={styles.connectedTitle}>Connected</Text>
            <Text style={styles.connectedSub}>
              {devices.find(d => d.id === connectedId)?.name ?? connectedId}
            </Text>
            <Pressable style={styles.disconnectBtn} onPress={disconnect}>
              <Text style={styles.disconnectBtnText}>Disconnect</Text>
            </Pressable>
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
        </>
      ) : (
        <>
          <View style={styles.scanControls}>
            <Pressable
              style={[styles.scanBtn, scanning && styles.scanBtnActive]}
              onPress={scanning ? stopScan : startScan}
              disabled={!!connecting}>
              <Text style={styles.scanBtnText}>{scanning ? 'Stop scanning' : 'Scan for BLE devices'}</Text>
            </Pressable>
            {scanning && <ActivityIndicator style={styles.spinner} color="#1A5276" />}
          </View>

          <FlatList
            data={devices}
            keyExtractor={d => d.id}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {scanning ? 'Looking for devices…' : 'Tap "Scan for BLE devices" to start'}
                </Text>
              </View>
            }
            renderItem={({item}) => (
              <Pressable
                style={styles.deviceRow}
                onPress={() => connect(item)}
                disabled={!!connecting}>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{item.name ?? 'Unknown device'}</Text>
                  <Text style={styles.deviceId}>{item.id}</Text>
                  {item.rssi !== null && (
                    <Text style={styles.deviceRssi}>RSSI: {item.rssi} dBm</Text>
                  )}
                </View>
                {connecting === item.id ? (
                  <ActivityIndicator color="#1A5276" />
                ) : (
                  <Text style={styles.connectLabel}>Connect</Text>
                )}
              </Pressable>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFF'},
  scanControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  scanBtn: {
    flex: 1,
    backgroundColor: '#1A5276',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  scanBtnActive: {backgroundColor: '#E74C3C'},
  scanBtnText: {color: '#FFF', fontWeight: '600', fontSize: 15},
  spinner: {marginLeft: 4},
  empty: {flex: 1, alignItems: 'center', padding: 40},
  emptyText: {color: '#888', fontSize: 15, textAlign: 'center'},
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  deviceInfo: {flex: 1},
  deviceName: {fontSize: 15, fontWeight: '600', color: '#1A1A1A'},
  deviceId: {fontSize: 12, color: '#888', marginTop: 2},
  deviceRssi: {fontSize: 12, color: '#888'},
  connectLabel: {color: '#1A5276', fontWeight: '600', fontSize: 14},
  connectedBanner: {
    backgroundColor: '#EEF7FF',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C0D8F0',
  },
  connectedTitle: {fontSize: 15, fontWeight: '700', color: '#1A5276'},
  connectedSub: {fontSize: 13, color: '#555', marginTop: 2},
  disconnectBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E74C3C',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  disconnectBtnText: {color: '#E74C3C', fontWeight: '600', fontSize: 14},
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
});
