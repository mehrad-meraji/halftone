// `prepare` hook. Makes `npm i github:mehrad-meraji/halftone` work: a git install gets the
// source only, so the build (dist, registry, llms.txt, manifest) has to happen on the way in.
//
// It does nothing while developing here: `npm install` and `npm ci` in this repo, and
// `npm publish` (which has its own `prepack` build), all run with INIT_CWD equal to the repo.
// It builds only when this package is being installed as a dependency of another project
// and is not built yet.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const initCwd = process.env.INIT_CWD ? resolve(process.env.INIT_CWD) : root;
const installedAsDependency = initCwd !== root;
const built = existsSync(join(root, 'dist/index.js')) && existsSync(join(root, 'registry/registry.json'));

if (!installedAsDependency) {
  console.log('halftone prepare: developing in the repo, skipping build.');
} else if (built) {
  console.log('halftone prepare: already built.');
} else {
  console.log('halftone prepare: building from source (this runs once, on install from git)...');
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
}
