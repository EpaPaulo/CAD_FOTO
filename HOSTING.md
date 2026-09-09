# Hosting TraceCAT on Fly.io

Pushing to `main` runs the tests and, once the steps below are done, deploys to
Fly.io. Until a `FLY_API_TOKEN` secret exists the deploy job skips instead of
failing, so the repository stays green.

Two of these steps need your credentials, so they are yours to run: creating the
account, and putting the token into GitHub.

## Before the first deploy

1. Install flyctl and sign in. Fly asks for a payment card even on the smallest
   plan.

   ```bash
   fly auth login
   ```

2. Create the app and its storage. The volume holds tools, bins, accounts and
   the generated auth secret, so without it every deploy starts empty.

   ```bash
   fly apps create cad-foto
   fly volumes create cad_foto_data --region mad --size 3 --app cad-foto
   ```

3. Create a deploy token and add it to GitHub as a repository secret named
   `FLY_API_TOKEN` (Settings → Secrets and variables → Actions → New secret).

   ```bash
   fly tokens create deploy --app cad-foto
   ```

4. Push, or run the Deploy workflow by hand from the Actions tab.

## Claim the instance immediately

TraceCAT starts with no account, and while none exists `/setup` is open to
whoever loads it. On a public URL that means **the first visitor can claim your
instance**. As soon as the first deploy is live, open the app, create your
account, and then close setup for good:

```bash
fly secrets set AUTH_SETUP_ENABLED=false --app cad-foto
```

Check `fly logs --app cad-foto` if you want to confirm nobody got there first;
the backend warns when setup is open on an instance that already holds data.

## Size and cost

The image carries torch, ONNX Runtime and the background-removal models, so it
is several GB and needs real memory: `fly.toml` asks for 4 GB, below which
tracing fails when a model loads. The machine suspends when idle and wakes on
the next request, which keeps the bill to roughly the volume plus the time it is
actually awake. A cold wake takes a few seconds.

To keep it always warm instead, set `min_machines_running = 1` in `fly.toml`.

## Notes

- `AUTH_COOKIE_SECURE=true` is set in `fly.toml` because Fly terminates TLS.
- `AUTH_SECRET` is deliberately unset. The backend generates a strong one into
  the volume on first start. Setting it by hand is only needed to share sessions
  across several machines.
- The deploy runs on every push to `main`, including pushes whose tests fail.
  Gate it behind a `workflow_run` trigger on the Tests workflow if you would
  rather it waited.
