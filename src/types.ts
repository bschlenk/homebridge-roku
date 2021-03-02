import { PlatformAccessory, PlatformConfig } from 'homebridge';
import { RokuClient, RokuDeviceInfo, Keys } from 'roku-client';

export interface RokuContext {
  device: RokuClient;
  info: RokuDeviceInfo;
}

export type RokuPlatformAccessory = PlatformAccessory & {
  context: RokuContext;
};

export interface RokuPlatformConfig extends PlatformConfig {
  discoverTimeout?: number;
  syncTimeout?: number;
  volumeIncrement?: number;
  volumeDecrement?: number;
  infoButtonOverride?: keyof typeof Keys;
  excludeInputs?: string[];
}
