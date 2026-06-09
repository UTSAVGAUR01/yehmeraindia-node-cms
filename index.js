import fs from 'fs';
import { execSync } from 'child_process';

if (!fs.existsSync('./dist/index.html')) {
  console.log('dist/index.html not found. Building frontend before starting server...');
  execSync('npm run build', { stdio: 'inherit' });
}

await import('./server/index.js');
