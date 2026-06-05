# Viboplr Genius Plugin

Adds song, artist, and album information from [Genius](https://genius.com) to
Viboplr's detail pages. The plugin contributes five **information types**:

| Info type | Entity | Shows |
|---|---|---|
| `song_bio` (Song Bio) | track | Genius's short song description |
| `song_meaning` (Song Meaning) | track | Lyrics with annotated, line-by-line explanations |
| `artist_bio` (About) | artist | Artist biography / background |
| `album_wiki` (Review) | album | Album description / review |
| `lyrics` (Lyrics) | track | Plain-text lyrics scraped from the song page |

All data is fetched on demand through the host's `api.network.fetch` (no API key
required) and cached by the app per its information-type TTL.

Plugin id: `genius` (so an installed copy overrides the app's bundled built-in of
the same id, if any).

New to writing Viboplr plugins? See **[DEVELOPING.md](DEVELOPING.md)** for the
develop/reload/debug workflow.

## Requirements

None beyond the app itself — the plugin only uses `api.network.fetch` to reach
`genius.com`. No external binaries, no credentials.

> Genius has no public, stable API for this data; the plugin queries Genius's
> internal `api/...` endpoints and scrapes the SSR lyrics markup. Genius can
> change either at any time, which is exactly why this plugin lives in its own
> repo with its own release cadence — patches ship without a host app release.

## Install

In Viboplr: **Extensions → Install from URL** and paste this repo's URL, or it
auto-updates if already installed (the app checks `updateUrl` every 24h).

## Develop & Release

For every release: edit `index.js` / `manifest.json`, **bump `version` in
`manifest.json`**, and add a `## vX.Y.Z` section at the top of `CHANGELOG.md`.
Then publish via CI (preferred) or manually.

Bump helper: `scripts/bump.sh <patch|minor|major|X.Y.Z>` rewrites the
`manifest.json` version and prepends a `## vX.Y.Z` CHANGELOG section (with a
`TODO` to fill in). It does not commit/tag/push — review, fill in the changelog,
then release.

### Release via CI (preferred)

A GitHub Actions workflow (`.github/workflows/release.yml`) builds and publishes
the release. It verifies the `manifest.json` version matches the release version
and that the zip has `manifest.json` at its root, then attaches `genius.zip` +
`update.json`. Two ways to trigger it:

- **Push a tag:** after committing the version bump + changelog, run
  `git tag vX.Y.Z && git push origin vX.Y.Z`.
- **Manual dispatch:** GitHub → Actions → *Release* → *Run workflow*, enter the
  version (must equal `manifest.json`). CI creates the tag for you.

### Release manually (fallback)

1. `scripts/package.sh` → produces `genius.zip` + `update.json`.
   - The zip MUST contain `manifest.json` at its root (the script guarantees this;
     verify via the printed `unzip -l`).
2. `gh release create vX.Y.Z genius.zip update.json --repo outcast1000/viboplr-genius --title "vX.Y.Z" --notes-file CHANGELOG.md`

The update endpoint is the permanent
`https://github.com/outcast1000/viboplr-genius/releases/latest/download/update.json`.

## Tests

```bash
node --test     # or: npm test
```

Zero-dependency suite: it loads the real `index.js` in a faithful sandbox and
drives `activate()` through a mocked `api` bridge (no network). It asserts that
every declared information type registers a handler and that handlers
short-circuit correctly for mismatched entities. CI runs the same command and a
release will not publish unless it passes.
