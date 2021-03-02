# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [4.0.0-beta.2](https://github.com/bschlenk/homebridge-roku/compare/v4.0.0-beta.1...v4.0.0-beta.2) (2021-03-02)


### Bug Fixes

* eslint settings ([f3b1d90](https://github.com/bschlenk/homebridge-roku/commit/f3b1d90c2548a34d62a12fd2286e32c24de88b3b))

## [4.0.0-beta.1](https://github.com/bschlenk/homebridge-roku/compare/v4.0.0-beta.0...v4.0.0-beta.1) (2021-03-02)


### Bug Fixes

* typo in eslint config ([aa89f62](https://github.com/bschlenk/homebridge-roku/commit/aa89f62bc781901d2717e983ac23f1d765549b56))

## [4.0.0-beta.0](https://github.com/bschlenk/homebridge-roku/compare/v3.0.0-alpha.1...v4.0.0-beta.0) (2021-03-02)

Complete rewrite using Homebridge's platform api.

### ⚠ BREAKING CHANGES

* no more `homebridge-roku-setup` script, devices are discovered automatically
* requires minimum of homebridge 1.3.0

### Features

* all roku devices are discovered "automatically"
  * devices must be manually added following the [Homebridge TV instructions][1]
* platform config affects all discovered devices
* config supports the following options:
  * discoverTimeout
  * syncTimeout
  * volumeIncrement
  * volumeDecrement
  * infoButtonOverride
  * excludeInputs
* include a config.schema.json file so it is picked up by homebridge UI

### Bug Fixes

* Roku devices now use the TV icon

[1]: https://github.com/homebridge/homebridge/wiki/Connecting-Homebridge-To-HomeKit#how-to-add-homebridge-cameras--tvs


### [3.0.1](https://github.com/bschlenk/homebridge-roku/compare/v3.0.0...v3.0.1) (2020-06-01)


### Docs

* update npm badge in README ([de02926](https://github.com/bschlenk/homebridge-roku/commit/de029267bfe05750ab787e977fc2c18bb2a22ae8))


## [3.0.0](https://github.com/bschlenk/homebridge-roku/compare/v3.0.0-alpha.1...v3.0.0) (2020-06-01)


### ⚠ BREAKING CHANGES

* Now requires a minimum of NodeJS v10.17.0
* Now requires a minimum of homebridge v1.0.0
* appMap config replaced with inputs

### Features

* add infoButtonOverride config ([67ae14b](https://github.com/bschlenk/homebridge-roku/commit/67ae14b7e058d627635f0012d9b457930ea44cfc))
* change default volume increment to 1 ([b6a1d1f](https://github.com/bschlenk/homebridge-roku/commit/b6a1d1f952bbc74713a51e015006b9b27e09a9ea))
* merge config in more logical order ([f5d7f87](https://github.com/bschlenk/homebridge-roku/commit/f5d7f8762a944430e9c093fec09c600fbbfbae1b))


### Bug Fixes

* eslint errors ([f8029f4](https://github.com/bschlenk/homebridge-roku/commit/f8029f4b244cc9549942f575a25b66ee28454168))
* throw helpful error if hap-nodejs can't be imported ([10d413a](https://github.com/bschlenk/homebridge-roku/commit/10d413ade2bf5942d9befef0806deacd6aa67904))
* use injected hap instead of requiring ([5446afb](https://github.com/bschlenk/homebridge-roku/commit/5446afb8971f4cd4a148a1086f53333f692c60d8))
* uuid error when isTV is false ([c1c67ca](https://github.com/bschlenk/homebridge-roku/commit/c1c67ca833206671387c6d7fdb9536ff846e0c0f))

<a name="3.0.0-alpha.1"></a>
# [3.0.0-alpha.1](https://github.com/bschlenk/homebridge-roku/compare/v3.0.0-alpha.0...v3.0.0-alpha.1) (2019-02-13)



<a name="3.0.0-alpha.0"></a>
# 3.0.0-alpha.0 (2019-02-12)


### Features

* add space between roku name and switch names ([37bc85a](https://github.com/bschlenk/homebridge-roku/commit/37bc85a))
* allow configuring volume increment ([f494999](https://github.com/bschlenk/homebridge-roku/commit/f494999))
* **hap-tv:** make setup script produce new style ordered inputs ([e093866](https://github.com/bschlenk/homebridge-roku/commit/e093866))
* **hap-tv:** more reliable toggling of power on/off ([c6b0925](https://github.com/bschlenk/homebridge-roku/commit/c6b0925))
* **hap-tv:** move to iOS 12.1 HAP television and input source services ([bc70333](https://github.com/bschlenk/homebridge-roku/commit/bc70333))
* **hap-tv:** set Firmware Version for Accessory Settings in Home ([48a547a](https://github.com/bschlenk/homebridge-roku/commit/48a547a))



<a name="2.1.0"></a>
# 2.1.0 (2018-11-26)


### Features

* add space between roku name and switch names ([37bc85a](https://github.com/bschlenk/homebridge-roku/commit/37bc85a))
* allow configuring volume increment ([f494999](https://github.com/bschlenk/homebridge-roku/commit/f494999))



<a name="2.0.1"></a>
## 2.0.1 (2018-11-26)
