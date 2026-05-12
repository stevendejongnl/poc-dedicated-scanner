#import <React/RCTBridgeModule.h>
#import <ExternalAccessory/ExternalAccessory.h>

@interface BluetoothAccessoryPicker : NSObject <RCTBridgeModule>
@end

@implementation BluetoothAccessoryPicker

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(showPicker:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [[EAAccessoryManager sharedAccessoryManager]
      showBluetoothAccessoryPickerWithNameFilter:nil
      completion:^(NSError *error) {
        if (!error || error.code == EABluetoothAccessoryPickerAlreadyConnected) {
          resolve(nil);
        } else if (error.code == EABluetoothAccessoryPickerResultCancelled) {
          reject(@"USER_CANCELED", error.localizedDescription, error);
        } else if (error.code == EABluetoothAccessoryPickerResultNotFound) {
          reject(@"NO_ACCESSORIES_FOUND", error.localizedDescription, error);
        } else {
          reject(@"NOT_SUPPORTED", error.localizedDescription, error);
        }
      }];
  });
}

RCT_EXPORT_METHOD(getConnectedAccessories:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  NSArray<EAAccessory *> *accessories = [[EAAccessoryManager sharedAccessoryManager] connectedAccessories];
  NSMutableArray *result = [NSMutableArray array];
  for (EAAccessory *acc in accessories) {
    [result addObject:@{
      @"name": acc.name ?: @"",
      @"manufacturer": acc.manufacturer ?: @"",
      @"modelNumber": acc.modelNumber ?: @"",
      @"serialNumber": acc.serialNumber ?: @"",
      @"firmwareRevision": acc.firmwareRevision ?: @"",
      @"hardwareRevision": acc.hardwareRevision ?: @"",
      @"connectionID": @(acc.connectionID),
      @"protocolStrings": acc.protocolStrings ?: @[],
    }];
  }
  resolve(result);
}

+ (BOOL)requiresMainQueueSetup { return NO; }

@end
