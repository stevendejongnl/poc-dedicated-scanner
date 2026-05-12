import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen} from '@/presentation/screens/HomeScreen';
import {HidScannerScreen} from '@/presentation/screens/HidScannerScreen';
import {BleDiscoveryScreen} from '@/presentation/screens/BleDiscoveryScreen';
import {DeviceInfoScreen} from '@/presentation/screens/DeviceInfoScreen';
import {DebugScreen} from '@/presentation/screens/DebugScreen';

export type RootStackParamList = {
  Home: undefined;
  HidScanner: undefined;
  BleDiscovery: undefined;
  DeviceInfo: undefined;
  Debug: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{headerTintColor: '#1A5276'}}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{title: 'BT Scanner PoC'}}
        />
        <Stack.Screen
          name="HidScanner"
          component={HidScannerScreen}
          options={{title: 'HID Scanner'}}
        />
        <Stack.Screen
          name="BleDiscovery"
          component={BleDiscoveryScreen}
          options={{title: 'BLE Scanner'}}
        />
        <Stack.Screen
          name="DeviceInfo"
          component={DeviceInfoScreen}
          options={{title: 'Bonded Devices'}}
        />
        <Stack.Screen
          name="Debug"
          component={DebugScreen}
          options={{title: 'BT Debug'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
