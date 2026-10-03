# Changelog

## v1.1.0
- **Runs in the plugin worker runtime.** It now gets only what it asks for
  — `network:genius.com` — and can't reach anything else in the app. Viboplr asks
  you to allow these once when you update. Requires Viboplr 1.0.85.
- **AI assistants can search Genius.** One tool on the host's new assistant
  surface (`api.assistant`, Viboplr's AI control API): `search_genius` —
  free-text search where a lyric fragment works ("the song that goes…"),
  returning candidate songs (title/artist/url) to retry an exact info fetch
  with. The info types themselves (song_bio, song_meaning, artist_bio,
  album_wiki, lyrics) are already reachable through the host's info verbs;
  the tool's instructions route a model there.
- Guarded on `api.assistant` existing — on hosts older than the surface this
  release changes nothing.

## v1.0.1
- Declares `updateUrl` in its manifest, so "Check for updates" can see this
  plugin at all. The app skips any installed plugin whose manifest omits the
  field — before comparing versions — so v1.0.0 installs were never checked and
  would have missed every future release. Nothing else changed.
- Copies already installed stay silent until reinstalled once from the gallery:
  the check reads the manifest on disk, so the fix can't announce itself.

## v1.0.0
- Initial standalone release. Extracted from the Viboplr app's bundled plugins
  into its own repository with independent CI + release flow. Behaviour is
  unchanged from the bundled `genius` plugin: song bio, song meaning
  (annotations), artist about, album review, and plain lyrics.
