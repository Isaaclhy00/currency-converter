# Currency Converter

A cross-platform React Native currency converter built with Expo and TypeScript.

## Features

- Convert between supported currencies with a searchable currency picker.
- Keep common currencies at the top and sort other currencies by country.
- Swap the source and target currencies.
- View a 30-day rate history chart for the selected pair.
- Cache rates and history on the device for offline fallback.

## Getting started

Install dependencies and start the Expo development server:

```sh
npm ci
npm start
```

Use the Expo Go app to scan the QR code, or start a platform target with
`npm run android`, `npm run ios`, or `npm run web`.

Fresh rates and history require an internet connection. If a request fails,
the app can use previously saved data.

Run the checks with:

```sh
npm test
npm run typecheck
```
