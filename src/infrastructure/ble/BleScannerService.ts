import {BleManager, type Device, type Subscription, State} from 'react-native-ble-plx';
import {Platform} from 'react-native';
import type {BleDevice} from '@/domain/scanner/ScannerDevice';
import {DEFAULT_PROFILE} from './characteristics';

export type BarcodeCallback = (barcode: string) => void;
export type ScanCallback = (device: BleDevice) => void;

class BleScannerService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private subscription: Subscription | null = null;

  private getManager(): BleManager {
    if (!this.manager) {
      this.manager = new BleManager();
    }
    return this.manager;
  }

  async checkState(): Promise<State> {
    return new Promise(resolve => {
      const sub = this.getManager().onStateChange(state => {
        sub.remove();
        resolve(state);
      }, true);
    });
  }

  startScan(onDevice: ScanCallback): void {
    const seen = new Set<string>();
    this.getManager().startDeviceScan(null, {allowDuplicates: false}, (error, device) => {
      if (error || !device) {
        return;
      }
      if (seen.has(device.id)) {
        return;
      }
      seen.add(device.id);
      onDevice({
        mode: 'ble',
        id: device.id,
        name: device.name ?? device.localName ?? null,
        rssi: device.rssi ?? null,
      });
    });
  }

  stopScan(): void {
    this.getManager().stopDeviceScan();
  }

  async connect(deviceId: string, onBarcode: BarcodeCallback): Promise<void> {
    await this.disconnect();

    const device = await this.getManager().connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();
    this.connectedDevice = device;

    const {serviceUUID, characteristicUUID} = DEFAULT_PROFILE;

    this.subscription = device.monitorCharacteristicForService(
      serviceUUID,
      characteristicUUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) {
          return;
        }
        const raw = atob(characteristic.value);
        const barcode = raw.replace(/[\r\n]/g, '').trim();
        if (barcode.length > 0) {
          onBarcode(barcode);
        }
      },
    );
  }

  async disconnect(): Promise<void> {
    this.subscription?.remove();
    this.subscription = null;
    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection().catch(() => {});
      this.connectedDevice = null;
    }
  }

  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  connectedDeviceId(): string | null {
    return this.connectedDevice?.id ?? null;
  }

  destroy(): void {
    this.disconnect();
    this.manager?.destroy();
    this.manager = null;
  }
}

// iOS requires BLE permissions only for central-role scanning.
// On Android API < 31, location permission is also required for BLE scans.
export const IS_IOS = Platform.OS === 'ios';

export const bleScannerService = new BleScannerService();
