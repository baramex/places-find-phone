# places-find-phone
find company's phone number thanks to the places api from google

## Infos
[![](https://tokei.rs/b1/github/baramex/places-find-phone)]()<br/>
[![](https://img.shields.io/github/languages/top/baramex/places-find-phone?style=for-the-badge)]()

[![](https://img.shields.io/github/downloads/baramex/places-find-phone/total?style=for-the-badge)](https://github.com/baramex/places-find-phone/releases/)
[![](https://img.shields.io/github/v/release/baramex/places-find-phone?style=for-the-badge&label=last%20release)](https://github.com/baramex/places-find-phone/releases/latest/)
[![](https://img.shields.io/github/release-date/baramex/places-find-phone.svg?style=for-the-badge&label=last%20release%20date)](https://github.com/baramex/places-find-phone/releases/latest/)

[![](https://img.shields.io/github/license/baramex/places-find-phone?style=for-the-badge)](https://choosealicense.com/licenses/lgpl-3.0/)
[![](https://img.shields.io/badge/author-baramex-red?style=for-the-badge)](https://github.com/baramex/)

## Download
[![](https://img.shields.io/github/v/release/baramex/places-find-phone?style=for-the-badge&label=last%20release)](https://github.com/baramex/places-find-phone/releases/latest/)<br/>

## Usage
- install node js and run `npm i`
- add `createCredentials(["/phone-number"]);` at the end of the script
- run once `node index.js`, then stop
- remove the line (createCre...) and rerun the script
- pick up your token in credentials.json and made an authenticated get request to `localhost:5600/phone-number` with `company` and `address` queries
- and you can install it on a vps !
