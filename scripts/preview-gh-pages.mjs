import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const repoName = 'tjc-care-card';
const sourceDir = join('dist', repoName, 'browser');
const previewRoot = '.preview';
const targetDir = join(previewRoot, repoName);
const port = process.env.PORT ?? '8080';

if (!existsSync(sourceDir)) {
  console.error('請先執行: npm run build');
  process.exit(1);
}

rmSync(previewRoot, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });

const indexPath = join(targetDir, 'index.html');
writeFileSync(join(targetDir, '404.html'), readFileSync(indexPath));

const url = `http://127.0.0.1:${port}/${repoName}/`;
console.log(`\nGitHub Pages 預覽: ${url}\n`);

spawn('npx', ['http-server', previewRoot, '-p', port, '-c-1'], {
  stdio: 'inherit',
  shell: true,
});
