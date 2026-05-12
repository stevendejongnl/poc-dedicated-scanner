import {BleManager, type Device, type Subscription, State} from 'react-native-ble-plx';
import {Platform} from 'react-native';
import type {BleDevice} from '@/domain/scanner/ScannerDevice';

export type BarcodeCallback = (barcode: string) => void;
export type ScanCallback = (device: BleDevice) => void;

export interface DiscoveredCharacteristic {
  serviceUUID: string;
  uuid: string;
  isNotifiable: boolean;
  isIndicatable: boolean;
  isReadable: boolean;
  isWritableWithResponse: boolean;
  isWritableWithoutResponse: boolean;
}

class BleScannerService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private subscriptions: Subscription[] = [];
  private discoveredCharacteristics: DiscoveredCharacteristic[] = [];

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
    this.discoveredCharacteristics = [];

    const services = await device.services();
    for (const service of services) {
      const chars = await service.characteristics();
      for (const char of chars) {
        this.discoveredCharacteristics.push({
          serviceUUID: service.uuid,
          uuid: char.uuid,
          isNotifiable: char.isNotifiable,
          isIndicatable: char.isIndicatable,
          isReadable: char.isReadable,
          isWritableWithResponse: char.isWritableWithResponse,
          isWritableWithoutResponse: char.isWritableWithoutResponse,
        });

        if (char.isNotifiable || char.isIndicatable) {
          const sub = char.monitor((error, characteristic) => {
            if (error || !characteristic?.value) {
              return;
            }
            // Decode base64 → strip control chars → emit if non-empty
            const raw = atob(characteristic.value);
            // eslint-disable-next-line no-control-regex
            const barcode = raw.replace(/[\x00-\x1F\x7F]/g, '').trim();
            if (barcode.length > 0) {
              onBarcode(barcode);
            }
          });
          this.subscriptions.push(sub);
        }
      }
    }
  }

  getDiscoveredCharacteristics(): DiscoveredCharacteristic[] {
    return this.discoveredCharacteristics;
  }

  async disconnect(): Promise<void> {
    this.subscriptions.forEach(s => s.remove());
    this.subscriptions = [];
    this.discoveredCharacteristics = [];
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

export const IS_IOS = Platform.OS === 'ios';

export const bleScannerService = new BleScannerService();
