#!/usr/bin/env bun

import { input, select } from '@inquirer/prompts';
import { $ } from 'bun';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';

async function main() {
  console.log('Welcome to FastGPT Plugin Development toolkit');
  const isGitInstalled = await $`git --version`.then(() => true).catch(() => false);
  if (!isGitInstalled) {
    console.error(
      'Git is not installed, please install git first. refer: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git'
    );
    process.exit(1);
  }

  const forkedRepo = await input({
    message: 'Input the FastGPT-plugin fork repo, (if you did not fork yet, please fork it first)',
    validate: (input) => input.length > 0 || 'Please input a valid repo',
    default: 'https://github.com/yourname/fastgpt-plugin'
  });

  const isDirExists = existsSync(join(process.cwd(), 'fastgpt-plugin'));
  if (isDirExists) {
    console.error(
      `${join(process.cwd(), 'fastgpt-plugin')}: Directory already exists, please remove it or run this script in another dir`
    );
    process.exit(1);
  }

  await mkdir(join(process.cwd(), 'fastgpt-plugin'));

  process.chdir(join(process.cwd(), 'fastgpt-plugin'));

  await $`git init`;

  await $`git remote add upstream https://github.com/labring/fastgpt-plugin.git`;
  await $`git remote add origin ${forkedRepo}`;
  await $`git sparse-checkout init --no-cone`;
  await $`git sparse-checkout add '/*' '!/modules/tool/packages/*'`;
  // pull the code
  await $`git pull origin main`;
  await $`bun install`;

  console.log('Plugin development environment setup complete!');

  const createNewTool = await select({
    message: 'Create New Tool Now?',
    choices: [
      { name: 'Yes', value: true },
      { name: 'No', value: false }
    ]
  });

  if (createNewTool) {
    await $`bun run new:tool`;
  }
}

if (import.meta.main) {
  main();
}
