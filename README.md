# homebridge-roku

[![npm][npm]][npm-url]

Control your Roku media player from your iOS devices using apple's HomeKit. See
[homebridge](https://github.com/nfarina/homebridge) for more information
controlling 3rd party devices through HomeKit.

_homebridge-roku requires iOS 12.2 or later_

## Installation

Make sure that [homebridge is installed][homebridge-install] first, then:

1. Install globally by running `npm install -g homebridge-roku@latest`
2. Ensure Roku device is turned on
3. Update config file with Roku info by running `homebridge-roku-config --merge`

### Additional Installation Info

A config file must exist at `~/.homebridge/config.json`. See the
[sample config file](https://github.com/nfarina/homebridge/blob/master/config-sample.json)
for an example.

You can run `homebridge-roku-config` by itself to print out the homebride-roku
config and manually add it to `~/.homebridge/config.json` if you prefer.

Any time you install a new app, repeat step 3 to update the config file with the
app's info. You can also remove apps from the generated config's inputs section
if you don't want to be able to launch them with Siri.

See
[homebridge#installing-plugins](https://github.com/homebridge/homebridge#installing-plugins)
for more information.

## Available Commands

The built in iOS remote needs to be enabled to use it:

`Settings > Control Center > Customize Controls > Apple TV Remote`

This will allow you to access the remote from Control Center.

## Configuration

The command invocations can be modified by setting the `name` field in the
accessory section of the config. The setup script sets it to `Roku`, but it can
be set to whatever you want it to be. The invocations listed above would then
use the name configured instead of `Roku`.

### inputs

The list of inputs that your TV supports is generated when you run the
`homebridge-roku-config` setup. When you add/remove inputs on your TV, you may
need to re-run `homebridge-roku-config` to get them to show up in homekit. If
you would like to hide certain inputs, such as FandangoNOW or HDMI ARC, you can
remove them from the list of inputs in your config.

### volumeIncrement / volumeDecrement

The amount that volume will be increased or decreased per volume up/down command
can be set in the config. By default, both up and down will be done in
increments of 1. To change this, there are two settings: `volumeIncrement` and
`volumeDecrement`. If only `volumeIncrement` is set, then both volume up and
down will change by the same amount.

### infoButtonOverride

The iOS control center remote isn't that great - it only gives you access to the
arrows, `ok`, `play/pause`, `back`, and `info`. To make it a little more useful,
you can override the functionality of the `info` button to whatever key you
want. For example, to make it behave as the `home` button, add this to your
homebridge config for your Roku accessory: `"infoButtonOverride": "HOME"`. The
list of possible keys can be found
[here](https://github.com/bschlenk/node-roku-client/blob/master/lib/keys.ts).

### requestTimeout

Wait for this value in milliseconds before considering the device unreachable. The default value is 1000 (1 second).

## Migrating Major Versions

### 2.x.x -> 3.x.x

This release focuses on supporting iOS 12.2's new television homekit service.

The `appMap` field of the config file has been renamed `inputs` and is now an
array of objects. This change is to support the television service, which
requires inputs have stable, sequential ids. Running
`homebridge-roku-config --merge` after upgrading to version 3 should add the new
`inputs` field. You should be able to remove the now unused `appMap` section
from your config.

This plugin now requires a minimum of
[Homebridge v1.0.0](https://github.com/homebridge/homebridge/releases/tag/1.0.0),
and NodeJS v10.17.0. Please refer to the [homebridge installation
guide][homebridge-install] for instructions on installing a supported version of
NodeJS on your platform.

### 1.x.x -> 2.x.x

Roku info now comes back camelcase, and code expects camelcase. Running
`homebridge-roku-config --merge` now merges accessory configs if they have the
same `name` field, so running this once should be enough to upgrade to `2.x.x`.

## Contributing

There are many versions of Roku devices, each with a different feature set. In
order to support features across all these devices, it would be helpful to see
what config values each one exposes. If you would like to help out, feel free to
add your config to
[this issue](https://github.com/bschlenk/homebridge-roku/issues/9). You can
replace any fields you think are private with "\<redacted\>".

## Limitations

The current volume level can't be queried, so you can't ask for the volume to be
set to a specific value, only relative values can be used. This could be
overcome by sending 100 volume down requests before sending X amount of volume
up requests. I didn't feel like implementing this for obvious reasons, but pull
requests are welcome :)

## TODO

- Possibly fetch apps at homebridge start time or periodically so that the
  config generator doesn't need to be run when new channels are installed.
- Document the different Siri invocations

[npm]: https://img.shields.io/npm/v/homebridge-roku.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/homebridge-roku
[homebridge-install]: https://github.com/homebridge/homebridge#installation
