const async = require('async');

const limiter = require('../utils/limiter');

const area = 'populateRecord';

class PopulateRecordsQueue {
  constructor(config) {
    this.count = 0;
    this.retryCount = 0;
    this.totalRetries = 0;
    this.saveEvery = config.saveEvery || 100;
    this.etlStore = config.etlStore;
    this.log = config.log;
    this.populateRecordFromIdAction = config.populateRecordAction;
    this.setHitsPerWorker(config);
  }

  handleError(err, id) {
    this.etlStore.addFailedId(id, area, err.message);
    this.log.error(`Error processing ID ${id}: ${err}`);
  }

  recordExists(id) {
    return this.etlStore.getRecord(id);
  }

  savePeriodically() {
    if (this.count % this.saveEvery === 0) {
      this.etlStore.saveState();
    }
  }

  setHitsPerWorker(config) {
    this.hitsPerWorker = (config.hitsPerHour || 20000) /
      ((config.workers || 1) * (config.numberOfSteps || 1));
  }

  processRetryQueueItem(task, callback) {
    this.retryCount += 1;
    const queue = this;
    this.log.info(`Retrying ID ${task.id} ${this.retryCount}/${this.totalRetries}`);
    limiter(this.hitsPerWorker, () => queue.populateData(task.id), callback);
  }

  writeDoneLog(id, writeLog) {
    if (writeLog) {
      this.log.info(`${id} done`);
    }
  }
  addToQueue(ids, q) {
    // remove undefineds
    ids.filter(id => id).forEach((id) => {
      q.push({ id }, writeLog => this.writeDoneLog(id, writeLog));
    });
  }

  queueErroredIds(q) {
    const failedIds = this.etlStore.getErroredIds();
    this.totalRetries = failedIds.length;
    this.etlStore.clearFailedIds(failedIds);
    this.addToQueue(failedIds, q);
  }

  startRetryQueue(options) {
    this.retryCount = 0;
    const q = async.queue(this.processRetryQueueItem.bind(this), options.workers);
    this.queueErroredIds(q);
    q.drain = () => {
      this.etlStore.saveState();
      options.queueComplete();
    };
  }

  populateData(id) {
    const queue = this;
    return this.populateRecordFromIdAction(id)
      .then(record => queue.etlStore.addRecord(record))
      .catch(err => queue.handleError(err, id));
  }

  processQueueItem(task, callback) {
    this.count += 1;
    const queue = this;
    if (this.recordExists(task.id)) {
      callback(false);
    } else {
      this.savePeriodically();
      this.log.info(`Populating ID ${task.id} ${this.count}/${this.etlStore.getIds().length}`);
      limiter(this.hitsPerWorker, () => queue.populateData(task.id), () => callback(true));
    }
  }
  queueIds(q) {
    this.addToQueue(this.etlStore.getIds(), q);
  }

  start(options) {
    this.count = 0;
    if (this.etlStore.getIds().length > 0) {
      const q = async.queue(this.processQueueItem.bind(this), options.workers);
      this.queueIds(q);
      q.drain = () => {
        this.etlStore.saveState();
        options.queueComplete();
      };
    } else {
      options.queueComplete();
    }
  }
}

module.exports = PopulateRecordsQueue;
