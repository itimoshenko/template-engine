const fs = require('fs');

module.exports.filterPathes = (pathes = [], excludeFilters = [], includeFilters = []) => pathes.filter(p => !excludeFilters.some(f => f.test(p)) && includeFilters.every(f => f.test(p)));

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
