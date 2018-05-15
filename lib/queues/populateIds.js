const async = require('async');

class PopulateIdsQueue {
  constructor(config) {
    this.processedPagesFilename = config.processedPagesFilename || 'processed-pages.json';
    this.etlStore = config.etlStore;
    this.log = config.log;
    this.getIdsAction = config.getIdsAction;
    this.processedPages = {};
  }

  handleError(err, pageNo) {
    this.log.error(`Error processing page ${pageNo}: ${err}`);
  }

  pageDone(pageNo) {
    this.processedPages[pageNo] = true;
  }

  loadPage(pageNo) {
    const queue = this;
    return this.getIdsAction(pageNo)
      .then(ids => queue.etlStore.addIds(ids))
      .then(() => queue.pageDone(pageNo))
      .catch(err => queue.handleError(err, pageNo));
  }

  pageParsed(pageNo) {
    return this.processedPages[pageNo] === true;
  }

  processQueueItem(task, callback) {
    if (this.pageParsed(task.pageNo)) {
      this.log.info(`Skipping ${task.pageNo}, already parsed`);
      callback();
    } else {
      this.log.info(`Loading page ${task.pageNo}`);
      this.loadPage(task.pageNo).then(callback);
    }
  }

  addPageToQueue(q, pageNo) {
    q.push({ pageNo }, () => this.log.info(`${pageNo} done`));
  }

  start(options) {
    if (options.totalPages > 0) {
      const q = async.queue(this.processQueueItem.bind(this), options.workers);

      q.drain = function drain() {
        options.queueComplete();
      };

      for (let i = 1; i <= options.totalPages; i++) {
        this.addPageToQueue(q, i);
      }
    } else {
      options.queueComplete();
    }
  }
}

module.exports = PopulateIdsQueue;
