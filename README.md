# homebridge-roku
Control your Roku media player from your iOS devices using apple's HomeKit. See [homebridge](https://github.com/nfarina/homebridge) for more information controlling 3rd party devices through HomeKit.

**NOTE**: This is a work in prgress. Much of this README documents what I would *like* homebridge-roku to do, not what it *actually* does. I will update it when I have everything fully working. 

## Installation
* Install globally by running `npm install -g homebridge-roku`
* Ensure Roku media player is turned on
* Generate config by running `homebridge-roku-config`
 * Re-run for any new channels added
* Merge config with existing `~/.homebridge/config.json` or start with the [sample config file](https://github.com/nfarina/homebridge/blob/master/config-sample.json).
* See [homebridge#installing-plugins](https://github.com/nfarina/homebridge#installing-plugins) for more information

## Available Commands
### Hey Siri...
* Turn on the Roku
* Turn off the Roku
* Set Roku to Netflix
* Set Roku to HDMI 1
* Set Roku to Wii
* Search Roku for... 

### For Roku TV only...
* Mute the Roku
* Unmute the Roku
* Increse the Roku's volume
* Decrease the Roku's volume
* Increase the Roku's volume by 5

## Limitations
I have only tested this with a [Roku TV](https://www.amazon.com/gp/product/B00SG473NO), so there may be more limitations I haven't come across... 

The TV cannot be powered on from a powered off state. This could be overcome by adding support for an ir blaster on a raspberry pi and pointing it at the TV.

The current volume level can't be queried, so you can't ask for the volume to be set to a specific value, only relative values can be used. This could be overcome by sending 100 volume down requests before sending X amount of volume up requests. I didn't feel like implementing this for obvious reasons, but pull requests are welcome :)

