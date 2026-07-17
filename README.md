# Kids HTML App Dashboard

A tablet-friendly dashboard that reads its games from `apps/apps.json`. It uses plain HTML, CSS, and JavaScript with no build step.

## Run it

The JSON file is loaded with `fetch`, so open the project through a local web server instead of double-clicking `index.html`.

```powershell
npx serve .
```

Then open the address shown in the terminal (usually `http://localhost:3000`).

## Add a game

1. Create a folder such as `apps/my-game/`.
2. Put the game's `index.html` and icon in that folder.
3. Add an item to `apps/apps.json`:

```json
{
  "label": "My Game",
  "icon": "apps/my-game/icon.png",
  "url": "apps/my-game/",
  "color": "#dfeaff"
}
```

`icon` can also be a full image URL such as `https://example.com/icon.png`. The optional `color` controls the tile background.

Use the game folder URL with a trailing `/`. This keeps relative CSS, JavaScript, audio, and image paths working with servers that use clean URLs.

## Audio source

The Albanian color recordings used by Color Match were generated with [Narakeet Text to Audio](https://narakeet.online/tryme).
