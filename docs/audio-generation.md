# Audio generation guide

This project stores generated Albanian speech as game assets. The browser must play the saved files and must not call a text-to-speech service at runtime.

## Service and voice

- Form page: `https://narakeet.online/tryme`
- Form POST endpoint: `https://narakeet.online/home/tryme_action/`
- Language: `sq-AL`
- Voice: `Gfrvc6Mu2c3d4f05d82dfc643ab27088bdd2da415AZcYeuytT_neural`
- Output: MP3 downloaded from the `tts_uri` property in the JSON response

A direct POST usually returns HTTP 403. First request the form page to obtain its session cookie and `csrf_test_name` value, then include both in the POST. Use a fresh form session for each phrase to avoid stale CSRF tokens.

## PowerShell generation template

Run this from the repository root. Change `$text` and `$output` only.

```powershell
$text = "rreth"
$output = "apps/shape-match/assets/audio/circle.mp3"
$cookieFile = Join-Path $env:TEMP "narakeet-cookies.txt"
$formFile = Join-Path $env:TEMP "narakeet-home.html"

curl.exe --silent --show-error --fail-with-body --location `
  "https://narakeet.online/" `
  --cookie-jar $cookieFile `
  --output $formFile

if ($LASTEXITCODE -ne 0) {
  throw "Could not create a Narakeet session"
}

$html = Get-Content -Raw $formFile
$csrf = [regex]::Match(
  $html,
  'name="csrf_test_name" value="([^"]+)"'
).Groups[1].Value

$response = curl.exe --silent --show-error --fail-with-body `
  -X POST "https://narakeet.online/home/tryme_action/" `
  --cookie $cookieFile `
  --referer "https://narakeet.online/" `
  -H "X-Requested-With: XMLHttpRequest" `
  --data-urlencode "csrf_test_name=$csrf" `
  --data-urlencode "front_tryme_language=sq-AL" `
  --data-urlencode "front_tryme_voice=Gfrvc6Mu2c3d4f05d82dfc643ab27088bdd2da415AZcYeuytT_neural" `
  --data-urlencode "front_tryme_text=$text"

if ($LASTEXITCODE -ne 0) {
  throw "The TTS request failed for: $text"
}

$result = $response | ConvertFrom-Json
if (-not $result.result) {
  throw "Narakeet rejected the request: $($result.message)"
}

curl.exe --silent --show-error --fail-with-body `
  $result.tts_uri `
  --output $output

if ($LASTEXITCODE -ne 0) {
  throw "The MP3 download failed for: $text"
}
```

## Validation

Validate every downloaded file before replacing an existing asset:

```powershell
ffprobe -v error `
  -show_entries stream=codec_name `
  -show_entries format=duration `
  -of default=noprint_wrappers=1 `
  "path/to/audio.mp3"
```

Expected results:

- `codec_name=mp3`
- A short, non-zero duration, normally between 1 and 3 seconds
- The file plays the intended Albanian phrase without trailing noise

When replacing audio, download to a temporary sibling such as `name.new.mp3`, validate it, then replace the original file.

## Project conventions

- Use English folder and file names, for example `shape-match/assets/audio/triangle.mp3`.
- Use Albanian only for spoken content and player-facing labels.
- Keep one reusable recording per word when words will be combined during gameplay.
- Use one persistent HTML `<audio>` element per game for tablet compatibility and change its source between recordings.
- Store attribution in project documentation; the current source is [Narakeet Text to Audio](https://narakeet.online/tryme).

## Existing pronunciation decisions

The counting game intentionally uses these shortened number recordings:

| Number | TTS text |
|---:|---|
| 1 | `nje` |
| 2 | `dy` |
| 3 | `tre` |
| 4 | `kater` |
| 5 | `pes` |
| 6 | `gjasht` |
| 7 | `shtat` |
| 8 | `tet` |
| 9 | `nënt` |
| 10 | `dhjet` |

Do not silently change established pronunciation text. Generate a sample and get user feedback first when adding uncertain words.
