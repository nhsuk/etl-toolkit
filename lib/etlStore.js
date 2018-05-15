const fsHelper = require('./utils/fsHelper');

class EtlStore {
  constructor(config) {
    this.cache = {};
    this.errorDetails = {};
    this.ids = [];
    this.idKey = config.idKey || 'id';

    this.outputFilename = config.outputFilename;
    this.seedIdFilename = config.seedIdFilename;
    this.cacheIdFilename = config.cacheIdFilename || 'cache-ids.json';
    this.cacheDataFilename = config.cacheDataFilename || 'cache-data.json';
    this.summaryFilename = config.summaryFilename || 'summary.json';
    this.loadState();
  }

  loadState() {
    this.ids = fsHelper.loadJsonSync(this.cacheIdFilename) || [];
    this.cache = fsHelper.loadJsonSync(this.cacheDataFilename) || {};
  }

  saveState() {
    fsHelper.saveJsonSync(this.ids, this.cacheIdFilename);
    fsHelper.saveJsonSync(this.cache, this.cacheDataFilename);
  }

  clearFailedIds(failures) {
    if (failures) {
      failures.forEach(id => delete this.errorDetails[id]);
    } else {
      this.errorDetails = {};
    }
  }

  clearState() {
    this.ids = [];
    this.clearFailedIds();
    this.cache = {};
    this.saveState();
  }

  addIfNew(id) {
    if (this.ids.indexOf(id) < 0) {
      this.ids.push(id);
    }
  }

  addIds(idList) {
    idList.forEach(this.addIfNew, this);
  }

  addFailedId(id, area, message) {
    const failedId = this.errorDetails[id] || {};
    failedId[area] = message;
    this.errorDetails[id] = failedId;
  }

  getIds() {
    return this.ids;
  }

  getErroredIds() {
    return Object.keys(this.errorDetails);
  }

  getRecord(id) {
    return this.cache[id];
  }

  getRecordId(record) {
    return record[this.idKey];
  }

  addRecord(record) {
    this.cache[this.getRecordId(record)] = record;
  }

  deleteRecord(id) {
    delete this.cache[id];
  }
  getRecords() {
    return Object.values(this.cache);
  }

  writeStatus(log) {
    log.info(`${this.getErroredIds().length} IDs failed: ${this.getErroredIds()}`);
    log.info(`See '${this.summaryFilename}' for full details`);
  }

  saveRecords() {
    fsHelper.saveJsonSync(this.getRecords(), this.outputFilename);
    if (this.seedIdFilename) {
      fsHelper.saveJsonSync(this.getIds(), this.seedIdFilename);
    }
  }

  saveSummary() {
    /* eslint-disable sort-keys */
    const summary = {
      lastWritten: (new Date()).toLocaleString(),
      totalScanned: this.ids.length,
      totalErrored: this.getErroredIds().length,
      erroredIds: this.errorDetails,
    };
    /* eslint-enable sort-keys */
    fsHelper.saveJsonSync(summary, this.summaryFilename);
  }
}

module.exports = EtlStore;
