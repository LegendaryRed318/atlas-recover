# Atlas recovery: the general website

A plain static page (no server, no database, no tracking) for Atlas owners who
have lost everything. It is meant to live on GitHub Pages, e.g.
`https://legendaryred318.github.io/atlas-recover/`.

## What's in it

- `index.html`, `recover.js`, `style.css`: the page.
- `entries/<name>.json`: one small locked file per home computer.
  - `<name>` = PBKDF2-SHA256(code, "atlas-recover/name/v1", 600,000 rounds), 16 bytes, hex.
  - The content is AES-256-GCM encrypted with PBKDF2-SHA256(code, "atlas-recover/key/v1", 600,000 rounds).
  - Inside: the home computer's hidden recovery address (on Tailscale Funnel) and its name.
  - Without the code an entry reveals nothing, not even whose it is.

## Adding a home computer

1. At home: Atlas Home → Recovery → switch it on (code + three passphrases).
2. Atlas Home → Recovery → **Save the entry file**. It lands in Downloads, named `<name>.json`.
3. Put that file into `entries/` here and publish (commit + push). Done.

If the home computer's public address ever changes, Atlas Home says the entry
is out of date: type the code there, save the new file, replace it here.

## Security notes

- The page sends the code nowhere. All the work happens in the visitor's browser.
- Anyone can download every entry and try codes offline. That only tells them
  where a home computer's recovery page is. To get in they still need the code
  again plus all three passphrases, at home, where 3 wrong tries lock it for an
  hour and 10 switch recovery off. Every try is reported to the owner.
- Choose a code that isn't a word, a name or a date.
