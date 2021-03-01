import { PlatformAccessory } from 'homebridge';
import { RokuClient, RokuDeviceInfo } from 'roku-client';

export interface RokuContext {
  device: RokuClient;
  info: RokuDeviceInfo;
}

export type RokuPlatformAccessory = PlatformAccessory & {
  context: RokuContext;
};
