# Repository guidance

- Before generating or replacing game audio, read `docs/audio-generation.md` and follow its naming, Narakeet request, and validation workflow.
- Keep folders, filenames, identifiers, and development code in English. Player-facing text and spoken game content should be Albanian.
- Store generated audio inside the relevant game's `assets/audio/` directory. Games must use saved assets at runtime rather than calling a TTS service from the browser.
