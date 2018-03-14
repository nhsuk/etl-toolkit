const chai = require('chai');

const populateRecordsFromIds = require('../../lib/queues/populateRecordsFromIds');
const etlStore = require('../../lib/etlStore');

const expect = chai.expect;

const id1 = 'FP1';
const id2 = 'FP2';
const id3 = 'FP3';

function getRecordAction(id) {
  return new Promise((resolve) => {
    resolve({ id });
  });
}

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
    etlStore.setIdKey('id');
  });

  it('should populate etlStore with records from provided IDs', (done) => {
    etlStore.addIds([id1, id2, id3]);
    const options = {
      workers: 1,
      populateRecordAction: getRecordAction,
      queueComplete: () => {
        expect(etlStore.getRecord(id1).id).to.equal(id1);
        expect(etlStore.getRecord(id2).id).to.equal(id2);
        expect(etlStore.getRecord(id3).id).to.equal(id3);
        expect(etlStore.getErorredIds().length).to.equal(0);
        expect(etlStore.getRecords().length).to.equal(3);
        done();
      },
    };
    populateRecordsFromIds.start(options);
  });

  it('should call queueComplete even when provided ID list empty', (done) => {
    etlStore.addIds([]);
    const options = {
      workers: 1,
      populateRecordAction: getRecordAction,
      queueComplete: () => {
        done();
      },
    };
    populateRecordsFromIds.start(options);
  });

  it('should not update existing records', (done) => {
    etlStore.addIds([id1, id2, id3]);
    const existingRecord = { id: id2 };
    etlStore.addRecord(existingRecord);
    const options = {
      workers: 1,
      populateRecordAction: getRecordAction,
      queueComplete: () => {
        expect(etlStore.getRecord(id1).id).to.equal(id1);
        expect(etlStore.getRecord(id2)).to.equal(existingRecord);
        expect(etlStore.getRecord(id3).id).to.equal(id3);
        expect(etlStore.getErorredIds().length).to.equal(0);
        expect(etlStore.getRecords().length).to.equal(3);
        done();
      },
    };
    populateRecordsFromIds.start(options);
  });

  it('should add failed IDs to list', (done) => {
    const errorId = id2;
    etlStore.addIds([id1, errorId, id3]);
    const options = {
      workers: 1,
      saveEvery: 2,
      populateRecordAction: id => getRecordWithErrorAction(id, errorId),
      queueComplete: () => {
        expect(etlStore.getRecord(id1).id).to.equal(id1);
        expect(etlStore.getRecord(id3).id).to.equal(id3);
        expect(etlStore.getRecords().length).to.equal(2);
        expect(etlStore.getErorredIds().length).to.equal(1);
        done();
      },
    };
    populateRecordsFromIds.start(options);
  });

  it('starting retry queue should retry failed IDs and remove from errored list if successful', (done) => {
    etlStore.addIds([id1, id2, id3]);

    const retryOptions = {
      workers: 1,
      populateRecordAction: getRecordAction,
      queueComplete: () => {
        expect(etlStore.getRecord(id1).id).to.equal(id1);
        expect(etlStore.getRecord(id3).id).to.equal(id3);
        expect(etlStore.getRecords().length).to.equal(3);
        expect(etlStore.getErorredIds().length).to.equal(0);
        done();
      },
    };

    const options = {
      workers: 1,
      populateRecordAction: id => getRecordWithErrorAction(id, id2),
      queueComplete: () => {
        expect(etlStore.getRecords().length).to.equal(2);
        expect(etlStore.getErorredIds().length).to.equal(1);
        populateRecordsFromIds.startRetryQueue(retryOptions);
      },
    };
    populateRecordsFromIds.start(options);
  });
});
