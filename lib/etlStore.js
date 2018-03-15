const log = require('./utils/logger');
const fsHelper = require('./utils/fsHelper');
const config = require('./config');

let cache = {};
let erroredIds = {};
let idKey = 'id';
let ids = [];

function setIdKey(key) {
  idKey = key;
}

function getRecordId(record) {
  return record[idKey];
}

function addRecord(record) {
  cache[getRecordId(record)] = record;
  return record;
}

function deleteRecord(id) {
  delete cache[id];
}

function getRecords() {
  return Object.values(cache);
}

function getRecord(id) {
  return cache[id];
}

function getIds() {
  return ids;
}

function clearIds() {
  ids = [];
}

function getErorredIds() {
  return Object.keys(erroredIds);
}

function clearFailedIds(failures) {
  if (failures) {
    failures.forEach(id => delete erroredIds[id]);
  } else {
    erroredIds = {};
  }
}

function addFailedId(id, area, message) {
  const failedId = erroredIds[id] || {};
  failedId[area] = message;
  erroredIds[id] = failedId;
  return id;
}

function addIfNew(id) {
  if (ids.indexOf(id) < 0) {
    ids.push(id);
  }
}

function addIds(idList) {
  idList.map(addIfNew);
  return ids;
}

function saveState() {
  fsHelper.saveJsonSync(ids, config.cacheIdFilename);
  fsHelper.saveJsonSync(cache, config.cacheDataFilename);
}

function clearState() {
  clearIds();
  clearFailedIds();
  cache = {};
  saveState();
}

function loadState() {
  ids = fsHelper.loadJsonSync(config.cacheIdFilename) || [];
  cache = fsHelper.loadJsonSync(config.cacheDataFilename) || {};
}

function writeStatus() {
  const failedAllIds = getErorredIds();
  log.info(`${failedAllIds.length} IDs failed: ${failedAllIds}`);
  log.info(`See '${config.summaryFilename}' for full details`);
}

function saveRecords() {
  writeStatus();
  fsHelper.saveJsonSync(getRecords(), config.outputFilename);
  fsHelper.saveJsonSync(getIds(), config.cacheIdFilename);
}

function saveSummary() {
  const summary = {
    erroredIds: getErorredIds(),
    lastWritten: (new Date()).toLocaleString(),
    totalErrored: getErorredIds().length,
    totalFailed: erroredIds.length,
    totalScanned: ids.length,
  };
  fsHelper.saveJsonSync(summary, config.summaryFilename);
}

loadState();

module.exports = {
  addFailedId,
  addIds,
  addRecord,
  clearFailedIds,
  clearIds,
  clearState,
  deleteRecord,
  getErorredIds,
  getIds,
  getRecord,
  getRecords,
  saveRecords,
  saveState,
  saveSummary,
  setIdKey,
};
