# Theme rename procedure

The Theme Store parent name is defined by three coupled values:

- `theme_info.theme_name` in `config/settings_schema.json`
- the matching parent preset key in `config/settings_data.json`
- the matching kebab-case directory under `listings/`

Keep these values synchronized. After the final unique name has been approved, run:

```sh
node scripts/rename-theme.mjs "Final Name"
```

The script validates Shopify's basic name format, changes the parent theme and preset together, and moves the listing directory to the corresponding slug. It intentionally does not change `theme_author`, documentation prose, CSS comments, JavaScript/CSS namespaces, or storefront fallback copy. Review those separately because they might identify the partner or be stable implementation names rather than the Theme Store product name.

After renaming, run `shopify theme check`, package with `shopify theme package`, and inspect the generated ZIP before uploading. Shopify does not allow the theme or preset names to be changed after upload.
