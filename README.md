# ETL toolkit
> General components for managing the retrieval and processing of data 
 

# Components

## Queues

`populateIds` may be used to add IDs to the etlStore from a paged list.

`populateRecordsFromIds` may be used to populate records from the IDs in the etlStore.

## ETL Store

The `etlStore` manages the state of the ETL, holding a record of the IDs, loaded, and errored records.
The store can persist state to the local file syste, during queue processing enabling an ETL to continue after interruption.

## Environment variables

Environment variables are expected to be managed by the environment in which
the application is being run. This is best practice as described by
[twelve-factor](https://12factor.net/config).

In order to protect the application from starting up without the required
env vars in place
[require-environment-variables](https://www.npmjs.com/package/require-environment-variables)
is used to check for the env vars that are required for the application to run
successfully.
This happens during the application start-up. If an env var is not found the
application will fail to start and an appropriate message will be displayed.

Environment variables are used to set application level settings for each
environment.


| Variable                           | Description                                                | Default                | Required |
| :--------------------------------- | :--------------------------------------------------------- | ---------------------- | :------- |
| `LOG_LEVEL`                        | [log level](https://github.com/trentm/node-bunyan#levels)  | Depends on `NODE_ENV`  |          |
| `NODE_ENV`                         | node environment                                           | development            |          |
| `OUTPUT_FILE`                      | Filename saved to azure                                    | etl-data               |          |
| `HITS_PER_HOUR`                    | Maximum number of times to call a queue operation per hour | 20000                  |          |
| `ETL_NAME`                         | Name used in Bunyan logger                                 | etl-toolkit            |          |
