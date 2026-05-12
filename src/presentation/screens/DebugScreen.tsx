import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {bleScannerService, type DiscoveredCharacteristic} from '@/infrastructure/ble/BleScannerService';
import {
  getConnectedAccessories,
  type ConnectedAccessory,
} from '@/infrastructure/hid/BluetoothAccessoryPicker';
import type {BleDevice} from '@/domain/scanner/ScannerDevice';

const SCAN_DURATION_MS = 10000;

export function DebugScreen() {
  const [mfiDevices, setMfiDevices] = useState<ConnectedAccessory[]>([]);
  const [bleDevices, setBleDevices] = useState<BleDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [mfiLoading, setMfiLoading] = useState(false);
  const [connectedId, setConnectedId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [gattChars, setGattChars] = useState<DiscoveredCharacteristic[]>([]);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMfi = useCallback(async () => {
    setMfiLoading(true);
    try {
      const result = await getConnectedAccessories();
      setMfiDevices(result);
    } catch {
      setMfiDevices([]);
    } finally {
      setMfiLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMfi();
    return () => {
      bleScannerService.stopScan();
      if (scanTimer.current) {
        clearTimeout(scanTimer.current);
      }
    };
  }, [loadMfi]);

  const startBleScan = useCallback(() => {
    setBleDevices([]);
    setScanning(true);
    bleScannerService.startScan(device => {
      setBleDevices(prev => {
        if (prev.some(d => d.id === device.id)) {
          return prev;
        }
        return [...prev, device].sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999));
      });
    });
    scanTimer.current = setTimeout(() => {
      bleScannerService.stopScan();
      setScanning(false);
    }, SCAN_DURATION_MS);
  }, []);

  const stopBleScan = useCallback(() => {
    bleScannerService.stopScan();
    setScanning(false);
    if (scanTimer.current) {
      clearTimeout(scanTimer.current);
    }
  }, []);

  const connectForInspect = useCallback(async (device: BleDevice) => {
    setConnecting(device.id);
    try {
      bleScannerService.stopScan();
      setScanning(false);
      await bleScannerService.connect(device.id, () => {});
      setConnectedId(device.id);
      setGattChars(bleScannerService.getDiscoveredCharacteristics());
    } catch (e: any) {
      setConnectedId(null);
      setGattChars([]);
    } finally {
      setConnecting(null);
    }
  }, []);

  const disconnectInspect = useCallback(async () => {
    await bleScannerService.disconnect();
    setConnectedId(null);
    setGattChars([]);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* MFi / EAAccessoryManager section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              MFi Accessories (EAAccessoryManager)
            </Text>
            <Pressable onPress={loadMfi}>
              <Text style={styles.refreshBtn}>Refresh</Text>
            </Pressable>
          </View>
          <Text style={styles.sectionNote}>
            iOS only — shows accessories connected via the MFi program. HID
            keyboard scanners do NOT appear here.
          </Text>
          {mfiLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : mfiDevices.length === 0 ? (
            <Text style={styles.emptyText}>No MFi accessories connected</Text>
          ) : (
            mfiDevices.map((acc, i) => (
              <View key={i} style={styles.deviceCard}>
                <Row label="Name" value={acc.name || '—'} bold />
                <Row label="Manufacturer" value={acc.manufacturer || '—'} />
                <Row label="Model" value={acc.modelNumber || '—'} />
                <Row label="Serial" value={acc.serialNumber || '—'} />
                <Row label="FW" value={acc.firmwareRevision || '—'} />
                <Row label="HW" value={acc.hardwareRevision || '—'} />
                <Row label="Connection ID" value={String(acc.connectionID)} />
                <Row
                  label="Protocols"
                  value={
                    acc.protocolStrings.length
                      ? acc.protocolStrings.join(', ')
                      : '—'
                  }
                />
              </View>
            ))
          )}
        </View>

        {/* BLE scan section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              BLE Peripherals (CBCentralManager)
            </Text>
            <Pressable onPress={scanning ? stopBleScan : startBleScan}>
              <Text style={[styles.refreshBtn, scanning && styles.stopBtn]}>
                {scanning ? 'Stop' : 'Scan 10s'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.sectionNote}>
            Nearby BLE advertisers. HID keyboard scanners paired via Settings
            are hidden from this list by iOS.
          </Text>
          {scanning && (
            <View style={styles.scanningRow}>
              <ActivityIndicator size="small" color="#1A5276" />
              <Text style={styles.scanningText}>Scanning…</Text>
            </View>
          )}
          {bleDevices.length === 0 && !scanning ? (
            <Text style={styles.emptyText}>No BLE devices found — tap Scan</Text>
          ) : (
            bleDevices.map(dev => (
              <View key={dev.id} style={styles.deviceCard}>
                <Row label="Name" value={dev.name ?? '(unnamed)'} bold />
                <Row label="ID / MAC" value={dev.id} mono />
                <Row label="RSSI" value={dev.rssi != null ? `${dev.rssi} dBm` : '—'} />
                {connectedId === dev.id ? (
                  <Pressable style={styles.inspectBtn} onPress={disconnectInspect}>
                    <Text style={styles.inspectBtnText}>Disconnect</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.inspectBtn}
                    onPress={() => connectForInspect(dev)}
                    disabled={!!connecting}>
                    <Text style={styles.inspectBtnText}>
                      {connecting === dev.id ? 'Connecting…' : 'Inspect GATT'}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))
          )}

          {gattChars.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>GATT Characteristics</Text>
              <Text style={styles.sectionNote}>
                Device: {connectedId}
              </Text>
              {(() => {
                const byService: Record<string, DiscoveredCharacteristic[]> = {};
                gattChars.forEach(c => {
                  if (!byService[c.serviceUUID]) {byService[c.serviceUUID] = [];}
                  byService[c.serviceUUID].push(c);
                });
                return Object.entries(byService).map(([svcUUID, chars]) => (
                  <View key={svcUUID} style={styles.deviceCard}>
                    <Text style={styles.serviceLabel}>Service: {svcUUID}</Text>
                    {chars.map(c => (
                      <View key={c.uuid} style={styles.charRow}>
                        <Text style={styles.charUUID} selectable>{c.uuid}</Text>
                        <Text style={styles.charProps}>
                          {[
                            c.isNotifiable && 'notify',
                            c.isIndicatable && 'indicate',
                            c.isReadable && 'read',
                            c.isWritableWithResponse && 'write',
                            c.isWritableWithoutResponse && 'write-nr',
                          ].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                ));
              })()}
            </View>
          )}
        </View>

        {/* Platform info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform</Text>
          <View style={styles.deviceCard}>
            <Row label="OS" value={Platform.OS} />
            <Row label="Version" value={String(Platform.Version)} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[styles.rowValue, bold && styles.rowValueBold, mono && styles.rowValueMono]}
        numberOfLines={2}
        selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F7F9FC'},
  scroll: {padding: 16, gap: 20},
  section: {gap: 8},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionNote: {fontSize: 12, color: '#888', lineHeight: 17},
  refreshBtn: {fontSize: 13, color: '#1A5276', fontWeight: '600'},
  stopBtn: {color: '#E74C3C'},
  loader: {marginVertical: 8},
  scanningRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4},
  scanningText: {fontSize: 13, color: '#1A5276'},
  emptyText: {fontSize: 13, color: '#AAA', fontStyle: 'italic'},
  deviceCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {flexDirection: 'row', gap: 8},
  rowLabel: {
    width: 100,
    fontSize: 12,
    color: '#888',
    flexShrink: 0,
  },
  rowValue: {flex: 1, fontSize: 12, color: '#222'},
  rowValueBold: {fontWeight: '700', fontSize: 13, color: '#1A1A1A'},
  rowValueMono: {fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontSize: 11},
  inspectBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1A5276',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  inspectBtnText: {color: '#1A5276', fontSize: 12, fontWeight: '600'},
  serviceLabel: {fontSize: 11, fontWeight: '700', color: '#555', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'},
  charRow: {paddingVertical: 3, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F0F0F0'},
  charUUID: {fontSize: 11, color: '#333', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'},
  charProps: {fontSize: 10, color: '#888', marginTop: 1},
});
