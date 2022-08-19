const fs = require('fs');

module.exports.filterPathes = (pathes = [], excludeFilters = [], includeFilters = []) => pathes.filter(p => !excludeFilters.some(f => f.test(p)) && includeFilters.some(f => f.test(p)));

module.exports.getFiles = async (dir, excludeFilters, includeFilters) => {
  const pathes = await fs.promises.readdir(dir);

  const stack = module.exports.filterPathes(pathes, excludeFilters, includeFilters);
  const files = [];

  while (stack.length) {
    const p = stack.pop();
    const stat = await fs.promises.stat(p);

    if (stat.isFile()) {
      files.push(p);
    } else {
      const subPathes = module.exports.filterPathes((await fs.promises.readdir(p)).map(sp => path.join(p, sp)), excludeFilters, includeFilters);

      stack.push(...subPathes);
    }
  }

  return files;
}

module.exports.template = async (templateFilePath, scopeFilePath) => {
  const template = await fs.promises.readFile(templateFilePath, { encoding: 'utf8' });
  const scope = await fs.promises.readFile(scopeFilePath, { encoding: 'utf8' });

  const outputFilePath = templateFilePath.replace('.template', '');

  const compileTemplate = new Function('scope', `return \`${template}\``);

  const compiledTemplate = compileTemplate(JSON.parse(scope));

  await fs.promises.writeFile(outputFilePath, compiledTemplate, { encoding: 'utf8' });
}

module.exports.debounce = (cb, ms) => {
  let isCooldown = false;

  return (...args) => {
    if (isCooldown) return;

    cb.apply(this, args);

    isCooldown = true;

    setTimeout(() => isCooldown = false, ms);
  };
};
