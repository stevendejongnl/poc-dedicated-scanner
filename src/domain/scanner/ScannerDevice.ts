export type ScannerMode = 'hid' | 'ble';

export interface HidDevice {
  mode: 'hid';
  /** Friendly name from the OS bonded-device list (Android only; empty on iOS) */
  name: string;
  /** Bluetooth MAC (Android only; empty on iOS) */
  address: string;
  /** Raw Bluetooth device class integer (Android only; 0 on iOS) */
  deviceClass: number;
}

export interface BleDevice {
  mode: 'ble';
  id: string;
  name: string | null;
  rssi: number | null;
}

export type ScannerDevice = HidDevice | BleDevice;
