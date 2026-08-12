/**
 * Generates an ADMIN_PASSWORD_HASH value for .env.local / your hosting provider.
 *
 *   node scripts/hash-password.mjs 'your-strong-password'
 *
 * The password is never written anywhere — only the hash is printed. Pass it via
 * argv from an interactive shell you trust, or pipe it in on stdin to keep it out
 * of your shell history:
 *
 *   printf '%s' 'your-strong-password' | node scripts/hash-password.mjs
 */
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const PARAMS = { N: 16384, r: 8, p: 1, keyLength: 64 };

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '');
}

async function main() {
  const password = process.argv[2] ?? (await readStdin());

  if (!password) {
    process.stderr.write(
      "Usage: node scripts/hash-password.mjs 'your-strong-password'\n" +
        "   or: printf '%s' 'your-strong-password' | node scripts/hash-password.mjs\n",
    );
    process.exit(1);
  }

  if (password.length < 12) {
    process.stderr.write('Refusing to hash a password shorter than 12 characters.\n');
    process.exit(1);
  }

  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize('NFKC'), salt, PARAMS.keyLength, {
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
    maxmem: 64 * 1024 * 1024,
  });

  // Colon-delimited so the value survives .env variable expansion untouched.
  const hash = ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('hex'), derived.toString('hex')].join(':');

  process.stdout.write(`\nADMIN_PASSWORD_HASH="${hash}"\n\n`);
  process.stdout.write('Also generate a session secret:\n');
  process.stdout.write(`AUTH_SECRET="${randomBytes(32).toString('base64url')}"\n\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
