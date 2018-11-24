# homebridge-roku

[![npm
version](https://badge.fury.io/js/homebridge-roku.svg)](https://badge.fury.io/js/homebridge-roku)

Control your Roku media player from your iOS devices using apple's HomeKit. See
[homebridge](https://github.com/nfarina/homebridge) for more information
controlling 3rd party devices through HomeKit.

## Installation

1. Install globally by running `npm install -g homebridge-roku`
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

These commands are subject to change and sort of awkward right now. If I have
more time to research homebridge I might try to improve them, but I probably
won't. Feel free to send pull requests with improvements.

### Hey Siri...

- Turn on Roku Power
- Turn off Roku Power
- Turn on Roku Mute
- Turn off Roku Mute
- Turn on Roku VolumeUp
- Turn on Roku VolumeDown
- Turn on Roku Netflix
- Turn on Roku {app name}

## Configuration

The command invocations can be modified by setting the `name` field in the
accessory section of the config. The setup script sets it to `Roku`, but it can
be set to whatever you want it to be. The invocations listed above would then
use the name configured instead of `Roku`.

The amount that volume will be increased or decreased per volume up/down command
can be set in the config. By default, both up and down will be done in
increments of 5. To change this, there are two settings: `volumeIncrement` and
`volumeDecrement`. If only `volumeIncrement` is set, then both volume up and
down will change by the same abount.

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
EDIT: According to some, newer Roku TV models support an "ECO" mode that allows
the TV to be turned on all the time. The current "Turn on RokuPower" command
might just work as is for those, but I have no way of testing because I have an
older model.

The current volume level can't be queried, so you can't ask for the volume to be
set to a specific value, only relative values can be used. This could be
overcome by sending 100 volume down requests before sending X amount of volume
up requests. I didn't feel like implementing this for obvious reasons, but pull
requests are welcome :)

Homekit doesn't support the speaker service right now which is why volume has
been done using a switch. When it (if ever) does support the speaker service,
volume will be hopefuly be much more natural, as in "Set RokuVolume to 70" or
"Increase RokuVolume by 10".

## Migrating Major Versions

I'm trying to follow strict semver, so major version bumps indicate a breaking
change.

### 1.x.x -> 2.x.x

Roku info now comes back camelcase, and code expects camelcase. Running
`homebridge-roku-config --merge` now merges accessory configs if they have the
same `name` field, so running this once should be enough to upgrade to `2.x.x`.

## TODO

- Possibly fetch apps at homebridge start time or periodically so that the
  config generator doesn't need to be run when new channels are installed.
- Figure out a better way to name the commands, if possible. For example, "Mute
  the Roku" instead of "Turn on RokuMute".
