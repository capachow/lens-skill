import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagePath = path.join(__dirname, '../package.json');
const LENS_VERSION = JSON.parse(fs.readFileSync(packagePath, 'utf8')).version;
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

async function migrate(action, scope) {
  const lensDir = path.join(process.cwd(), '.lens');
  const scopePath = path.join(lensDir, 'SCOPE.json');

  if (action === 'paths') {
    const movePaths = [
      { old: path.join(lensDir, 'SET.json'), new: scopePath }
    ];
    movePaths.forEach(movePath => {
      if (fs.existsSync(movePath.old)) fs.renameSync(movePath.old, movePath.new);
    });

    const removePaths = [
      path.join(__dirname, 'transcripts.txt'),
      path.join(lensDir, 'transcripts.txt'),
      path.join(process.cwd(), 'transcripts.txt')
    ];
    removePaths.forEach(removePath => {
      if (fs.existsSync(removePath)) fs.unlinkSync(removePath);
    });
  }

  if (action === 'scope') {
    if (!fs.existsSync(scopePath)) {
      const axiomPath = path.join(lensDir, 'AXIOM.md');

      if (fs.existsSync(axiomPath)) {
        const axiom = fs.readFileSync(axiomPath, 'utf8');
        if (axiom.includes('Interview Phase:')) {
          const phaseMatch = axiom.match(/Interview Phase: (\d+)-(\d+)-(\d+)/);
          if (phaseMatch) {
            const [_, init, stab, hab] = phaseMatch.map(Number);
            if (init > 0) {
              scope.interview.phase = "onboarding";
              scope.interview.questions = init;
            } else if (stab > 0) {
              scope.interview.phase = "stabilizing";
              scope.interview.questions = stab;
            } else {
              scope.interview.phase = "habitual";
              scope.interview.questions = true;
            }
          }
        }

        if (axiom.includes('Installation Date:')) {
          const dateMatch = axiom.match(/Installation Date: (\d{4}-\d{2}-\d{2})/);
          if (dateMatch) scope.meta.installed = dateMatch[1];
        }

        if (axiom.includes('## LENS Lifecycle')) {
          const cleaned = axiom.replace(/## LENS Lifecycle\n(- (Interview Phase: \d+-\d+-\d+|Installation Date: \d{4}-\d{2}-\d{2})\n?)+/gm, '').replace(/\n\n\n+/g, '\n\n');
          fs.writeFileSync(axiomPath, cleaned.trim() + '\n');
        }
      }
    }
  }
}

export async function bootstrap(reboot = false) {
  const lensDir = path.join(process.cwd(), '.lens');
  if (!fs.existsSync(lensDir)) fs.mkdirSync(lensDir);

  migrate('paths');

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const axiomPath = path.join(lensDir, 'AXIOM.md');
  const ethosPath = path.join(lensDir, 'ETHOS.md');
  const modusPath = path.join(lensDir, 'MODUS.md');
  const scopePath = path.join(lensDir, 'SCOPE.json');

  let scope = {
    meta: {
      version: LENS_VERSION,
      installed: new Date().toISOString().split('T')[0]
    },
    interview: { phase: "onboarding", questions: 15, model: "" },
    distillation: { model: "" }
  };

  let interviewExpr = "30 11,17 * * *";

  if (fs.existsSync(scopePath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(scopePath, 'utf8'));
      scope.meta = { ...scope.meta, ...(existing.meta || {}) };
      scope.interview = { ...scope.interview, ...(existing.interview || {}) };
      scope.distillation = { ...scope.distillation, ...(existing.distillation || {}) };
      scope.meta.version = LENS_VERSION;

      if (typeof scope.interview.questions === 'number' && scope.interview.questions <= 0) {
        if (scope.interview.phase === 'onboarding') {
          scope.interview.phase = 'stabilizing';
          scope.interview.questions = 22;
          interviewExpr = "30 11 * * *";
        } else if (scope.interview.phase === 'stabilizing') {
          scope.interview.phase = 'habitual';
          scope.interview.questions = true;
          interviewExpr = "30 11 * * 3";
        }
      }
    } catch (e) {}
  }

  const jobs = [
    {
      id: "lens-distillation",
      name: "lens-distillation",
      schedule: { kind: "cron", expr: "0 3 * * *", tz: timezone },
      sessionTarget: "isolated",
      payload: {
        kind: "agentTurn",
        message: "Run `node skills/lens/scripts/distillation.js`. If the output is 'TRACE_EMPTY', reply with ONLY: NO_REPLY and stop. If the output includes 'DISTILLATION_READY', read `skills/lens/prompts/distillation.md` and follow it strictly.",
        model: scope.distillation.model || undefined
      },
      delivery: {
        mode: "none"
      }
    },
    {
      id: "lens-interview",
      name: "lens-interview",
      schedule: { kind: "cron", expr: interviewExpr, tz: timezone },
      sessionTarget: "isolated",
      payload: {
        kind: "agentTurn",
        message: "Run `node skills/lens/scripts/interview.js`. If the output includes 'INTERVIEW_READY', read `skills/lens/prompts/interview.md` and follow it strictly. Generate a single question for the human and stop.",
        model: scope.interview.model || undefined
      },
      delivery: {
        mode: "announce"
      }
    }
  ];

  migrate('scope', scope);

  fs.writeFileSync(scopePath, JSON.stringify(scope, null, 2));

  const templatesDir = path.join(process.cwd(), 'skills/lens/scripts/templates');
  const lensNodes =  [
    { name: 'AXIOM.md', path: axiomPath },
    { name: 'ETHOS.md', path: ethosPath },
    { name: 'MODUS.md', path: modusPath }
  ];

  lensNodes.forEach(lensNode => {
    if (!fs.existsSync(lensNode.path)) {
      fs.writeFileSync(lensNode.path, fs.readFileSync(path.join(templatesDir, lensNode.name), 'utf8'));
    }
  });

  const result = { jobs, timezone, triggerImmediate: "lens-interview" };

  if (reboot || isMain) {
    console.log("BOOTSTRAP_LENS: RESULT_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("BOOTSTRAP_LENS: RESULT_END");
  }
}

export async function preflight(job) {
  const lensDir = path.join(process.cwd(), '.lens');
  const scopePath = path.join(lensDir, 'SCOPE.json');
  const packagePath = path.join(__dirname, '../package.json');
  const version = JSON.parse(fs.readFileSync(packagePath, 'utf8')).version;

  let needsReboot = !fs.existsSync(scopePath);

  if (!needsReboot) {
    try {
      const scope = JSON.parse(fs.readFileSync(scopePath, 'utf8'));

      if (scope.meta?.version !== version) {
        needsReboot = true;
      } else if (process.env.OPENCLAW_CRON_LIST) {
        const crons = JSON.parse(process.env.OPENCLAW_CRON_LIST);
        const cron = crons.find(j => j.name === `lens-${job}`);
        if (!cron || !(cron.payload?.message || cron.payload?.text)?.includes(`scripts/${job}.js`)) {
          needsReboot = true;
        } else if (scope[job]?.model && (cron.payload?.model || '') !== scope[job].model) {
          needsReboot = true;
        }
      }

      if (job === 'distillation') {
      } else if (job === 'interview') {
        if (typeof scope.interview?.questions === 'number' && scope.interview.questions <= 0) {
          needsReboot = true;
        }
      }
    } catch (e) {
      needsReboot = true;
    }
  }

  if (needsReboot) bootstrap(true);
}

if (isMain) bootstrap();
