#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { getFiles, template, debounce } = require('./utils');

const log = require('./logger')('template-engine');

const args = process.argv.slice(2);

if (args.some(arg => arg.includes('--help') || arg.includes('-h'))) {
  console.log('Usage: template-engine [options] <root_path>');
  console.log();
  console.log('Options:');
  console.log('-h, --help\toutput usage information');
  console.log('-w, --watch\twatch template files ');

  return;
}

const config = require(path.resolve(process.cwd(), './template-engine.config'));

const workDir = path.resolve(process.cwd(), config.workDir);

const excludeFilters = config.exclude?.map(regExp => new RegExp(regExp));
const includeFilters = [/.+\.template\..+$/, /.+\.scope\..+$/];

const watchFiles = async () => {
  const filesPathes = await getFiles(workDir, excludeFilters, includeFilters);

  const promises = filesPathes.map(async (filePath) => {
    const fullPath = path.join(workDir, filePath);

    await fs.promises.access(fullPath, fs.F_OK).catch(() => {
      log(`${filePath} not found`);
    });

    fs.watch(fullPath, debounce(async (event, fileName) => {
      log(`${fileName} file changed`);

      const baseFilePath = fileName.replace(/\.(template|scope)\..+$/, '')
      const templateFilePath = filesPathes.find((filePath) => filePath.includes(`${baseFilePath}.template`));
      const scopeFilePath = filesPathes.find((filePath) => filePath.includes(`${baseFilePath}.scope`));

      if (!templateFilePath || !scopeFilePath) return;

      await template(templateFilePath, scopeFilePath);
    }, config.watchDelay));
  });

  log(`watch mode started`);

  return await Promise.all(promises);
}

const run = async () => {
  const filePathes = await getFiles(workDir, excludeFilters, includeFilters);
  const templateFilePathes = filePathes.filter(path => path.includes('.template.'));

  await Promise.all(templateFilePathes.map(async (filePath) => {
    const baseFilePath = filePath.replace(/\.template\..+$/, '');
    const scopeFilePath = filePathes.find((filePath) => filePath.includes(`${baseFilePath}.scope`));

    await template(filePath, scopeFilePath);
  }));

  if (args.some(arg => arg.includes('--watch') || arg.includes('-w'))) {
    await watchFiles();
  }
}

run();
