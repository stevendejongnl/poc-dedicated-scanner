/**
 * Well-known BLE service/characteristic UUIDs for barcode scanners.
 * Most generic scanners advertise the Serial Port Profile over BLE (SPP-over-BLE)
 * or a custom notify characteristic. Socket Mobile devices use their own SDK;
 * generic scanners commonly use the UUIDs below.
 *
 * To add support for a new scanner: pair it, connect in the BLE discovery screen,
 * and use the "Inspect" button to see which service/characteristic sends data.
 */
export interface ScannerProfile {
  label: string;
  serviceUUID: string;
  characteristicUUID: string;
}

export const KNOWN_PROFILES: ScannerProfile[] = [
  {
    label: 'Generic SPP-over-BLE',
    serviceUUID: '0000FFE0-0000-1000-8000-00805F9B34FB',
    characteristicUUID: '0000FFE1-0000-1000-8000-00805F9B34FB',
  },
  {
    label: 'Generic NUS (Nordic UART)',
    serviceUUID: '6E400001-B5A3-F393-E0A9-E50E24DCCA9E',
    characteristicUUID: '6E400003-B5A3-F393-E0A9-E50E24DCCA9E',
  },
];

export const DEFAULT_PROFILE = KNOWN_PROFILES[0];
