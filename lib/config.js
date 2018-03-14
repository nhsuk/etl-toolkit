const version = require('../package').version;

const config = {
  etlName: process.env.ETL_NAME || 'etl-toolkit',
  version,
  hitsPerHour: process.env.HITS_PER_HOUR || 20000,
  saveEvery: 100,
  outputDir: './output',
  outputFile: process.env.OUTPUT_FILE || 'etl-data',
  idListFile: 'ids',
};

module.exports = config;
