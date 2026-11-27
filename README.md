# Roots

Mobile-first demo of John's first steps after a move to Berlin.

## Run locally

Serve the static site with `python3 -m http.server 8080 --directory dist` and open http://localhost:8080.

## Deploy with Vercel

Import the GitHub repository into Vercel. The root `vercel.json` serves `dist` as a static site and skips the build. Add the production domain in the Vercel dashboard when ready.

The legal page is a draft. Before public launch, complete the operator details and confirm the privacy disclosure for the actual hosting setup. If integrating analytics, login or remote storage, revisit the disclosure and applicable consent requirements.

## Accounts and scenarios

The demo stores progress in the browser. Browser storage is tied to the deployment origin. Visitors can choose device persistence or session-only use. A future accounts feature can add an external identity provider and an authenticated data API, with progress scoped to each account and scenario. Keep the demo reachable without login and credentials out of static assets.
