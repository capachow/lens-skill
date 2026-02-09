import fs from 'fs';
import path from 'path';

async function bootstrap() {
    console.log("🧐 LENS: Initializing universal identity engine...");

    const lensDir = path.join(process.cwd(), '.lens');
    if (!fs.existsSync(lensDir)) {
        fs.mkdirSync(lensDir);
    }

    let timezone = 'UTC';
    try {
        const userContent = fs.readFileSync(path.join(process.cwd(), 'USER.md'), 'utf8');
        const tzMatch = userContent.match(/Timezone:.*?\((.*?)\)/);
        if (tzMatch && tzMatch[1]) {
            timezone = tzMatch[1].trim();
        }
    } catch (e) {}

    const setPath = path.join(lensDir, 'SET.json');
    const axiomPath = path.join(lensDir, 'AXIOM.md');
    const ethosPath = path.join(lensDir, 'ETHOS.md');
    const modusPath = path.join(lensDir, 'MODUS.md');

    let settings = {
        interview: {
            phase: "onboarding",
            questions: 7,
            model: ""
        },
        distillation: {
            model: "gemini-pro-preview"
        }
    };

    if (fs.existsSync(setPath)) {
        try {
            const existingSettings = JSON.parse(fs.readFileSync(setPath, 'utf8'));
            settings.interview = { ...settings.interview, ...(existingSettings.interview || {}) };
            settings.distillation = { ...settings.distillation, ...(existingSettings.distillation || {}) };
        } catch (e) {
            console.error("🧐 LENS: Failed to parse SET.json, using defaults.");
        }
    } else {
        if (fs.existsSync(axiomPath)) {
            try {
                const axiomContent = fs.readFileSync(axiomPath, 'utf8');
                const phaseMatch = axiomContent.match(/Interview Phase: (\d+)-(\d+)-(\d+)/);
                if (phaseMatch) {
                    const [_, init, stab, hab] = phaseMatch.map(Number);
                    if (init > 0) {
                        settings.interview.phase = "onboarding";
                        settings.interview.questions = init;
                    } else if (stab > 0) {
                        settings.interview.phase = "stabilizing";
                        settings.interview.questions = stab;
                    } else {
                        settings.interview.phase = "habitual";
                        settings.interview.questions = true;
                    }
                    const cleanedAxiom = axiomContent.replace(/^- Interview Phase: \d+-\d+-\d+\n/m, '');
                    fs.writeFileSync(axiomPath, cleanedAxiom);
                    console.log("🧐 LENS: Migrated phase data from AXIOM.md to SET.json");
                }
            } catch (e) {
                console.error("🧐 LENS: Migration failed, using defaults.");
            }
        }
        fs.writeFileSync(setPath, JSON.stringify(settings, null, 2));
    }

    const installDate = new Date().toISOString().split('T')[0];
    const templatesDir = path.join(process.cwd(), 'skills/lens/scripts/templates');

    const nodes = [
        { name: 'AXIOM.md', path: axiomPath },
        { name: 'ETHOS.md', path: ethosPath },
        { name: 'MODUS.md', path: modusPath }
    ];

    nodes.forEach(node => {
        if (!fs.existsSync(node.path)) {
            let content = fs.readFileSync(path.join(templatesDir, node.name), 'utf8');
            content = content.replace('{{INSTALL_DATE}}', installDate);
            fs.writeFileSync(node.path, content);
        }
    });

    const jobs = [
        {
            id: "lens-distillation",
            name: "lens-distillation",
            schedule: { kind: "cron", expr: "0 3 * * *", tz: timezone },
            payload: {
                kind: "agentTurn",
                message: "Read skills/lens/prompts/distillation.md and follow it.",
                model: settings.distillation.model || "gemini-pro-preview"
            }
        },
        {
            id: "lens-interview",
            name: "lens-interview",
            schedule: { kind: "cron", expr: "30 11,17 * * *", tz: timezone },
            sessionTarget: "main",
            payload: {
                kind: "systemEvent",
                text: "Read skills/lens/prompts/interview.md and follow it strictly. Generate a single question for the human and stop."
            }
        }
    ];

    if (settings.interview.model) {
        jobs[1].payload.model = settings.interview.model;
    }

    return { jobs, timezone, triggerImmediate: "lens-interview" };
}

bootstrap().then(result => {
    console.log("BOOTSTRAP_RESULT_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("BOOTSTRAP_RESULT_END");
});
