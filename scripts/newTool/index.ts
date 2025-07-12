import { input, select } from '@inquirer/prompts';
import fs from 'fs';
import path from 'path';

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
// 2. camelCase
if (name.length > 20) {
  console.error('Tool name must be less than 20 characters');
  process.exit(1);
}
if (name.includes('-')) {
  console.error(`Tool name cannot contain '-'`);
  process.exit(1);
}

if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
  console.error(
    'Tool name must be camelCase, for example: myTool, myToolset. These name can not be used: MyTool, my-tool, my_tool'
  );
  process.exit(1);
}

// 1. Create directory
const toolDir = path.join(process.cwd(), 'modules', 'tool', 'packages', name);
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

// 2. Copy template to target directory
const templateDir = path.join(__dirname, 'template');
if (isToolset) {
  copyTemplate(path.join(templateDir, 'toolSet'), toolDir);
} else {
  copyTemplate(path.join(templateDir, 'tool'), toolDir);
}

// 3. Rewrite new tool package.json
const packageJsonPath = toolDir + '/package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const nameFormatToKebabCase = (name: string) =>
  name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

packageJson.name = `@fastgpt-plugins/tool-${nameFormatToKebabCase(name)}`;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// output success message
console.log(`Tool/Toolset created successfully! 🎉`);
