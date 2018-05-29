# ETL toolkit
> General components for managing the retrieval and processing of data

[![GitHub Release](https://img.shields.io/github/release/nhsuk/etl-toolkit.svg)](https://github.com/nhsuk/etl-toolkit/releases/latest/)
[![Greenkeeper badge](https://badges.greenkeeper.io/nhsuk/etl-toolkit.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/nhsuk/etl-toolkit.svg?branch=master)](https://travis-ci.org/nhsuk/etl-toolkit)
[![Coverage Status](https://coveralls.io/repos/github/nhsuk/etl-toolkit/badge.svg?branch=master)](https://coveralls.io/github/nhsuk/etl-toolkit?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/nhsuk/etl-toolkit/badge.svg)](https://snyk.io/test/github/nhsuk/etl-toolkit)

# Components

## Queues

`populateIds` may be used to add IDs to the etlStore from a paged source.

`populateRecordsFromIds` may be used to populate records from the IDs in the etlStore.

## ETL Store

The `EtlStore` manages the state of the ETL including IDs, loaded records, and a list of errored IDs.
The store can persist state to the local file system during queue processing enabling an ETL to continue after interruption.

The `EtlStore` is a class and can be constructed as below:
```
const etlStore = new EtlStore({ idKey, log, outputFile);
```
Where `idKey` is the property on the object by which it is uniquely identified, i.e. `id`;
`log` is a logging framework that has `info` and `error` functions.
`outputFile` is the name of the file the EltStore will write to, i.e. `pharmacy-data`;

Optional config settings are:

`outputDir`: local output folder. Defaults to `output`

`cacheIdFilename`: local ID cache file. Defaults to `cache-ids.json`

`cacheDataFilename`: local data cache file. Defaults to `cache-data.json`

`summaryFilename`: summary file name. Defaults to `summary.json`

When the `saveRecords` function is called,  items in the store will be saved to `{outputFile}.json`, and IDs will be saved to
`{outputFile}-seed-ids.json`.

## Environment variables

Environment variables are expected to be managed by the environment in which
the application is being run. This is best practice as described by
[twelve-factor](https://12factor.net/config).

Environment variables are used to set application level settings for each
environment.


| Variable                           | Description                                                | Default                | Required |
| :--------------------------------- | :--------------------------------------------------------- | ---------------------- | :------- |
| `LOG_LEVEL`                        | [log level](https://github.com/trentm/node-bunyan#levels)  | Depends on `NODE_ENV`  |          |
| `NODE_ENV`                         | node environment                                           | development            |          |
| `OUTPUT_FILE`                      | Filename saved to azure                                    | etl-data               |          |
| `HITS_PER_HOUR`                    | Maximum number of times to call a queue operation per hour | 20000                  |          |
| `ETL_NAME`                         | Name used in Bunyan logger                                 | etl-toolkit            |          |
