import fs from 'fs';
import path from 'path';

/**
 * LENS Bootstrap Logic
 * 1. Verifies/Creates .lens structure
 * 2. Pulls timezone context from USER.md (Default: UTC)
 * 3. Registers core LENS cron jobs for Distillation and Interviewing
 */

async function bootstrap() {
    console.log("💎 LENS: Initializing universal identity engine...");

    // 1. Structure Verification
    const lensDir = path.join(process.cwd(), '.lens');
    if (!fs.existsSync(lensDir)) {
        fs.mkdirSync(lensDir);
    }

    // 2. Context Extraction (Timezone)
    let timezone = 'UTC';
    try {
        const userContent = fs.readFileSync(path.join(process.cwd(), 'USER.md'), 'utf8');
        const tzMatch = userContent.match(/Timezone:.*?\((.*?)\)/);
        if (tzMatch && tzMatch[1]) {
            timezone = tzMatch[1].trim();
        }
    } catch (e) {}

    // 3. Trinity Initialization
    const installDate = new Date().toISOString().split('T')[0];
    const templatesDir = path.join(process.cwd(), 'skills/lens/scripts/templates');

    const axiomPath = path.join(lensDir, 'AXIOM.md');
    const ethosPath = path.join(lensDir, 'ETHOS.md');
    const modusPath = path.join(lensDir, 'MODUS.md');

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

    /**
     * 4. Cron Registration
     */
    const jobs = [
        {
            id: "lens-distillation",
            name: "lens-distillation",
            schedule: { kind: "cron", expr: "0 3 * * *", tz: timezone },
            payload: {
                kind: "agentTurn",
                message: "Read skills/lens/prompts/distillation.md and follow it.",
                model: "gemini-3-pro-preview"
            }
        },
        {
            id: "lens-interview",
            name: "lens-interview",
            schedule: { kind: "cron", expr: "30 11,17 * * *", tz: timezone },
            payload: {
                kind: "agentTurn",
                message: "Read skills/lens/prompts/interview.md and follow it.",
                model: "gemini-3-flash-preview",
                deliver: true,
                to: "main"
            }
        }
    ];

    return { jobs, timezone, triggerImmediate: "lens-interview" };
}

bootstrap().then(result => {
    console.log("BOOTSTRAP_RESULT_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("BOOTSTRAP_RESULT_END");
});
