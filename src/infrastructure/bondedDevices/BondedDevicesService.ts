import {Platform} from 'react-native';
import type {HidDevice} from '@/domain/scanner/ScannerDevice';

/** Bluetooth device class for HID keyboards (0x0540 = major class Peripheral, minor class Keyboard) */
const KEYBOARD_CLASS = 0x0540;

function isKeyboardClass(deviceClass: number): boolean {
  // Major device class occupies bits 8-12; minor adds bits 2-7.
  // Mask the major class to catch all keyboard-type peripherals.
  return (deviceClass & 0x1f00) === 0x0500;
}

export async function getBondedDevices(): Promise<HidDevice[]> {
  if (Platform.OS !== 'android') {
    return [];
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RNBluetoothClassic = (require('react-native-bluetooth-classic') as any).default;
    const bonded = await RNBluetoothClassic.getBondedDevices();

    return bonded.map((d: any) => ({
      mode: 'hid' as const,
      name: d.name ?? d.address,
      address: d.address,
      deviceClass: d.deviceClass ?? 0,
    }));
  } catch {
    return [];
  }
}

export function deviceClassLabel(deviceClass: number): string {
  if (isKeyboardClass(deviceClass)) {
    return 'Keyboard / Scanner';
  }
  if ((deviceClass & 0x1f00) === 0x0200) {
    return 'Phone';
  }
  if ((deviceClass & 0x1f00) === 0x0400) {
    return 'Audio / Headset';
  }
  if ((deviceClass & 0x1f00) === 0x0100) {
    return 'Computer';
  }
  return `Unknown (0x${deviceClass.toString(16).toUpperCase()})`;
}

export {isKeyboardClass, KEYBOARD_CLASS};
