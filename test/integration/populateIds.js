const chai = require('chai');

const EtlStore = require('../../lib/etlStore');
const PopulateIdsQueue = require('../../lib/queues/populateIds');

const outputFile = 'test-data';
const idKey = 'id';
let infos = [];
let errors = [];
const log = {
  error: (error) => { errors.push(error); },
  info: (status) => { infos.push(status); },
};

const etlStore = new EtlStore({ idKey, log, outputFile });

const expect = chai.expect;

function getIdsAction(pageNo) {
  return new Promise((resolve) => {
    resolve([pageNo + 10, pageNo + 20]);
  });
}

function getIdsWithErrorAction(pageNo) {
  return new Promise((resolve) => {
    if (pageNo === 2) {
      throw new Error('bad page');
    } else {
      resolve([pageNo + 10, pageNo + 20]);
    }
  });
}

function assertEtlStore() {
  const ids = etlStore.getIds();
  expect(ids.length).to.equal(4);
  expect(ids[0]).to.equal(11);
  expect(ids[1]).to.equal(21);
  expect(ids[2]).to.equal(12);
  expect(ids[3]).to.equal(22);
}

describe('Populate ID queue', () => {
  beforeEach(() => {
    infos = [];
    errors = [];
    etlStore.clearState();
  });

  it('should populate etlStore with loaded ids', (done) => {
    const populateIds = new PopulateIdsQueue({ etlStore, getIdsAction, log });
    const options = {
      queueComplete: () => {
        assertEtlStore();
        done();
      },
      totalPages: 2,
      workers: 1,
    };
    populateIds.start(options);
  });

  it('should call queueComplete for zero pages', (done) => {
    const populateIds = new PopulateIdsQueue({ etlStore, getIdsAction: () => { done('should not have been called'); }, log });
    const options = {
      queueComplete: () => {
        done();
      },
      totalPages: 0,
      workers: 1,
    };
    populateIds.start(options);
  });

  it('should ignore pages already scanned', (done) => {
    const queueComplete = () => {
      assertEtlStore();
      done();
    };

    const populateIds = new PopulateIdsQueue({ etlStore, getIdsAction, log });
    const options = {
      queueComplete,
      totalPages: 2,
      workers: 1,
    };

    const restartQueue = () => {
      populateIds.getIdsAction = () => { done('should not have been called'); };
      populateIds.start(options);
    };

    const restartOptions = {
      queueComplete: restartQueue,
      totalPages: 2,
      workers: 1,
    };

    populateIds.start(restartOptions);
  });

  it('should gracefully handle errors', (done) => {
    const populateIds = new PopulateIdsQueue({
      etlStore,
      getIdsAction: getIdsWithErrorAction,
      log
    });
    const options = {
      queueComplete: () => {
        const ids = etlStore.getIds();
        expect(ids.length).to.equal(4);
        done();
      },
      totalPages: 3,
      workers: 1,
    };
    populateIds.start(options);
  });
});
