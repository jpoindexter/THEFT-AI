#!/usr/bin/env node
/**
 * Post-install script: applies embedded-postgres fixes that pnpm v11 can't patch
 * directly (JS code fix + dylib symlinks for macOS arm64).
 */
import { readFileSync, writeFileSync, existsSync, symlinkSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Find embedded-postgres install path
let epJsPath;
try {
  const pnpmStore = execSync('pnpm store path', { cwd: root, encoding: 'utf8' }).trim();
  // Walk .pnpm to find embedded-postgres dist/index.js
  const pnpmDir = join(root, 'node_modules/.pnpm');
  const entries = readdirSync(pnpmDir);
  const epEntry = entries.find(e => e.startsWith('embedded-postgres@18.1.0-beta.16'));
  if (epEntry) {
    epJsPath = join(pnpmDir, epEntry, 'node_modules/embedded-postgres/dist/index.js');
  }
} catch {}

if (!epJsPath || !existsSync(epJsPath)) {
  console.log('[postinstall] embedded-postgres not found, skipping patch');
  process.exit(0);
}

// Apply JS patches
let src = readFileSync(epJsPath, 'utf8');
let changed = false;

if (src.includes("LC_MESSAGES_LOCALE = 'en_US.UTF-8'")) {
  src = src.replace("const LC_MESSAGES_LOCALE = 'en_US.UTF-8';", "const LC_MESSAGES_LOCALE = 'C';");
  changed = true;
}

const repairFn = `
const repairBundledPostgresFiles = (postgresBin, onLog) => __awaiter(void 0, void 0, void 0, function* () {
    const sqlFeaturesFile = path.resolve(path.dirname(postgresBin), '..', 'share', 'postgresql', 'sql_features.txt');
    try {
        const current = yield fs.readFile(sqlFeaturesFile, 'utf8');
        const repaired = current.split('\\n').map((line) => {
            if (!line) return line;
            const fieldCount = line.split('\\t').length;
            return fieldCount === 5 ? \`\${line}\\t\` : line;
        }).join('\\n');
        if (repaired !== current) {
            yield fs.writeFile(sqlFeaturesFile, repaired, 'utf8');
            onLog(\`Repaired embedded PostgreSQL sql_features metadata at \${sqlFeaturesFile}\\n\`);
        }
    } catch (err) {
        onLog(\`Could not inspect sql_features metadata: \${err instanceof Error ? err.message : String(err)}\\n\`);
    }
});`;

const insertAfter = "        yield fs.chmod(filePath, stat.mode | BIN_PERMISSIONS);\n    }\n});";
if (!src.includes('repairBundledPostgresFiles')) {
  src = src.replace(insertAfter, insertAfter + "\n" + repairFn);
  src = src.replace(
    "            const { postgres, initdb } = yield bin;\n            // GUARD: Check that a postgres user",
    "            const { postgres, initdb } = yield bin;\n            yield repairBundledPostgresFiles(postgres, this.options.onLog);\n            // GUARD: Check that a postgres user"
  );
  changed = true;
}

const oldEnv = "{ env: { LC_MESSAGES: LC_MESSAGES_LOCALE } }))";
const newEnv = "{ env: Object.assign(Object.assign({}, globalThis.process.env), { LC_MESSAGES: LC_MESSAGES_LOCALE }) }))";
if (src.includes(oldEnv)) {
  src = src.replaceAll(oldEnv, newEnv);
  changed = true;
}

if (changed) {
  writeFileSync(epJsPath, src, 'utf8');
  console.log('[postinstall] Applied embedded-postgres JS patches');
}

// Fix dylib symlinks on macOS arm64
if (process.platform === 'darwin' && process.arch === 'arm64') {
  const epBase = dirname(dirname(epJsPath));
  const libDir = join(epBase, 'native/lib');
  if (existsSync(libDir)) {
    const libs = readdirSync(libDir);
    // Map of what the postgres binary needs -> what we have
    const symlinks = {
      'libicui18n.dylib': 'libicui18n.77.1.dylib',
      'libicuuc.77.dylib': 'libicuuc.77.1.dylib',
      'libicudata.77.dylib': 'libicudata.77.1.dylib',
      'libzstd.1.dylib': 'libzstd.1.5.7.dylib',
      'liblz4.1.dylib': 'liblz4.1.10.0.dylib',
      'libz.1.dylib': 'libz.1.3.1.dylib',
    };
    for (const [link, target] of Object.entries(symlinks)) {
      const linkPath = join(libDir, link);
      const targetPath = join(libDir, target);
      if (!existsSync(linkPath) && existsSync(targetPath)) {
        symlinkSync(targetPath, linkPath);
        console.log(`[postinstall] Created dylib symlink: ${link} -> ${target}`);
      }
    }
  }
}

console.log('[postinstall] embedded-postgres fixes complete');
