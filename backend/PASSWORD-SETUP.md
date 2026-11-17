# Private password changes — deployment and recovery

The GitHub Pages frontend can display **Account Settings**, but password changes only work after the Cloudflare Worker is updated.

## Deploy (existing SwatchForge Cloudflare project)
1. Open [backend/src/worker.js](./src/worker.js) in this GitHub repository and copy the entire current file.
2. In Cloudflare Dashboard → Workers & Pages → **swatchforge-studio-api** → Edit code, replace the Worker script with the current file and deploy it. Keep the existing Worker and its bindings; do **not** create another Worker.
3. Keep the current `DB` binding, `PHOTOS` binding, `SESSION_SECRET`, `BLOO_PASSWORD`, `PHOENIXX_PASSWORD`, and `FRONTEND_ORIGIN`. **Do not share these values**.
4. No manual D1 migration is required: the Worker creates `studio_accounts` if necessary. The same schema is also in [schema.sql](./schema.sql) for reference.
5. Open SwatchForge again, sign in with the existing passphrase, and navigate to **Account Settings** → **Change Password**.
6. Sign out and sign back in with the **new** passphrase. Verify the **old** passphrase no longer works. Test the other studio member separately.

## Behavior
- On each member's first successful login after the Worker deployment, their original Worker-secret passphrase is automatically migrated to a salted PBKDF2-SHA256 D1 password hash.
- Once migrated, only that account's stored hash is used for login; the original Worker secret no longer authenticates that profile.
- Changing a password requires the current password and issues a new session token. Earlier sessions are invalidated after the change.
- Neither passwords nor password hashes are returned by the API. Passwords are not committed to GitHub.

## Account recovery (administrator)
**Self-service forgotten-password recovery is not yet implemented.** Avoid changing to a new password without safely storing it.

As the Cloudflare administrator, you can reset one member to her original bootstrap credential by running this SQL in the D1 database console (use the exact intended profile):

```sql
DELETE FROM studio_accounts WHERE profile = 'Bloo';
```

Or substitute `'Phoenixx'`. The affected member can then sign in using the existing Cloudflare Worker-secret passphrase, and change it privately again. Because this is an administrator reset, the user should sign out everywhere and change the bootstrap passphrase promptly. This administrative recovery method provides account recovery, **not zero-knowledge privacy from an infrastructure administrator**. A future verified-email or recovery-code flow would improve that experience.

**Never paste passwords, Worker secrets, session tokens, or account hashes into chats, GitHub issues, or this repository.**
