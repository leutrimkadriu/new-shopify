#!/usr/bin/env node

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const schemaPath = resolve(root, 'config/settings_schema.json');
const dataPath = resolve(root, 'config/settings_data.json');
const requestedName = process.argv.slice(2).join(' ').trim();

if (!/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(requestedName) || requestedName.length >= 30) {
  console.error('Usage: node scripts/rename-theme.mjs "New Name"');
  console.error('The name must be 1-2 alphabetic words, separated by one space, and under 30 characters.');
  process.exit(1);
}

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const themeInfo = schema.find((group) => group.name === 'theme_info');

if (!themeInfo?.theme_name) {
  throw new Error('config/settings_schema.json has no theme_info.theme_name value.');
}

const oldName = themeInfo.theme_name;
const settingsData = JSON.parse(readFileSync(dataPath, 'utf8'));

if (!Object.hasOwn(settingsData.presets ?? {}, oldName)) {
  throw new Error(`No preset named "${oldName}" matches the current parent theme.`);
}

if (oldName !== requestedName && Object.hasOwn(settingsData.presets, requestedName)) {
  throw new Error(`A preset named "${requestedName}" already exists.`);
}

const toSlug = (name) => name.toLowerCase().replace(/ /g, '-');
const oldListing = resolve(root, 'listings', toSlug(oldName));
const newListing = resolve(root, 'listings', toSlug(requestedName));

if (!existsSync(oldListing)) {
  throw new Error(`Expected parent preset listing folder is missing: listings/${toSlug(oldName)}`);
}

if (oldListing !== newListing && existsSync(newListing)) {
  throw new Error(`Target listing folder already exists: listings/${toSlug(requestedName)}`);
}

themeInfo.theme_name = requestedName;
settingsData.presets = Object.fromEntries(
  Object.entries(settingsData.presets).map(([name, settings]) => [name === oldName ? requestedName : name, settings]),
);

writeFileSync(schemaPath, `${JSON.stringify(schema, null, 2)}\n`);
writeFileSync(dataPath, `${JSON.stringify(settingsData, null, 2)}\n`);

if (oldListing !== newListing) {
  renameSync(oldListing, newListing);
}

console.log(`Renamed parent theme and preset: ${oldName} -> ${requestedName}`);
console.log(`Renamed listing slug: ${toSlug(oldName)} -> ${toSlug(requestedName)}`);
console.log('Review theme_author and merchant-facing brand copy separately; they are intentionally unchanged.');
