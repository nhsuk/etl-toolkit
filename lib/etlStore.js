const log = require('./utils/logger');
const fsHelper = require('./utils/fsHelper');
const config = require('./config');

let ids = [];
let failedIds = {};
let cache = {};
let idKey = 'id';

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

function getFailedIds() {
  return Object.keys(failedIds);
}

function getErorredIds() {
  return getFailedIds();
}

function clearFailedIds(failures) {
  if (failures) {
    failures.forEach(id => delete failedIds[id]);
  } else {
    failedIds = {};
  }
}

function addFailedId(id, area, message) {
  const failedId = failedIds[id] || {};
  failedId[area] = message;
  failedIds[id] = failedId;
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
  fsHelper.saveJsonSync(ids, config.idListFile);
  fsHelper.saveJsonSync(cache, 'cache');
}

function clearState() {
  clearIds();
  cache = {};
  clearFailedIds();
  saveState();
}

function loadState() {
  ids = fsHelper.loadJsonSync(config.idListFile) || [];
  cache = fsHelper.loadJsonSync('cache') || {};
}

function writeStatus() {
  const failedAllIds = getErorredIds();
  log.info(`${failedAllIds.length} IDs failed: ${failedAllIds}`);
  log.info(`see summary.json file in '${config.outputDir}' for full details`);
}

function saveRecords() {
  writeStatus();
  fsHelper.saveJsonSync(getRecords(), config.outputFile);
  fsHelper.saveJsonSync(getIds(), config.idListFile);
}

function saveSummary() {
  const summary = {
    totalScanned: ids.length,
    totalErroredIds: getErorredIds().length,
    lastWritten: (new Date()).toLocaleString(),
    failedIds,
  };
  fsHelper.saveJsonSync(summary, 'summary');
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
  getFailedIds,
  getIds,
  getRecord,
  getRecords,
  saveRecords,
  saveState,
  saveSummary,
  setIdKey,
};
