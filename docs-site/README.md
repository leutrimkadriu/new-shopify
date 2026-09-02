# VEYLUNE documentation site

This directory is a standalone static documentation site for VEYLUNE. It uses relative URLs, requires no build step, and works from a GitHub Pages project subpath.

## Recommended deployment: GitHub Actions

The repository already contains Shopify theme source at its root, so deploying only `docs-site/` with GitHub Actions is safer than moving the documentation into `/docs`. The included workflow uploads only this directory and does not alter the theme ZIP.

1. Confirm the support email in `support.html` is current.
2. Commit and push the site and `.github/workflows/docs-pages.yml` to the default branch.
3. On GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Open the repository’s **Actions** tab and run **Deploy VEYLUNE documentation to Pages**, or push a change under `docs-site/`.
6. When the workflow completes, open the URL shown in the deployment summary.

For the current remote (`leutrimkadriu/new-shopify`), the expected URLs are:

- Documentation: `https://leutrimkadriu.github.io/new-shopify/`
- Support: `https://leutrimkadriu.github.io/new-shopify/support.html`
- Changelog: `https://leutrimkadriu.github.io/new-shopify/changelog.html`

These URLs become active only after GitHub Pages is enabled and the workflow deploys successfully.

## Local preview

From the repository root:

```sh
python3 -m http.server 8080 --directory docs-site
```

Then open the local address printed by the server.

## Other deployment options

- **Pages from `/docs`:** not recommended here because the existing `/docs` directory contains project documentation and colocating the public site would blur the Shopify-theme boundary.
- **Separate branch:** viable, but it requires maintaining generated branch contents and is easier to deploy incorrectly.
- **GitHub Actions:** recommended because the deployment artifact is explicitly scoped to `docs-site/`.

Shopify CLI packages only supported theme directories. `docs-site/` and `.github/` are not included by `shopify theme package`.
