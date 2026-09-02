# VEYLUNE

VEYLUNE is an original Shopify Online Store 2.0 theme built around an editorial commerce canvas: asymmetric storytelling, restrained typography, tactile product discovery, and native commerce interactions without third-party frontend dependencies.

## Development

Requirements: Shopify CLI and access to a development store.

```sh
shopify theme dev
shopify theme check
shopify theme push --unpublished
```

The uploadable theme directories are `assets`, `blocks`, `config`, `layout`, `locales`, `sections`, `snippets`, and `templates`. Exclude `docs`, this README, and development dotfiles when preparing a Theme Store zip.

## Architecture

- `layout/theme.liquid`: SEO, social metadata, section groups, global assets, and app-compatible Shopify output.
- `assets`: split CSS design system and small native custom elements for drawers, cart, products, filtering, search, and media.
- `sections`: 30+ page, commerce, editorial, and utility sections.
- `snippets`: product cards, price, media, variants, cart items, responsive images, icons, localization, and metadata.
- `templates`: JSON templates for required storefront routes plus FAQ and story page compositions.

VEYLUNE uses the `nx-` prefix for CSS classes and custom elements. Its Ajax interactions publish internal `cart:changed` events through `window.NXTheme.events`.

## Product data

Optional product badge: create a product metafield with namespace and key `custom.badge`, using a single-line text type. The theme safely omits it when absent. Product ratings use Shopify's standard `reviews.rating` and `reviews.rating_count` metafields and remain hidden when rating data is absent. Review apps can still render through app blocks.

## Testing

Run Theme Check, validate JSON, test product variants and cart changes with multiple product types, and cover keyboard-only drawer/modal operation. See `docs/TESTING.md` for the complete matrix.
