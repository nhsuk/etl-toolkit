const outputFile = 'etl-data';
const config = {
  cacheDataFilename: 'cache-data.json',
  cacheIdFilename: 'cache-ids.json',
  etlName: process.env.ETL_NAME || 'etl-toolkit',
  hitsPerHour: process.env.HITS_PER_HOUR || 20000,
  idListFile: 'ids',
  outputDir: './output',
  outputFile,
  outputFilename: `${outputFile}.json`,
  processedPagesFilename: 'processed-pages.json',
  saveEvery: 100,
  summaryFilename: 'summary.json',
};

module.exports = config;
