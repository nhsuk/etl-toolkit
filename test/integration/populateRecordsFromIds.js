const chai = require('chai');

const EtlStore = require('../../lib/etlStore');
const PopulateRecordsQueue = require('../../lib/queues/populateRecordsFromIds');

const outputFilename = 'test-data.json';
const seedIdFilename = 'test-data-seed-ids.json';
const idKey = 'id';
const infos = [];
const errors = [];

const log = {
  error: (error) => { errors.push(error); },
  info: (status) => { infos.push(status); },
};

function populateRecordAction(id) {
  return new Promise((resolve) => {
    resolve({ id });
  });
}
const etlStore = new EtlStore({ idKey, outputFilename, seedIdFilename });

const expect = chai.expect;

const id1 = 'FP1';
const id2 = 'FP2';
const id3 = 'FP3';

function getRecordWithErrorAction(id, errorId) {
  return new Promise((resolve) => {
    if (id === errorId) {
      throw new Error('error in JSON');
    } else {
      resolve({ id });
    }
  });
}

describe('Populate Records From ID queue', () => {
  beforeEach(() => {
    etlStore.clearState();
  });

  it('should populate etlStore with records from provided IDs', (done) => {
    etlStore.addIds([id1, id2, id3]);
    const options = {
      queueComplete: () => {
        expect(etlStore.getRecord(id1).id).to.equal(id1);
        expect(etlStore.getRecord(id2).id).to.equal(id2);
        expect(etlStore.getRecord(id3).id).to.equal(id3);
        expect(etlStore.getErroredIds().length).to.equal(0);
        expect(etlStore.getRecords().length).to.equal(3);
        done();
      },
      workers: 1,
    };
    const populateRecordsFromIds = new PopulateRecordsQueue({
      etlStore,
      log,
      populateRecordAction,
    });

    populateRecordsFromIds.start(options);
  });

  it('should call queueComplete even when provided ID list empty', (done) => {
    etlStore.addIds([]);
    const options = {
      queueComplete: () => {
        done();
      },
      workers: 1,
    };
    const populateRecordsFromIds = new PopulateRecordsQueue({
      etlStore,
      log,
      populateRecordAction,
    });

    populateRecordsFromIds.start(options);
  });

  it('should not update existing records', (done) => {
    etlStore.addIds([id1, id2, id3]);
    const existingRecord = { id: id2 };
    etlStore.addRecord(existingRecord);
    const options = {
      queueComplete: () => {
        expect(etlStore.getRecord(id1).id).to.equal(id1);
        expect(etlStore.getRecord(id2)).to.equal(existingRecord);
        expect(etlStore.getRecord(id3).id).to.equal(id3);
        expect(etlStore.getErroredIds().length).to.equal(0);
        expect(etlStore.getRecords().length).to.equal(3);
        done();
      },
      workers: 1,
    };
    const populateRecordsFromIds = new PopulateRecordsQueue({
      etlStore,
      log,
      populateRecordAction,
    });

    populateRecordsFromIds.start(options);
  });

  it('should add failed IDs to list', (done) => {
    const errorId = id2;
    etlStore.addIds([id1, errorId, id3]);
    const options = {
      queueComplete: () => {
        expect(etlStore.getRecord(id1).id).to.equal(id1);
        expect(etlStore.getRecord(id3).id).to.equal(id3);
        expect(etlStore.getRecords().length).to.equal(2);
        expect(etlStore.getErroredIds().length).to.equal(1);
        done();
      },
      saveEvery: 2,
      workers: 1,
    };

    const populateRecordsFromIds = new PopulateRecordsQueue({
      etlStore,
      log,
      populateRecordAction: id => getRecordWithErrorAction(id, errorId),
    });
    populateRecordsFromIds.start(options);
  });

  it('starting retry queue should retry failed IDs and remove from errored list if successful', (done) => {
    etlStore.addIds([id1, id2, id3]);

    const populateRecordsFromIds = new PopulateRecordsQueue({
      etlStore,
      log,
      populateRecordAction: id => getRecordWithErrorAction(id, id2),
    });

    const retryOptions = {
      queueComplete: () => {
        expect(etlStore.getRecord(id1).id).to.equal(id1);
        expect(etlStore.getRecord(id3).id).to.equal(id3);
        expect(etlStore.getRecords().length).to.equal(3);
        expect(etlStore.getErroredIds().length).to.equal(0);
        done();
      },
      workers: 1,
    };

    const options = {
      queueComplete: () => {
        expect(etlStore.getRecords().length).to.equal(2);
        expect(etlStore.getErroredIds().length).to.equal(1);
        populateRecordsFromIds.populateRecordFromIdAction = populateRecordAction;
        populateRecordsFromIds.startRetryQueue(retryOptions);
      },
      workers: 1,
    };

    populateRecordsFromIds.start(options);
  });
});

