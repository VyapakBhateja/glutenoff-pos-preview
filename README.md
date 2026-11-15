# GlutenOff POS Preview

A public static-hosting mirror of the GlutenOff POS frontend.

- Hosted with GitHub Pages and GitHub Actions.
- Runtime files are synchronized automatically from `develop` in the private canonical repository `VyapakBhateja/glutenoff-pos`.
- The preview repository's `develop` branch is deployment-only; do not develop application changes here.
- Connects to the configured Supabase project.
- Uses the Supabase browser publishable key only; never add service-role credentials.
- The POS requires an authenticated Supabase user and appropriate Row Level Security policies.
- Web Bluetooth printing requires a compatible browser such as Bluefy on iPadOS and a secure HTTPS origin.

## Deployment

Every push to this repository's `develop` branch deploys the static site to GitHub Pages. The Pages workflow publishes the repository root. The canonical repository sync workflow updates only `index.html`, `config.js`, and `src/**`, preserving this repository's deployment workflow and documentation.

## Security note

This repository contains frontend code and public browser configuration only. Do not add database dumps, service-role keys, private credentials, customer data, or operational exports.

## QR release status

Dynamic UPI receipt QR is part of the deployed preview build and has been physically validated by the project owner on the iPadOS + Bluefy + SEZNIK MiniX setup. The QR raster compatibility fix is included in the deployed runtime.

Deployment evidence: [GitHub Actions run #4](https://github.com/VyapakBhateja/glutenoff-pos-preview/actions/runs/43740066394).
