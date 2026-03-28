import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { bootstrap } from './bootstrap.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pkgPath = path.join(__dirname, '../package.json');
const expectedVersion = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).version;

if (expectedVersion) {
  const setPath = path.join(process.env.HOME, '.lens/SET.json');
  let needsBootstrap = !fs.existsSync(setPath);
  
  if (!needsBootstrap) {
    try {
      const setJson = JSON.parse(fs.readFileSync(setPath, 'utf-8'));
      if (setJson.meta?.version !== expectedVersion) {
        needsBootstrap = true;
      }
    } catch (e) {
      needsBootstrap = true;
    }
  }

  if (needsBootstrap) {
    try {
      await bootstrap();
    } catch (e) {}
  }
}

const SESSIONS_DIR = path.join(process.env.HOME, '.openclaw/agents/main/sessions');
const OUTPUT_FILE = path.join(__dirname, 'transcripts.txt');
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
            const content = entry.message.content;
            let text = '';
            
            if (Array.isArray(content)) {
              text = content.find(c => c.type === 'text')?.text || '';
            } else if (typeof content === 'string') {
              text = content;
            }
            
            if (text && !text.includes('HEARTBEAT_OK') && !text.includes('A new session was started via')) {
              userMessages.push({
                timestamp: entry.message.timestamp || entry.timestamp || stats.mtimeMs,
                text: text.trim()
              });
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
  console.log('EMPTY');
  process.exit(0);
}

const formattedOutput = userMessages.map(m => {
  const dt = new Date(m.timestamp);
  return `[${dt.toISOString().substring(0, 16).replace('T', ' ')}] Joshua: ${m.text}`;
}).join('\n\n');

fs.writeFileSync(OUTPUT_FILE, formattedOutput, 'utf-8');
console.log('READY');
