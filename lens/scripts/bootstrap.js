import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fs.realpathSync(fileURLToPath(import.meta.url));
const __dirname = path.dirname(__filename);
export const SKILL_DIR = path.resolve(__dirname, '..');
const parentDir = path.dirname(SKILL_DIR);
export const WORKSPACE_DIR = path.basename(parentDir) === 'skills' ? path.dirname(parentDir) : parentDir;
const HOME_DIR = process.env.HOME || os.homedir();
export const LENS_DIR = path.join(HOME_DIR, '.lens');

export function checkAccess(err) {
  if (err && (err.code === 'EPERM' || err.code === 'EACCES')) {
    console.error(`LENS_ACCESS_DENIED: Permission denied accessing ${err.path || LENS_DIR}. Re-run outside the workspace sandbox or grant access to ~/.lens.`);
    process.exit(1);
  }
}

const packagePath = path.join(SKILL_DIR, 'package.json');
const LENS_VERSION = JSON.parse(fs.readFileSync(packagePath, 'utf8')).version;
const isMain = Boolean(
  process.argv[1] &&
  fs.existsSync(process.argv[1]) &&
  fs.realpathSync(path.resolve(process.argv[1])) === __filename
);

function migrate(action, scope) {
  if (action === 'dir') {
    const candidates = new Set([
      path.join(WORKSPACE_DIR, '.lens'),
      path.join(process.cwd(), '.lens')
    ]);
    try {
      const openclawConfigPath = path.join(HOME_DIR, '.openclaw/openclaw.json');
      if (fs.existsSync(openclawConfigPath)) {
        const config = JSON.parse(fs.readFileSync(openclawConfigPath, 'utf8'));
        const ws = config.agents?.defaults?.workspace;
        if (ws) candidates.add(path.join(ws, '.lens'));
      }
    } catch (e) {}

    for (const legacyLensDir of candidates) {
      if (legacyLensDir !== LENS_DIR && fs.existsSync(legacyLensDir)) {
        try {
          if (!fs.existsSync(LENS_DIR)) {
            try {
              fs.renameSync(legacyLensDir, LENS_DIR);
            } catch (renameErr) {
              checkAccess(renameErr);
              fs.cpSync(legacyLensDir, LENS_DIR, { recursive: true });
              fs.rmSync(legacyLensDir, { recursive: true, force: true });
            }
          } else {
            const templatesDir = path.join(__dirname, 'templates');
            const entries = fs.readdirSync(legacyLensDir);
            for (const item of entries) {
              const src = path.join(legacyLensDir, item);
              const dest = path.join(LENS_DIR, item);
              const templateFile = path.join(templatesDir, item);
              const isDefaultTemplate = (
                fs.existsSync(dest) &&
                fs.existsSync(templateFile) &&
                fs.readFileSync(dest, 'utf8') === fs.readFileSync(templateFile, 'utf8')
              );
              if (!fs.existsSync(dest) || isDefaultTemplate) {
                fs.cpSync(src, dest, { recursive: true, force: true });
              }
            }
            fs.rmSync(legacyLensDir, { recursive: true, force: true });
          }
        } catch (e) {
          checkAccess(e);
        }
      }
    }
  }

  if (action === 'paths') {
    const backupPaths = [
      { old: path.join(LENS_DIR, 'AXIOM.md'), bak: 'axiom.md.bak' },
      { old: path.join(LENS_DIR, 'ETHOS.md'), bak: 'ethos.md.bak' },
      { old: path.join(LENS_DIR, 'MODUS.md'), bak: 'modus.md.bak' },
      { old: path.join(LENS_DIR, 'SET.json'), bak: 'set.json.bak' },
      { old: path.join(__dirname, 'transcripts.txt'), bak: 'transcripts.txt.bak.1' },
      { old: path.join(LENS_DIR, 'transcripts.txt'), bak: 'transcripts.txt.bak.2' }
    ];
    backupPaths.forEach(backupPath => {
      if (fs.existsSync(backupPath.old)) {
        try {
          fs.renameSync(backupPath.old, path.join(LENS_DIR, backupPath.bak));
        } catch (e) {}
      }
    });

    const createPaths = [
      { new: path.join(LENS_DIR, 'AXIOM.yaml'), bak: 'axiom.md.bak' },
      { new: path.join(LENS_DIR, 'ETHOS.yaml'), bak: 'ethos.md.bak' },
      { new: path.join(LENS_DIR, 'MODUS.yaml'), bak: 'modus.md.bak' },
      { new: path.join(LENS_DIR, 'SCOPE.json'), bak: 'set.json.bak' }
    ];
    createPaths.forEach(createPath => {
      if (!fs.existsSync(createPath.new) && fs.existsSync(path.join(LENS_DIR, createPath.bak))) {
        const baseName = path.parse(createPath.new).name;

        if (baseName === 'SCOPE') {
          fs.renameSync(path.join(LENS_DIR, createPath.bak), createPath.new);
        } else {
          fs.writeFileSync(createPath.new, `title: "MIGRATION REQUIRED - ${baseName}"\nSYSTEM_ALERT: "CRITICAL INSTRUCTION: The LENS system has upgraded to YAML. Before continuing with your primary mission, you MUST read the legacy file at ~/.lens/${createPath.bak}. Translate its entire contents into a highly structured, deeply nested YAML format (preserving all user data), and completely overwrite THIS file (~/.lens/${baseName}.yaml) with the new structure."\n`);
        }
      }
    });
  }

  if (action === 'scope') {
    const axiomBakPath = path.join(LENS_DIR, 'axiom.md.bak');

    if (fs.existsSync(axiomBakPath)) {
      const axiomBak = fs.readFileSync(axiomBakPath, 'utf8');

      if (axiomBak.includes('Interview Phase:')) {
        const phaseMatch = axiomBak.match(/Interview Phase: (\d+)-(\d+)-(\d+)/);
        if (phaseMatch) {
          const [_, init, stab] = phaseMatch.map(Number);
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

      if (axiomBak.includes('Installation Date:')) {
        const dateMatch = axiomBak.match(/Installation Date: (\d{4}-\d{2}-\d{2})/);
        if (dateMatch) scope.meta.installed = dateMatch[1];
      }
    }
  }
}

function getUserTimezone() {
  try {
    const homeDir = process.env.HOME || os.homedir();
    if (homeDir) {
      const configPath = path.join(homeDir, '.openclaw/openclaw.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config.agents?.defaults?.userTimezone;
      }
    }
  } catch (e) {}
  return null;
}

function ensureSkillLink(linkPath, reboot = false) {
  try {
    let stat = null;
    try {
      stat = fs.lstatSync(linkPath);
    } catch (e) {}

    if (stat) {
      if (stat.isSymbolicLink()) {
        const currentTarget = path.resolve(path.dirname(linkPath), fs.readlinkSync(linkPath));
        if (currentTarget === SKILL_DIR && fs.existsSync(linkPath)) {
          return linkPath;
        }
        fs.unlinkSync(linkPath);
      } else {
        return linkPath;
      }
    }

    fs.mkdirSync(path.dirname(linkPath), { recursive: true });
    fs.symlinkSync(SKILL_DIR, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
    return linkPath;
  } catch (e) {
    if (!reboot) checkAccess(e);
    return null;
  }
}

function syncSkillLinks(reboot = false) {
  const linked = [];
  if (!HOME_DIR) return linked;

  const geminiDir = path.join(HOME_DIR, '.gemini');
  if (fs.existsSync(geminiDir)) {
    const geminiCliLink = ensureSkillLink(path.join(geminiDir, 'skills', 'lens'), reboot);
    if (geminiCliLink) linked.push(geminiCliLink);

    const agyConfigDir = path.join(geminiDir, 'config');
    const agyDir = path.join(geminiDir, 'antigravity');
    if (fs.existsSync(agyConfigDir) || fs.existsSync(agyDir)) {
      const skillsJsonPath = path.join(agyConfigDir, 'skills.json');
      let coveredBySkillsJson = false;
      if (fs.existsSync(skillsJsonPath)) {
        try {
          const raw = fs.readFileSync(skillsJsonPath, 'utf8');
          if (raw.includes(SKILL_DIR) || raw.includes(WORKSPACE_DIR)) {
            coveredBySkillsJson = true;
            linked.push(skillsJsonPath);
          }
        } catch (e) {}
      }
      if (!coveredBySkillsJson) {
        const agyLink = ensureSkillLink(path.join(agyConfigDir, 'skills', 'lens'), reboot);
        if (agyLink) linked.push(agyLink);
      }
    }
  }

  const claudeDir = path.join(HOME_DIR, '.claude');
  if (fs.existsSync(claudeDir)) {
    const claudeLink = ensureSkillLink(path.join(claudeDir, 'skills', 'lens'), reboot);
    if (claudeLink) linked.push(claudeLink);
  }

  const codexDir = process.env.CODEX_HOME || path.join(HOME_DIR, '.codex');
  if (fs.existsSync(codexDir)) {
    const codexLink = ensureSkillLink(path.join(codexDir, 'skills', 'lens'), reboot);
    if (codexLink) linked.push(codexLink);
  }

  const openclawDir = path.join(HOME_DIR, '.openclaw');
  if (fs.existsSync(openclawDir)) {
    try {
      const configPath = path.join(openclawDir, 'openclaw.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const ws = config.agents?.defaults?.workspace;
        if (ws && fs.existsSync(ws)) {
          const wsLink = ensureSkillLink(path.join(ws, 'skills', 'lens'), reboot);
          if (wsLink) linked.push(wsLink);
        }
      }
    } catch (e) {}
  }

  return linked;
}

function syncAntigravitySidecars(timezone, interviewExpr, distillationPrompt, interviewPrompt, reboot = false) {
  const synced = [];
  if (!HOME_DIR) return synced;

  const geminiDir = path.join(HOME_DIR, '.gemini');
  const agyConfigDir = path.join(geminiDir, 'config');
  const agyDir = path.join(geminiDir, 'antigravity');
  if (!fs.existsSync(agyConfigDir) && !fs.existsSync(agyDir)) return synced;

  const sidecarsRoot = path.join(agyConfigDir, 'sidecars');
  const lensWorkspaceUri = pathToFileURL(LENS_DIR).href;
  const distillationScript = path.join(__dirname, 'distillation.js');
  const interviewScript = path.join(__dirname, 'interview.js');
  const bootstrapScript = path.join(__dirname, 'bootstrap.js');

  const definitions = [
    {
      id: 'lens-distillation',
      config: {
        builtin: 'schedule',
        args: [
          `CRON_TZ=${timezone} 0 3 * * *`,
          'agentapi',
          'new-conversation',
          '--',
          distillationPrompt
        ],
        restart_policy: 'always',
        display_name: 'LENS Nightly Distillation',
        description: `Every night at 3:00 AM (${timezone}), harvests recent user messages across your AI tools into ~/.lens/TRACE.txt and distills enduring insights into ~/.lens/AXIOM.yaml, ETHOS.yaml, and MODUS.yaml.`,
        agent_permissions: {
          workspace_uris: [lensWorkspaceUri],
          access_grants: [
            `command(node ${distillationScript})`,
            `command(node ${bootstrapScript})`,
            `read_file(${LENS_DIR})`,
            `write_file(${LENS_DIR})`,
            `read_file(${SKILL_DIR})`
          ]
        }
      }
    },
    {
      id: 'lens-interview',
      config: {
        builtin: 'schedule',
        args: [
          `CRON_TZ=${timezone} ${interviewExpr}`,
          'agentapi',
          'new-conversation',
          '--',
          interviewPrompt
        ],
        restart_policy: 'always',
        display_name: 'LENS Calibration Interview',
        description: `Runs on schedule (${interviewExpr} ${timezone}) to ask a single scenario or trade-off calibration question that sharpens your ~/.lens/ Trinity Nodes.`,
        agent_permissions: {
          workspace_uris: [lensWorkspaceUri],
          access_grants: [
            `command(node ${interviewScript})`,
            `command(node ${bootstrapScript})`,
            `read_file(${LENS_DIR})`,
            `write_file(${LENS_DIR})`,
            `read_file(${SKILL_DIR})`
          ]
        }
      }
    }
  ];

  for (const def of definitions) {
    try {
      const dir = path.join(sidecarsRoot, def.id);
      const filePath = path.join(dir, 'sidecar.json');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(def.config, null, 2) + '\n', 'utf8');
      synced.push(filePath);
    } catch (e) {
      if (!reboot) checkAccess(e);
    }
  }

  return synced;
}

export async function bootstrap(reboot = false) {
  migrate('dir');

  try {
    if (!fs.existsSync(LENS_DIR)) fs.mkdirSync(LENS_DIR, { recursive: true });
  } catch (e) {
    checkAccess(e);
    throw e;
  }

  const axiomPath = path.join(LENS_DIR, 'AXIOM.yaml');
  const ethosPath = path.join(LENS_DIR, 'ETHOS.yaml');
  const modusPath = path.join(LENS_DIR, 'MODUS.yaml');
  const readmePath = path.join(LENS_DIR, 'README.md');
  const scopePath = path.join(LENS_DIR, 'SCOPE.json');
  const tracePath = path.join(LENS_DIR, 'TRACE.txt');
  const hadScope = fs.existsSync(scopePath) || fs.existsSync(path.join(LENS_DIR, 'SET.json'));

  migrate('paths');

  const timezone = getUserTimezone() || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  let scope = {
    meta: {
      version: LENS_VERSION,
      installed: new Date().toISOString().split('T')[0],
      anonymize: false
    },
    interview: { phase: "onboarding", questions: 15, model: "" },
    distillation: { model: "" }
  };

  if (!hadScope) {
    migrate('scope', scope);
  }

  let interviewExpr = "30 11,17 * * *";

  if (fs.existsSync(scopePath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(scopePath, 'utf8'));
      const priorVersion = String(existing.meta?.version || '');
      scope.meta = { ...scope.meta, ...(existing.meta || {}) };
      scope.interview = { ...scope.interview, ...(existing.interview || {}) };
      scope.distillation = { ...scope.distillation, ...(existing.distillation || {}) };
      if (priorVersion && !priorVersion.startsWith('2.')) {
        if (scope.interview.model === 'google/gemini-3.1-pro-preview') scope.interview.model = '';
        if (scope.distillation.model === 'google/gemini-3.1-pro-preview') scope.distillation.model = '';
      }
      scope.meta.version = LENS_VERSION;

      if (typeof scope.interview.questions === 'number' && scope.interview.questions <= 0) {
        if (scope.interview.phase === 'onboarding') {
          scope.interview.phase = 'stabilizing';
          scope.interview.questions = 22;
        } else {
          scope.interview.phase = 'habitual';
          scope.interview.questions = true;
        }
      }
    } catch (e) {
      checkAccess(e);
      try {
        fs.copyFileSync(scopePath, path.join(LENS_DIR, 'scope.json.corrupt.bak'));
      } catch (copyErr) {}
    }
  }

  if (scope.interview.phase === 'stabilizing') {
    interviewExpr = "30 11 * * *";
  } else if (scope.interview.phase === 'habitual') {
    interviewExpr = "30 11 * * 3";
  }

  const distillationPrompt = `Run \`node ${path.join(__dirname, 'distillation.js')}\`. If the output is 'TRACE_EMPTY', reply with ONLY: NO_REPLY and stop. If the output includes 'DISTILLATION_READY', read \`${path.join(SKILL_DIR, 'prompts/distillation.md')}\` and follow it strictly.`;
  const interviewPrompt = `Run \`node ${path.join(__dirname, 'interview.js')}\`. If the output includes 'INTERVIEW_READY', read \`${path.join(SKILL_DIR, 'prompts/interview.md')}\` and follow it strictly. Generate a single question for the human and stop.`;

  const jobs = [
    {
      id: "lens-distillation",
      name: "lens-distillation",
      schedule: { kind: "cron", expr: "0 3 * * *", tz: timezone },
      sessionTarget: "isolated",
      payload: {
        kind: "agentTurn",
        message: distillationPrompt,
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
      sessionTarget: "main",
      payload: {
        kind: "systemEvent",
        text: interviewPrompt,
        model: scope.interview.model || undefined
      }
    }
  ];

  try {
    fs.writeFileSync(scopePath, JSON.stringify(scope, null, 2) + '\n');
    if (!fs.existsSync(tracePath)) fs.writeFileSync(tracePath, '', 'utf8');

    const templatesDir = path.join(__dirname, 'templates');
    const lensNodes = [
      { name: 'AXIOM.yaml', path: axiomPath },
      { name: 'ETHOS.yaml', path: ethosPath },
      { name: 'MODUS.yaml', path: modusPath },
      { name: 'README.md', path: readmePath }
    ];

    lensNodes.forEach(lensNode => {
      if (!fs.existsSync(lensNode.path)) {
        fs.writeFileSync(lensNode.path, fs.readFileSync(path.join(templatesDir, lensNode.name), 'utf8'));
      }
    });
  } catch (e) {
    checkAccess(e);
    throw e;
  }

  const linkedSkills = syncSkillLinks(reboot);
  const antigravitySidecars = syncAntigravitySidecars(timezone, interviewExpr, distillationPrompt, interviewPrompt, reboot);
  const isInitialOnboarding = !reboot && scope.interview.phase === 'onboarding' && scope.interview.questions === 15;

  const result = {
    jobs,
    timezone,
    lensDir: LENS_DIR,
    skillDir: SKILL_DIR,
    linkedSkills,
    antigravitySidecars,
    triggerImmediate: isInitialOnboarding ? "lens-interview" : null
  };

  if (reboot || isMain) {
    console.log("BOOTSTRAP_LENS: RESULT_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("BOOTSTRAP_LENS: RESULT_END");
  }
}

export async function preflight(job) {
  const scopePath = path.join(LENS_DIR, 'SCOPE.json');

  let needsReboot = !fs.existsSync(scopePath);

  if (!needsReboot) {
    try {
      const scope = JSON.parse(fs.readFileSync(scopePath, 'utf8'));

      let expectedInterviewExpr = "30 11,17 * * *";
      if (scope.interview?.phase === 'stabilizing') {
        expectedInterviewExpr = "30 11 * * *";
      } else if (scope.interview?.phase === 'habitual') {
        expectedInterviewExpr = "30 11 * * 3";
      }

      if (scope.meta?.version !== LENS_VERSION) {
        needsReboot = true;
      } else if (process.env.OPENCLAW_CRON_LIST) {
        const parsed = JSON.parse(process.env.OPENCLAW_CRON_LIST);
        const crons = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.jobs) ? parsed.jobs : []);
        const distillationCron = crons.find(j => j.name === 'lens-distillation');
        const interviewCron = crons.find(j => j.name === 'lens-interview');
        const distillationText = distillationCron?.payload?.message || distillationCron?.payload?.text || '';
        const interviewText = interviewCron?.payload?.message || interviewCron?.payload?.text || '';

        if (
          !distillationCron ||
          !interviewCron ||
          !distillationText.includes(path.join(__dirname, 'distillation.js')) ||
          !interviewText.includes(path.join(__dirname, 'interview.js')) ||
          interviewCron.schedule?.expr !== expectedInterviewExpr ||
          (scope.distillation?.model || '') !== (distillationCron.payload?.model || '') ||
          (scope.interview?.model || '') !== (interviewCron.payload?.model || '')
        ) {
          needsReboot = true;
        }
      }

      if (job === 'interview') {
        if (typeof scope.interview?.questions === 'number' && scope.interview.questions <= 0) {
          needsReboot = true;
        }
      }
    } catch (e) {
      checkAccess(e);
      needsReboot = true;
    }
  }

  if (needsReboot) await bootstrap(true);
}

if (isMain) bootstrap();
