import React, {useCallback, useEffect, useState} from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {bleScannerService} from '@/infrastructure/ble/BleScannerService';
import {loadPreferences, savePreferences} from '@/infrastructure/storage/ScannerPreferences';
import type {RootStackParamList} from '@/presentation/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [lastBleDeviceName, setLastBleDeviceName] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    loadPreferences().then(prefs => {
      if (prefs.mode === 'ble' && prefs.lastBleDeviceId) {
        setLastBleDeviceName(prefs.lastBleDeviceName ?? prefs.lastBleDeviceId);
        setIsReconnecting(true);
        bleScannerService
          .connect(prefs.lastBleDeviceId, () => {})
          .then(() => {
            setIsReconnecting(false);
            navigation.navigate('BleDiscovery');
          })
          .catch(() => {
            setIsReconnecting(false);
          });
      }
    });
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectHid = useCallback(async () => {
    await savePreferences({mode: 'hid'});
    navigation.navigate('HidScanner');
  }, [navigation]);

  const selectBle = useCallback(() => {
    navigation.navigate('BleDiscovery');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Barcode Scanner</Text>
          <Text style={styles.heroSub}>Choose how your scanner connects</Text>
        </View>

        {isReconnecting && lastBleDeviceName && (
          <View style={styles.reconnectBanner}>
            <Text style={styles.reconnectText}>
              Reconnecting to {lastBleDeviceName}…
            </Text>
          </View>
        )}

        <Pressable style={styles.card} onPress={selectBle}>
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>📡</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>BLE GATT scanner</Text>
            <Text style={styles.cardDesc}>
              Scan for nearby Bluetooth Low Energy devices and connect directly from the app. iOS shows the pairing prompt without leaving the app.
            </Text>
            <Text style={styles.cardTag}>Stays in-app · For BLE-mode scanners</Text>
          </View>
        </Pressable>

        <Pressable style={styles.card} onPress={selectHid}>
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>⌨️</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>HID / Keyboard scanner</Text>
            <Text style={styles.cardDesc}>
              Your scanner is paired via Bluetooth Settings and types like a keyboard. Works with most barcode scanners out of the box.
            </Text>
            <Text style={styles.cardTag}>Pair via OS Settings · Most scanners</Text>
          </View>
        </Pressable>

        {Platform.OS === 'android' && (
          <Pressable
            style={[styles.card, styles.cardSecondary]}
            onPress={() => navigation.navigate('DeviceInfo')}>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Inspect bonded devices</Text>
              <Text style={styles.cardDesc}>
                See all Bluetooth devices paired with this phone and identify which ones are keyboards / scanners.
              </Text>
              <Text style={styles.cardTag}>Android only</Text>
            </View>
          </Pressable>
        )}

        <Pressable
          style={[styles.card, styles.cardSecondary]}
          onPress={() => navigation.navigate('Debug')}>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>🔍 BT Debug</Text>
            <Text style={styles.cardDesc}>
              Inspect MFi accessories, scan for nearby BLE peripherals and see raw device info.
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F7F9FC'},
  scroll: {padding: 20, gap: 16},
  hero: {paddingVertical: 12, alignItems: 'center'},
  heroTitle: {fontSize: 28, fontWeight: '700', color: '#1A1A1A'},
  heroSub: {fontSize: 15, color: '#888', marginTop: 4},
  reconnectBanner: {
    backgroundColor: '#FFF8DC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0C040',
  },
  reconnectText: {fontSize: 14, color: '#7D6608'},
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSecondary: {borderWidth: 1, borderColor: '#E0E0E0', shadowOpacity: 0},
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EEF7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {fontSize: 22},
  cardBody: {flex: 1},
  cardTitle: {fontSize: 16, fontWeight: '700', color: '#1A1A1A'},
  cardDesc: {fontSize: 13, color: '#555', marginTop: 4, lineHeight: 19},
  cardTag: {fontSize: 12, color: '#1A5276', marginTop: 8, fontWeight: '600'},
});
