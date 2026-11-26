// Atlas recovery: the general website. Everything happens in this browser:
// the code is turned (slowly, PBKDF2-SHA256, 600,000 rounds) into the name of
// a small locked file under entries/, and into the key that opens it
// (AES-256-GCM). The file says where your home computer's hidden recovery
// page is. Atlas Home (internal/agent/recovery.go) makes the same file.
'use strict';
const ROUNDS = 600000;
const enc = new TextEncoder();
const $ = id => document.getElementById(id);

function norm(code) {
  const c = code.toLowerCase().replace(/[ \t]/g, '');
  if (!/^[a-z0-9._-]{8,64}$/.test(c)) return null;
  return c;
}

async function derive(code, salt, bytes) {
  const base = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: ROUNDS }, base, bytes * 8);
  return new Uint8Array(bits);
}

const hex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('');
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

function say(text, kind) { $('msg').className = 'msg ' + (kind || ''); $('msg').textContent = text; }

$('f').onsubmit = async e => {
  e.preventDefault();
  const code = norm($('code').value);
  if (!code) return say("That isn't a recovery code: they're 8 to 64 letters or numbers.", 'bad');
  if (!window.crypto || !crypto.subtle) return say('This browser is too old for this page. Try another browser.', 'bad');
  $('go').disabled = true;
  say('Looking... (this takes a few seconds on purpose)');
  try {
    const name = hex(await derive(code, 'atlas-recover/name/v1', 16));
    const r = await fetch('entries/' + name + '.json', { cache: 'no-store' });
    if (r.status === 404) throw new Error('No home computer uses that code. Check it and try again.');
    if (!r.ok) throw new Error('This page could not be reached properly. Try again in a minute.');
    const entry = await r.json();
    const key = await crypto.subtle.importKey('raw', await derive(code, 'atlas-recover/key/v1', 32), 'AES-GCM', false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(entry.iv) }, key, unb64(entry.ct));
    const where = JSON.parse(new TextDecoder().decode(pt));
    // Only ever a home computer's own Atlas recovery page.
    if (!/^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.ts\.net\/r\/[a-z2-7]{16,64}\/$/.test(where.url || '')) throw new Error('That file is damaged.');
    say('Found ' + (where.name || 'your home computer') + '. Taking you there: type your code again, then your three passphrases.', 'ok');
    $('code').value = '';
    setTimeout(() => location.replace(where.url), 1200);
  } catch (err) {
    say(err.name === 'OperationError' ? 'That file is damaged.' : err.message, 'bad');
    $('go').disabled = false;
  }
};
