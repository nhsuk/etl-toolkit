const fs = require('fs');

function createDirIfMissing(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}
class FsHelper {
  constructor(config) {
    this.log = config.log;
    this.outputDir = config.outputDir;
  }

  saveJsonSync(obj, filename) {
    createDirIfMissing(this.outputDir);
    const json = JSON.stringify(obj);
    fs.writeFileSync(`${this.outputDir}/${filename}`, json, 'utf8');
    this.log.info(`${filename} saved`);
  }

  loadJsonSync(filename) {
    const path = `${this.outputDir}/${filename}`;
    const jsonString = fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : undefined;
    return jsonString ? JSON.parse(jsonString) : undefined;
  }
}

module.exports = FsHelper;
