import {NativeModules, Platform} from 'react-native';

export type PickerErrorCode =
  | 'NO_ACCESSORIES_FOUND'
  | 'USER_CANCELED'
  | 'NOT_SUPPORTED'
  | 'PLATFORM_UNSUPPORTED'
  | 'UNKNOWN';

export interface ConnectedAccessory {
  name: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  firmwareRevision: string;
  hardwareRevision: string;
  connectionID: number;
  protocolStrings: string[];
}

export async function showBluetoothAccessoryPicker(): Promise<void> {
  if (Platform.OS !== 'ios') {
    const err = Object.assign(new Error('iOS only'), {code: 'PLATFORM_UNSUPPORTED' as PickerErrorCode});
    throw err;
  }
  return NativeModules.BluetoothAccessoryPicker.showPicker();
}

export async function getConnectedAccessories(): Promise<ConnectedAccessory[]> {
  if (Platform.OS !== 'ios') {
    return [];
  }
  return NativeModules.BluetoothAccessoryPicker.getConnectedAccessories();
}
