const populateIds = require('./lib/queues/populateIds');
const populateRecordsFromIds = require('./lib/queues/populateRecordsFromIds');
const EtlStore = require('./lib/etlStore');

module.exports = {
  EtlStore,
  queues: {
    populateIds,
    populateRecordsFromIds,
  },
};
