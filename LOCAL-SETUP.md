# Local Tracefinity UI

Open http://localhost:3000. The `tracefinity` container runs the local UI built
from this checkout. Tools, bins and account data live in `data/`.

The simplified workflow is: choose a photo, check the paper corners, select the
detected tools, then choose **Create my bin**. This saves the tools and opens a
bin containing them. **Only save tools** keeps the library workflow available.
The bin editor exposes automatic sizing, height and pocket depth first; other
options remain under **Advanced settings**. **Download STL** produces a file
for a slicer, and **More download formats** includes the existing export options.

## Start and stop

```powershell
docker start tracefinity
docker stop tracefinity
docker logs --tail 100 tracefinity
```

## Build local changes

```powershell
docker build -f Dockerfile.local -t tracefinity:local-ux .
```

The local Dockerfile pins the installed backend image and rebuilds the frontend.
It does not follow future upstream releases automatically. Recreating the
container is required to run a newly built image.

## Development

```powershell
cd frontend
npx --yes pnpm@10.29.2 install --frozen-lockfile
npm run dev
```

The ignored `frontend/.env.local` points the development UI at the installed
backend through port 3000. The development UI opens on http://localhost:4001.

## Verification

```powershell
cd frontend
npx tsc --noEmit
npx eslint src/
npx vitest run
```

Production and test containers use separate storage. Keep the original stopped
container and the pre-update data backup until you are happy with the local UI.
