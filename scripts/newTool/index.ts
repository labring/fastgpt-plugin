import { $ } from 'bun';
import { input, select } from '@inquirer/prompts';
import fs from 'fs';
import path from 'path';
// const program = new Command();

// program
//   .name('new')
//   .description('Create a new tool or toolset')
//   .option('--toolset', 'Create a toolset')
//   .argument('<name>', 'name');

// program.parse();

// const isToolset = program.opts().toolset as boolean;
// const name = program.args[0];

const isToolset =
  (await select({
    message: 'What kind of tool/toolset do you want to create?',
    choices: [
      {
        name: 'Tool',
        value: 'tool'
      },
      {
        name: 'Toolset',
        value: 'toolset'
      }
    ]
  })) === 'toolset';

const name = await input({
  message: 'What is the name of your tool/toolset?',
  validate: (value) => {
    if (value.length < 1) {
      return 'Please enter a name';
    }
    return true;
  }
});

// name validation:
// 1. less than 20 characters
if (name.length > 20) {
  console.error('Tool name must be less than 20 characters');
  process.exit(1);
}

const templateDir = path.join(__dirname, 'template');
const toolDir = path.join(process.cwd(), 'packages', 'tool', 'packages', name);
if (fs.existsSync(toolDir)) {
  console.error('Tool already exists');
  process.exit(1);
} else {
  fs.mkdirSync(toolDir, { recursive: true });
}

const copyTemplate = (src: string, dest: string) => {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((file) => {
      copyTemplate(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

if (isToolset) {
  copyTemplate(templateDir, toolDir);
} else {
  copyTemplate(path.join(templateDir, 'tool'), toolDir);
}

// update package.json
const packageJsonPath = path.join(templateDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
packageJson.name = `fastgpt-tools-${name}`;
fs.writeFileSync(toolDir + '/package.json', JSON.stringify(packageJson, null, 2));

// Install package
(async () => $`bun --cwd=${process.cwd()} install`.quiet())();

// output success message
console.log(`Tool/Toolset created successfully! 🎉`);
