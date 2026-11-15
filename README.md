# GlutenOff POS Preview

A public static-hosting mirror of the GlutenOff POS frontend.

- Hosted with GitHub Pages and GitHub Actions.
- Connects to the configured Supabase project.
- Uses the Supabase browser publishable key only; never add service-role credentials.
- The POS requires an authenticated Supabase user and appropriate Row Level Security policies.
- Web Bluetooth printing requires a compatible browser such as Bluefy on iPadOS and a secure HTTPS origin.

## Deployment

Every push to `main` deploys the static site. The workflow publishes this repository root as-is.

## Security note

This repository contains frontend code and public browser configuration only. Do not add database dumps, service-role keys, private credentials, customer data, or operational exports.
