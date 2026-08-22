# Testing

Run `shopify theme check` before every release. Test at 320, 375, 430, 768, 1024, 1280, 1440, and 1920 pixels.

Commerce coverage:

- Products with one variant, multiple options, sold-out variants, media per variant, unit pricing, discounts, video, and 3D models.
- Quick add, regular product forms, dynamic checkout, quantity changes, removal, cart notes, empty cart, errors, and browser back/forward after filtering.
- Search across products and non-product resources, zero results, pagination, localization, currencies, and long translated content.

Accessibility coverage:

- Complete a purchase path using only a keyboard.
- Confirm drawer/modal focus trapping, Escape close, focus return, live announcements, logical headings, visible focus, text zoom to 200%, and reduced motion.
- Run Lighthouse on populated home, collection, and product pages; Theme Store minimum averages are 60 performance and 90 accessibility.

Performance coverage:

- Confirm the hero and first product media are eager/high priority while below-fold media is lazy.
- Inspect layout shifts, unused apps, image sizes, long Liquid loops, and network requests.
