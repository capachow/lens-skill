import fs from 'fs';
import path from 'path';
import { LENS_DIR, bootstrap, checkAccess, preflight } from './bootstrap.js';

async function interview() {
  await preflight('interview');

  try {
    const scopePath = path.join(LENS_DIR, 'SCOPE.json');
    if (fs.existsSync(scopePath)) {
      const scope = JSON.parse(fs.readFileSync(scopePath, 'utf8'));
      if (typeof scope.interview?.questions === 'number') {
        scope.interview.questions--;
        fs.writeFileSync(scopePath, JSON.stringify(scope, null, 2) + '\n');
        if (scope.interview.questions <= 0) {
          await bootstrap(true);
        }
      }
    }
  } catch (e) {
    checkAccess(e);
    console.error('INTERVIEW_ERROR:', e);
  }

  console.log('INTERVIEW_READY');
}

interview();
