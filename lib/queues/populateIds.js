const async = require('async');

const processedPagesFilename = require('../config').processedPagesFilename;
const etlStore = require('../etlStore');
const log = require('../utils/logger');
const fsHelper = require('../utils/fsHelper');

let getIdsAction;
let processedPages = {};

function pageDone(pageNo) {
  processedPages[pageNo] = true;
}

function saveState() {
  etlStore.saveState();
  fsHelper.saveJsonSync(processedPages, processedPagesFilename);
}

function clearState() {
  processedPages = {};
  fsHelper.saveJsonSync(processedPages, processedPagesFilename);
}

function loadState() {
  processedPages = fsHelper.loadJsonSync(processedPagesFilename) || {};
}

function handleError(err, pageNo) {
  log.error(`Error processing page ${pageNo}: ${err}`);
}

function loadPage(pageNo) {
  return getIdsAction(pageNo)
    .then(etlStore.addIds)
    .then(() => pageDone(pageNo))
    .catch(err => handleError(err, pageNo));
}

function pageParsed(pageNo) {
  return processedPages[pageNo] === true;
}

function processQueueItem(task, callback) {
  if (pageParsed(task.pageNo)) {
    log.info(`Skipping ${task.pageNo}, already parsed`);
    callback();
  } else {
    log.info(`Loading page ${task.pageNo}`);
    loadPage(task.pageNo).then(callback);
  }
}

function addPageToQueue(q, pageNo) {
  q.push({ pageNo }, () => log.info(`${pageNo} done`));
}

function start(options) {
  if (options.totalPages > 0) {
    getIdsAction = options.getIdsAction;
    const q = async.queue(processQueueItem, options.workers);

    q.drain = () => {
      saveState();
      options.queueComplete();
    };

    for (let i = 1; i <= options.totalPages; i++) {
      addPageToQueue(q, i);
    }
  } else {
    options.queueComplete();
  }
}

loadState();

module.exports = {
  clearState,
  start,
};
