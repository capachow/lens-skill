import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import { LENS_DIR, checkAccess, preflight } from './bootstrap.js';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const SYSTEM_PATTERNS = [
  '<<<BEGIN_UNTRUSTED_CHILD_RESULT>>>',
  'SECURITY NOTICE',
  'OpenClaw runtime context',
  '[Subagent Context]',
  'The previous agent run was aborted',
  'An async command the user already approved',
  'An async command you ran earlier has completed.',
  'A scheduled reminder has been triggered',
  'Pre-compaction memory flush',
  'The following is an ephemeral message',
  'DISTILLATION_READY',
  'INTERVIEW_READY',
  'BOOTSTRAP_LENS',
  'TRACE_EMPTY',
  'oauth2/callback',
  'oauth/callback',
  'auth/callback',
  'login/callback',
  'oauth2callback'
];

function redact(text, anonymized = false) {
  const securityPatterns = [
    { name: 'URL', regex: /https?:\/\/(?:localhost|(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,63})\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi },
    { name: 'PRIVATE_KEY', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY(?: BLOCK)?-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY(?: BLOCK)?-----/g },
    { name: 'PASSWORD', regex: /\b(?:(?:password|passwd|secret|token)(?:\s+(?:is|was)\s+|\s*[:=]\s*)|bearer\s+)["']?[^\s,;"']+["']?/gi },
    { name: 'API_ID_KEYS', regex: /\b(?:(?:sk|pk|ghp|gho|ghu|ghs|ghr|github_pat|xoxb|xoxp|xoxa|glpat|AIza|AKIA|ya29)[a-zA-Z0-9._-]{12,}|(?=[a-zA-Z0-9_]*[a-zA-Z])(?=[a-zA-Z0-9_]*\d)[a-zA-Z0-9_]{20,})\b/g },
    { name: 'SSN', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
    { name: 'BANK', regex: /\b(?:\d{9}|\d{10,12})\b/g },
    { name: 'IP', regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b|::1\b|\b(?:[a-fA-F0-9]{1,4}:){1,7}:?[a-fA-F0-9]{0,4}(?::[a-fA-F0-9]{1,4}){1,7}\b|\b(?:[a-fA-F0-9]{1,4}:){7,8}[a-fA-F0-9]{1,4}\b/g }
  ];

  const privatePatterns = [
    { name: 'EMAIL', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
    { name: 'PHONE', regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{3}[-.\s]\d{4}\b|\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g },
    { name: 'ADDRESS', regex: /\b\d{1,5}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way|Pkwy|Parkway)\b/g },
    { name: 'DOB', regex: /\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/g },
    { name: 'USER_HANDLE', regex: /\B@[\w.-]+\b/g }
  ];

  let cleaned = text;

  if (anonymized) {
    privatePatterns.forEach(p => {
      cleaned = cleaned.replace(p.regex, `[REDACTED_${p.name}]`);
    });
  }

  securityPatterns.forEach(p => {
    cleaned = cleaned.replace(p.regex, `[REDACTED_${p.name}]`);
  });

  return cleaned;
}

function cleanUserText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  if (rawText.includes('HEARTBEAT_OK') || rawText.startsWith('[cron:') || rawText.includes('A new session was started via')) {
    return '';
  }

  let text = rawText;
  text = text.replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/g, '');
  text = text.replace(/<USER_SETTINGS_CHANGE>[\s\S]*?<\/USER_SETTINGS_CHANGE>/g, '');
  text = text.replace(/<SYSTEM_MESSAGE>[\s\S]*?<\/SYSTEM_MESSAGE>/g, '');
  text = text.replace(/<ide_opened_file>[\s\S]*?<\/ide_opened_file>/g, '');
  text = text.replace(/<ide_selection>[\s\S]*?<\/ide_selection>/g, '');
  text = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '');
  text = text.replace(/<command-name>[\s\S]*?<\/command-name>/g, '');
  text = text.replace(/<command-message>[\s\S]*?<\/command-message>/g, '');
  text = text.replace(/<command-args>[\s\S]*?<\/command-args>/g, '');
  text = text.replace(/<local-command-stdout>[\s\S]*?<\/local-command-stdout>/g, '');
  text = text.replace(/<local-command-caveat>[\s\S]*?<\/local-command-caveat>/g, '');

  const userRequestMatch = text.match(/<USER_REQUEST>\s*([\s\S]*?)\s*<\/USER_REQUEST>/);
  if (userRequestMatch) {
    text = userRequestMatch[1];
  }

  if (text.includes('#private') || SYSTEM_PATTERNS.some(pattern => text.includes(pattern))) {
    return '';
  }

  if (text.length > 2000 && !text.includes('\n\n') && !text.includes('\r\n\r\n')) {
    return '';
  }

  text = text.replace(/^System(?: \([^)]+\))?: \[.*?\].*$/gm, '');
  text = text.replace(/^Action:\s.*$/gm, '');
  text = text.replace(/Sender \(untrusted metadata\):[\s\S]*?```[\s\S]*?```\n*/g, '');
  text = text.replace(/^\[[^\r\n\]]*\]\s*/gm, '');
  text = text.replace(/^Current time:.*$/gm, '');
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/^>.*$/gm, '');
  text = text.replace(/<<<EXTERNAL_UNTRUSTED_CONTENT[\s\S]*?END_EXTERNAL_UNTRUSTED_CONTENT.*>>>/g, '');
  text = text.trim();

  return text.length > 10 ? text : '';
}

function collectAntigravityMessages(homeDir, now) {
  const messages = [];
  const geminiDir = path.join(homeDir, '.gemini');
  const brainRoots = [];

  if (fs.existsSync(geminiDir)) {
    try {
      const dirs = fs.readdirSync(geminiDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('antigravity'))
        .map(dirent => path.join(geminiDir, dirent.name, 'brain'));
      brainRoots.push(...dirs);
    } catch (e) {
      checkAccess(e);
    }
  }

  for (const brainDir of brainRoots) {
    if (!fs.existsSync(brainDir)) continue;

    let conversations = [];
    try {
      conversations = fs.readdirSync(brainDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    } catch (e) {
      checkAccess(e);
      continue;
    }

    for (const convId of conversations) {
      const logsDir = path.join(brainDir, convId, '.system_generated/logs');
      const fullPath = path.join(logsDir, 'transcript_full.jsonl');
      const compactPath = path.join(logsDir, 'transcript.jsonl');
      const targetPath = fs.existsSync(fullPath) ? fullPath : (fs.existsSync(compactPath) ? compactPath : null);

      if (!targetPath) continue;

      let stats;
      try {
        stats = fs.statSync(targetPath);
      } catch (e) {
        continue;
      }

      if (now - stats.mtimeMs > TWENTY_FOUR_HOURS) continue;

      let lines = [];
      try {
        lines = fs.readFileSync(targetPath, 'utf8').split('\n');
      } catch (e) {
        continue;
      }

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          if (entry.source === 'USER_EXPLICIT' && entry.type === 'USER_INPUT' && typeof entry.content === 'string') {
            const ts = (entry.created_at ? new Date(entry.created_at).getTime() : 0) || stats.mtimeMs;
            if (now - ts <= TWENTY_FOUR_HOURS) {
              const cleaned = cleanUserText(entry.content);
              if (cleaned) {
                messages.push({ timestamp: ts, text: cleaned });
              }
            }
          }
        } catch (e) {}
      }
    }
  }

  return messages;
}

function parseGeminiCliChatRecord(entry, fallbackTs, now, messages) {
  if (!entry || entry.type !== 'user') return;
  if (Array.isArray(entry.content) && entry.content.some(c => c && (c.functionResponse || c.functionCall))) {
    return;
  }

  const rawContent = entry.displayContent ?? entry.content ?? entry.message;
  const messageContent = typeof rawContent === 'string'
    ? rawContent
    : Array.isArray(rawContent)
      ? rawContent.map(c => (typeof c === 'string' ? c : (typeof c?.text === 'string' ? c.text : ''))).filter(Boolean).join('\n')
      : '';

  if (!messageContent) return;

  const ts = (entry.timestamp ? new Date(entry.timestamp).getTime() : 0) || fallbackTs;
  if (now - ts <= TWENTY_FOUR_HOURS) {
    const cleaned = cleanUserText(messageContent);
    if (cleaned) {
      messages.push({ timestamp: ts, text: cleaned });
    }
  }
}

function collectGeminiCliMessages(homeDir, now) {
  const messages = [];
  const tmpDir = path.join(homeDir, '.gemini/tmp');
  if (!fs.existsSync(tmpDir)) return messages;

  let projectDirs = [];
  try {
    projectDirs = fs.readdirSync(tmpDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => path.join(tmpDir, dirent.name));
  } catch (e) {
    checkAccess(e);
    return messages;
  }

  for (const projectDir of projectDirs) {
    const logsFile = path.join(projectDir, 'logs.json');
    if (fs.existsSync(logsFile)) {
      try {
        const stats = fs.statSync(logsFile);
        if (now - stats.mtimeMs <= TWENTY_FOUR_HOURS) {
          const entries = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
          if (Array.isArray(entries)) {
            for (const entry of entries) {
              parseGeminiCliChatRecord(entry, stats.mtimeMs, now, messages);
            }
          }
        }
      } catch (e) {}
    }

    const chatsDir = path.join(projectDir, 'chats');
    if (!fs.existsSync(chatsDir)) continue;

    let chatFiles = [];
    try {
      chatFiles = fs.readdirSync(chatsDir, { withFileTypes: true })
        .filter(dirent => dirent.isFile() && dirent.name.startsWith('session-') && (dirent.name.endsWith('.json') || dirent.name.endsWith('.jsonl')))
        .map(dirent => path.join(chatsDir, dirent.name));
    } catch (e) {
      continue;
    }

    for (const chatFile of chatFiles) {
      let stats;
      try {
        stats = fs.statSync(chatFile);
      } catch (e) {
        continue;
      }

      if (now - stats.mtimeMs > TWENTY_FOUR_HOURS) continue;

      if (chatFile.endsWith('.json')) {
        try {
          const parsed = JSON.parse(fs.readFileSync(chatFile, 'utf8'));
          if (parsed?.kind === 'subagent') continue;
          if (Array.isArray(parsed?.messages)) {
            for (const msg of parsed.messages) {
              parseGeminiCliChatRecord(msg, stats.mtimeMs, now, messages);
            }
          }
        } catch (e) {}
      } else {
        let lines = [];
        try {
          lines = fs.readFileSync(chatFile, 'utf8').split('\n');
        } catch (e) {
          continue;
        }

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const entry = JSON.parse(line);
            if (entry?.kind === 'subagent') break;
            if (Array.isArray(entry?.$set?.messages)) {
              for (const msg of entry.$set.messages) {
                parseGeminiCliChatRecord(msg, stats.mtimeMs, now, messages);
              }
            } else {
              parseGeminiCliChatRecord(entry, stats.mtimeMs, now, messages);
            }
          } catch (e) {}
        }
      }
    }
  }

  return messages;
}

function parseOpenClawEntry(entry, fallbackTs, now, messages) {
  if (!entry || entry.type !== 'message' || entry.message?.role !== 'user') return;

  const senderLabel = entry.message?.sender?.label || '';
  const senderId = entry.message?.sender?.id || '';
  const isSubagent = senderId.includes('subagent') || senderLabel.toLowerCase().includes('subagent');
  if (isSubagent) return;

  const messageContent = Array.isArray(entry.message.content)
    ? entry.message.content.find(c => c.type === 'text')?.text || ''
    : typeof entry.message.content === 'string' ? entry.message.content : '';

  const rawTs = entry.message.timestamp || entry.timestamp || fallbackTs;
  const ts = new Date(rawTs).getTime() || fallbackTs;

  if (now - ts <= TWENTY_FOUR_HOURS) {
    const cleaned = cleanUserText(messageContent);
    if (cleaned) {
      messages.push({ timestamp: ts, text: cleaned });
    }
  }
}

async function collectOpenClawMessages(homeDir, now) {
  const messages = [];
  const sqlitePath = path.join(homeDir, '.openclaw/agents/main/agent/openclaw-agent.sqlite');

  if (fs.existsSync(sqlitePath)) {
    try {
      const stats = fs.statSync(sqlitePath);
      const walPath = `${sqlitePath}-wal`;
      const walMtime = fs.existsSync(walPath) ? fs.statSync(walPath).mtimeMs : 0;
      const latestMtime = Math.max(stats.mtimeMs, walMtime);
      if (now - latestMtime <= TWENTY_FOUR_HOURS) {
        const sqlite = await import('node:sqlite');
        const db = new sqlite.DatabaseSync(sqlitePath, { readOnly: true });
        try {
          const rows = db.prepare('SELECT event_json, event_zstd FROM transcript_events').all();
          for (const row of rows) {
            let rawJson = row.event_json;
            if (!rawJson && row.event_zstd && typeof zlib.zstdDecompressSync === 'function') {
              rawJson = zlib.zstdDecompressSync(row.event_zstd).toString('utf8');
            }
            if (!rawJson) continue;
            try {
              const entry = JSON.parse(rawJson);
              parseOpenClawEntry(entry, latestMtime, now, messages);
            } catch (e) {}
          }
        } finally {
          db.close();
        }
      }
    } catch (e) {
      checkAccess(e);
    }
  }

  const sessionsDir = path.join(homeDir, '.openclaw/agents/main/sessions');
  if (!fs.existsSync(sessionsDir)) return messages;

  let files = [];
  try {
    files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
  } catch (e) {
    checkAccess(e);
    return messages;
  }

  for (const file of files) {
    const filePath = path.join(sessionsDir, file);
    let stats;
    try {
      stats = fs.statSync(filePath);
    } catch (e) {
      continue;
    }

    if (now - stats.mtimeMs > TWENTY_FOUR_HOURS) continue;

    let lines = [];
    try {
      lines = fs.readFileSync(filePath, 'utf8').split('\n');
    } catch (e) {
      continue;
    }

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        parseOpenClawEntry(entry, stats.mtimeMs, now, messages);
      } catch (e) {}
    }
  }

  return messages;
}

function collectClaudeCodeMessages(homeDir, now) {
  const messages = [];
  const projectsDir = path.join(homeDir, '.claude/projects');
  if (!fs.existsSync(projectsDir)) return messages;

  let projects = [];
  try {
    projects = fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => path.join(projectsDir, dirent.name));
  } catch (e) {
    checkAccess(e);
    return messages;
  }

  for (const projectPath of projects) {
    let files = [];
    try {
      files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'));
    } catch (e) {
      continue;
    }

    for (const file of files) {
      const filePath = path.join(projectPath, file);
      let stats;
      try {
        stats = fs.statSync(filePath);
      } catch (e) {
        continue;
      }

      if (now - stats.mtimeMs > TWENTY_FOUR_HOURS) continue;

      let lines = [];
      try {
        lines = fs.readFileSync(filePath, 'utf8').split('\n');
      } catch (e) {
        continue;
      }

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          if (entry.isMeta || entry.isSidechain) continue;
          if (entry.type === 'user' && entry.message?.role === 'user') {
            if (Array.isArray(entry.message.content) && entry.message.content.some(c => c.type === 'tool_result')) {
              continue;
            }

            const messageContent = Array.isArray(entry.message.content)
              ? entry.message.content.filter(c => c.type === 'text' && typeof c.text === 'string').map(c => c.text).join('\n')
              : typeof entry.message.content === 'string' ? entry.message.content : '';

            const rawTs = entry.timestamp || stats.mtimeMs;
            const ts = new Date(rawTs).getTime() || stats.mtimeMs;

            if (now - ts <= TWENTY_FOUR_HOURS) {
              const cleaned = cleanUserText(messageContent);
              if (cleaned) {
                messages.push({ timestamp: ts, text: cleaned });
              }
            }
          }
        } catch (e) {}
      }
    }
  }

  return messages;
}

function collectCodexMessages(homeDir, now) {
  const messages = [];
  const codexDir = process.env.CODEX_HOME || path.join(homeDir, '.codex');
  const sessionsDir = path.join(codexDir, 'sessions');
  if (!fs.existsSync(sessionsDir)) return messages;

  let files = [];
  try {
    files = fs.readdirSync(sessionsDir, { recursive: true })
      .filter(f => typeof f === 'string' && f.endsWith('.jsonl'))
      .map(f => path.join(sessionsDir, f));
  } catch (e) {
    checkAccess(e);
    return messages;
  }

  for (const filePath of files) {
    let stats;
    try {
      stats = fs.statSync(filePath);
    } catch (e) {
      continue;
    }

    if (now - stats.mtimeMs > TWENTY_FOUR_HOURS) continue;

    let lines = [];
    try {
      lines = fs.readFileSync(filePath, 'utf8').split('\n');
    } catch (e) {
      continue;
    }

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'response_item' && entry.payload?.type === 'message' && entry.payload?.role === 'user' && Array.isArray(entry.payload.content)) {
          const textBlocks = entry.payload.content
            .filter(c => c.type === 'input_text' && typeof c.text === 'string')
            .map(c => c.text)
            .filter(t => !t.includes('<environment_context>') && !t.includes('<permissions instructions>') && !t.includes('<user_instructions>') && !t.startsWith('# AGENTS.md instructions'));

          const messageContent = textBlocks.join('\n');
          const rawTs = entry.timestamp || stats.mtimeMs;
          const ts = new Date(rawTs).getTime() || stats.mtimeMs;

          if (now - ts <= TWENTY_FOUR_HOURS) {
            const cleaned = cleanUserText(messageContent);
            if (cleaned) {
              messages.push({ timestamp: ts, text: cleaned });
            }
          }
        }
      } catch (e) {}
    }
  }

  return messages;
}

async function distillation() {
  await preflight('distillation');

  const scopePath = path.join(LENS_DIR, 'SCOPE.json');
  const outputFile = path.join(LENS_DIR, 'TRACE.txt');
  let anonymized = false;

  if (fs.existsSync(scopePath)) {
    try {
      const scope = JSON.parse(fs.readFileSync(scopePath, 'utf8'));
      anonymized = scope.meta?.anonymize === true;
    } catch (e) {
      checkAccess(e);
    }
  }

  const homeDir = process.env.HOME || os.homedir() || '';
  const now = Date.now();

  const rawMessages = [
    ...collectAntigravityMessages(homeDir, now),
    ...collectGeminiCliMessages(homeDir, now),
    ...(await collectOpenClawMessages(homeDir, now)),
    ...collectClaudeCodeMessages(homeDir, now),
    ...collectCodexMessages(homeDir, now)
  ];

  rawMessages.sort((a, b) => a.timestamp - b.timestamp);

  const seen = new Set();
  const userMessages = rawMessages.filter(m => {
    if (seen.has(m.text)) return false;
    seen.add(m.text);
    return true;
  });

  if (userMessages.length === 0) {
    try {
      fs.writeFileSync(outputFile, '', 'utf8');
    } catch (e) {
      checkAccess(e);
      throw e;
    }
    console.log('TRACE_EMPTY');
    process.exit(0);
  }

  const formattedOutput = userMessages.map(m => m.text).join('\n---\n');
  try {
    fs.writeFileSync(outputFile, redact(formattedOutput, anonymized) + '\n', 'utf8');
  } catch (e) {
    checkAccess(e);
    throw e;
  }
  console.log('DISTILLATION_READY');
}

distillation();
