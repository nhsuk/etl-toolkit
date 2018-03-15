const populateIds = require('./lib/queues/populateIds');
const populateRecordsFromIds = require('./lib/queues/populateRecordsFromIds');
const etlStore = require('./lib/etlStore');

module.exports = {
  etlStore,
  queues: {
    populateIds,
    populateRecordsFromIds,
  },
};
