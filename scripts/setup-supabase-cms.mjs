import { spawn } from 'node:child_process';

const skipImages = process.argv.includes('--skip-images');
const npmCli = process.env.npm_execpath;

if (process.argv.includes('--help')) {
  console.log('Uso: npm run supabase:setup [-- --skip-images]');
  console.log('Ejecuta migraciones, seed de inventario y subida de imagenes a Supabase.');
  process.exit(0);
}

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });

const runNpmScript = async (scriptName) => {
  if (npmCli) {
    await run(process.execPath, [npmCli, 'run', scriptName]);
    return;
  }

  await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', scriptName]);
};

await runNpmScript('supabase:push');
await runNpmScript('supabase:seed:inventory');

if (skipImages) {
  console.log('Subida de imagenes omitida por --skip-images.');
} else {
  await runNpmScript('supabase:upload:product-images');
}

console.log('Setup de Supabase CMS completado.');
