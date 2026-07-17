# Kids HTML App Dashboard

A tablet-friendly dashboard that reads its games from `apps/apps.json`. It uses plain HTML, CSS, and JavaScript with no build step.

## Dependencies

The app has no production dependencies and does not need `npm install` or a build command. It only needs a static web server such as Nginx in production.

For local development, install [Node.js](https://nodejs.org/) if `node` and `npm` are not already available. Node.js includes npm. The first time you run the following command, `npx` may ask permission to download the `serve` utility; answer `y`:

```powershell
npx serve .
```

This utility is only a development server and is not added to the project.

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
  "color": "#dfeaff",
  "version": "1.0.0"
}
```

`icon` can also be a full image URL such as `https://example.com/icon.png`. The optional `color` controls the tile background.

Increment only that game's `version` when the game changes. Use semantic versions such as `1.0.0`, `1.0.1`, or `1.1.0`; the version is displayed below its name on the dashboard.

Use the game folder URL with a trailing `/`. This keeps relative CSS, JavaScript, audio, and image paths working with servers that use clean URLs.

## Audio source

The Albanian recordings used by the games were generated with [Narakeet Text to Audio](https://narakeet.online/tryme).
