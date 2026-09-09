# Publishing the local container with Tailscale Funnel

The container serves on `localhost:3000`. Funnel puts that address on the
public internet over HTTPS, free on the Personal plan, without opening a router
port or owning a domain. Visitors need no Tailscale account.

While Funnel is on, the public URL reaches this PC. It is only up while the
machine and the container are, and every trace runs on this CPU.

## One-time setup

1. Enable HTTPS certificates for the tailnet: admin console → **DNS** →
   **HTTPS Certificates** → **Enable HTTPS**. Funnel refuses to start without
   it, reporting `Funnel not available; HTTPS must be enabled`.

2. Start Funnel. `--bg` keeps it running after the terminal closes.

   ```powershell
   & "C:\Program Files\Tailscale\tailscale.exe" funnel --bg 3000
   ```

   The first run may print an admin console link to grant the machine the
   Funnel attribute. Approve it, then run the command again.

3. Confirm what is published:

   ```powershell
   & "C:\Program Files\Tailscale\tailscale.exe" funnel status
   ```

The URL is `https://<machine>.<tailnet>.ts.net`, shown by `tailscale status`.
Funnel listens publicly on 443, 8443 and 10000 only; it proxies to local 3000,
so nothing about the container changes.

## Turning it off

```powershell
& "C:\Program Files\Tailscale\tailscale.exe" funnel --bg off
```

Stopping the container leaves Funnel serving errors, so turn Funnel off too if
the pause is more than brief.

## Before leaving it up

- **Two-factor.** The URL reaches a real machine. The app supports TOTP; turn it
  on for the account under account settings.
- **First-run setup must be closed.** While no account exists, `/setup` is open
  to whoever loads it, and on a public URL that means the first visitor can
  claim the instance. An account already exists here, so it is closed. Verify
  with `Get-Content data\users.json`; a non-empty file means closed.
- **Cookie.** `AUTH_COOKIE_SECURE=true` restricts the session cookie to HTTPS.
  It is not set, because the same container is also used over plain
  `http://localhost:3000`. Browsers treat `localhost` as a trustworthy origin,
  so it is expected to keep working, but test local login right after setting it
  rather than discovering the problem later.
- Uploads and STL generation are CPU and disk work done here, by whoever holds
  the URL.

## Limits

Funnel applies non-configurable bandwidth limits, unpublished but adequate for
personal use. It is not a CDN: every request crosses to this machine.
