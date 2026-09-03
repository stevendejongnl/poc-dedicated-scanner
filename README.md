# PoC: Dedicated Scanner

A React Native proof of concept for connecting a dedicated Bluetooth barcode
scanner to a mobile app on both iOS and Android, and reading out scanned
barcodes in real time.

Bluetooth barcode scanners generally show up in one of two modes, and this
app supports both:

- **HID / keyboard-wedge mode** — the scanner pairs like a Bluetooth keyboard
  via the OS Bluetooth settings and "types" each scanned barcode followed by
  Enter. The app captures this with a hidden, always-focused text input and a
  buffer (`HidCaptureBuffer`) that reassembles the fast character stream into
  discrete barcodes, flushing on Enter/CR or after a short idle timeout for
  scanners configured without a terminator.
- **BLE GATT mode** — the scanner advertises as a BLE peripheral and is
  scanned for and connected to directly from within the app (via
  `react-native-ble-plx`), without leaving the app or using OS Bluetooth
  settings. On connect, all services/characteristics are discovered and any
  notifiable/indicatable characteristic is subscribed to; incoming values are
  decoded and emitted as barcodes.

## Hardware

Scanner used for testing: [NETUM C750 — Bluetooth 2D barcode scanner](https://nl.aliexpress.com/item/1005006861040474.html)
(pocket-sized, decodes 1D/QR/PDF417/Data Matrix, connects via Bluetooth or USB).

## Features

- **Home** — choose HID or BLE mode; auto-reconnects to the last-used BLE
  device on launch (preference persisted with `AsyncStorage`).
- **HID Scanner** — live scan log while the scanner is paired via Bluetooth
  Settings, with a shortcut to open those settings.
- **BLE Scanner** — scan for, connect to, and disconnect from nearby BLE
  devices, with a live scan log.
- **Bonded Devices** (Android only) — lists all Bluetooth devices paired with
  the phone and flags ones with a keyboard device class as likely scanners.
- **BT Debug** — inspects MFi accessories via iOS's `EAAccessoryManager`
  (native module `BluetoothAccessoryPicker.m`), lists nearby raw BLE
  peripherals, and shows discovered GATT services/characteristics for a
  connected device.

## Project structure

```
src/
  domain/scanner/        # ScannerDevice, ScanEvent types
  infrastructure/
    ble/                  # BleScannerService (react-native-ble-plx)
    hid/                  # HidCaptureBuffer, BluetoothAccessoryPicker bridge
    bondedDevices/        # Android bonded-device inspection
    storage/              # ScannerPreferences (AsyncStorage)
  presentation/
    screens/              # Home, HidScanner, BleDiscovery, DeviceInfo, Debug
    components/           # HiddenScannerInput, ScanLog
    navigation/           # AppNavigator (React Navigation stack)
```

## Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

Start the Metro dev server:

```sh
npm start
```

Then, in another terminal, build and run on a platform:

```sh
npm run android
# or
npm run ios
```

For iOS, install CocoaPods dependencies first (only needed on first clone or
after updating native deps):

```sh
bundle install
bundle exec pod install
```

Other useful scripts: `npm test`, `npm run lint`, `npm run typecheck`.

## Learn More

- [React Native Website](https://reactnative.dev)
- [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx)
