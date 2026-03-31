import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { preflight } from './bootstrap.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function distillation() {
  await preflight('distillation');

  const SESSIONS_DIR = path.join(process.env.HOME, '.openclaw/agents/main/sessions');
  const OUTPUT_FILE = path.join(process.cwd(), '.lens/TRACE.txt');
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  let userMessages = [];

  if (fs.existsSync(SESSIONS_DIR)) {
    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.jsonl'));

    for (const file of files) {
      const filePath = path.join(SESSIONS_DIR, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtimeMs <= TWENTY_FOUR_HOURS) {
        const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const entry = JSON.parse(line);
            if (entry.type === 'message' && entry.message?.role === 'user') {
              const senderLabel = entry.message?.sender?.label || '';
              const senderId = entry.message?.sender?.id || '';
              const messageContent = Array.isArray(entry.message.content) 
                ? entry.message.content.find(c => c.type === 'text')?.text || ''
                : typeof entry.message.content === 'string' ? entry.message.content : '';

              const isSubagent = senderId.includes('subagent') || senderLabel.toLowerCase().includes('subagent');

              const systemPatterns = [
                '<<<BEGIN_UNTRUSTED_CHILD_RESULT>>>',
                'SECURITY NOTICE',
                'OpenClaw runtime context',
                '[Subagent Context]',
                'Action:'
              ];

              const isSystemMessage = systemPatterns.some(pattern => messageContent.includes(pattern));
              
              if (isSubagent || isSystemMessage) continue;

              let text = messageContent;

              if (text && !text.includes('HEARTBEAT_OK') && !text.startsWith('[cron:') && !text.includes('A new session was started via') && !text.includes('#private')) {
                if (text.length > 2000 && !text.includes('\n\n')) {
                  continue;
                }

                text = text.replace(/^System: \[.*?\].*$/gm, '');
                text = text.replace(/Sender \(untrusted metadata\):[\s\S]*?```[\s\S]*?```\n*/g, '');
                text = text.replace(/^\[[\s\S]*?\]\s*/gm, '');
                text = text.replace(/^Current time:.*$/gm, '');
                text = text.replace(/```[\s\S]*?```/g, '');
                text = text.replace(/^>.*$/gm, '');
                text = text.replace(/<<<EXTERNAL_UNTRUSTED_CONTENT[\s\S]*?END_EXTERNAL_UNTRUSTED_CONTENT.*>>>/g, '');
                text = text.trim();

                if (text.length > 10) {
                  userMessages.push({
                    timestamp: entry.message.timestamp || entry.timestamp || stats.mtimeMs,
                    text: text
                  });
                }
              }
            }
          } catch (e) {
          }
        }
      }
    }
  }

  userMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (userMessages.length === 0) {
    fs.writeFileSync(OUTPUT_FILE, '', 'utf-8');
    console.log('TRACE_EMPTY');
    process.exit(0);
  }

  const formattedOutput = userMessages.map(m => {
    return m.text;
  }).join('\n\n');

  fs.writeFileSync(OUTPUT_FILE, formattedOutput, 'utf-8');
  console.log('DISTILLATION_READY');
}

distillation();
