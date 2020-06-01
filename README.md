# homebridge-roku

[![npm][npm]][npm-url]

Control your Roku media player from your iOS devices using apple's HomeKit. See
[homebridge](https://github.com/nfarina/homebridge) for more information
controlling 3rd party devices through HomeKit.

## Alpha Version

You are reading the documentation for homebridge-roku alpha. This
version **only** works with iOS 12.2 and above. Visit
[beta.apple.com](https://beta.apple.com/sp/betaprogram/) for
instructions on iOS 12.2 beta.

Visit the
[master](https://github.com/bschlenk/homebridge-roku/tree/master) branch
for the latest stable version.

## Installation

1. Install globally by running `npm install -g homebridge-roku@next`
2. Ensure Roku device is turned on
3. Update config file with Roku info by running `homebridge-roku-config --merge`

### Additional Installation Info

A config file must exist at `~/.homebridge/config.json`. See the [sample config
file](https://github.com/nfarina/homebridge/blob/master/config-sample.json) for
an example.

You can run `homebridge-roku-config` by itself to print out the homebride-roku
config and manually add it to `~/.homebridge/config.json` if you prefer.

Any time you install a new app, repeat step 3 to update the config file with the
app's info. You can also remove apps from the generated config if you don't want
to be able to launch them with Siri.

See
[homebridge#installing-plugins](https://github.com/nfarina/homebridge#installing-plugins)
for more information.

## Available Commands

The built in iOS remote needs to be enabled to use it:

`Settings > Control Center > Customize Controls > Apple TV Remote`

This will allow you to access the remote from Control Center.

As iOS 12.2 is still in beta, the available Siri commands are still
changing and I haven't had time to document them.

## Configuration

The command invocations can be modified by setting the `name` field in the
accessory section of the config. The setup script sets it to `Roku`, but it can
be set to whatever you want it to be. The invocations listed above would then
use the name configured instead of `Roku`.

The amount that volume will be increased or decreased per volume up/down command
can be set in the config. By default, both up and down will be done in
increments of 5. To change this, there are two settings: `volumeIncrement` and
`volumeDecrement`. If only `volumeIncrement` is set, then both volume up and
down will change by the same amount.

### infoButtonOverride

The iOS control center remote isn't that great - it only gives you access to the
arrows, `ok`, `play/pause`, `back`, and `info`. To make it a little more useful, you can
override the functionality of the `info` button to whatever key you want. For
example, to make it behave as the `home` button, add this to your homebridge
config for your Roku accessory: `"infoButtonOverride": "HOME"`. The list of
possible keys can be found
[here](https://github.com/bschlenk/node-roku-client/blob/master/lib/keys.ts).

## Helping Out

There are many versions of Roku devices, each with a different feature set. In
order to support features across all these devices, it would be helpful to see
what config values each one exposes. If you would like to help out, feel free to
add your config to [this
issue](https://github.com/bschlenk/homebridge-roku/issues/9). You can replace
any fields you think are private with "\<redacted\>".

## Limitations

I have only tested this with a [Roku
TV](https://www.amazon.com/gp/product/B00SG473NO), so there may be more
limitations I haven't come across...

The TV cannot be powered on from a powered off state. This could be overcome by
adding support for an ir blaster on a raspberry pi and pointing it at the TV.
EDIT: According to some, newer Roku TV models support an "ECO" or "Fast TV Start"
mode that allows the TV to be turned on from standby. The current "Turn on RokuPower"
command might just work as is for those, but I have no way of testing because I have
an older model.

The current volume level can't be queried, so you can't ask for the volume to be
set to a specific value, only relative values can be used. This could be
overcome by sending 100 volume down requests before sending X amount of volume
up requests. I didn't feel like implementing this for obvious reasons, but pull
requests are welcome :)

## Migrating Major Versions

I'm trying to follow strict semver, so major version bumps indicate a breaking
change.

### 2.x.x -> 3.x.x

Currently in alpha, this release focuses on supporting iOS 12.2's new
television homekit service.

The `appMap` field of the config file has been renamed `inputs` and is
now an array of objects. This change is to support the television
service, which requires inputs have stable, sequential ids.

### 1.x.x -> 2.x.x

Roku info now comes back camelcase, and code expects camelcase. Running
`homebridge-roku-config --merge` now merges accessory configs if they have the
same `name` field, so running this once should be enough to upgrade to `2.x.x`.

## TODO

- Possibly fetch apps at homebridge start time or periodically so that the
  config generator doesn't need to be run when new channels are installed.

[npm]: https://img.shields.io/npm/v/homebridge-roku/next.svg?logo=npm
[npm-url]: https://npmjs.com/package/homebridge-roku/v/next
