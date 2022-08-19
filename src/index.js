#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { getFiles } = require('./utils');

const args = process.argv.slice(2);

if (args.some(arg => arg.includes('--help') || arg.includes('-h'))) {
  console.log('Usage: template-engine [options] <root_path>');
  console.log();
  console.log('Options:');
  console.log('-h, --help\toutput usage information');

  return;
}

const template = async (templateFilePath, scopeFilePath) => {
  const template = await fs.promises.readFile(templateFilePath, { encoding: 'utf8' });
  const scope = await fs.promises.readFile(scopeFilePath, { encoding: 'utf8' });

  const outputFilePath = templateFilePath.replace('.template', '');

  const compileTemplate = new Function('scope', `return \`${template}\``);

  const compiledTemplate = compileTemplate(JSON.parse(scope));

  await fs.promises.writeFile(outputFilePath, compiledTemplate, { encoding: 'utf8' });
}

(async () => {
  const config = require(path.resolve(process.cwd(), './template-engine.config'));

  const workDir = path.resolve(process.cwd(), config.workDir);

  const excludeFilters = config.exclude?.map(regExp => new RegExp(regExp));
  const includeFilters = [/.+\.template\..+$/];

  const filesPathes = await getFiles(workDir, excludeFilters, includeFilters);

   await Promise.all(filesPathes.map(async (filePath) => await template(filePath, filePath.replace(/\.template\..+$/, '.scope.json'))));
})();

