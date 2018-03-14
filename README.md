# ETL toolkit
> General components for managing the retrieval and processing of data 
 

# Components

## Queues

`populateIds` may be used to add IDs to the etlStore from a paged list.

`populateRecordsFromIds` may be used to populate records from the IDs in the etlStore.

## ETL Store

The `etlStore` manages the state of the ETL, holding a record of the IDs, loaded, and errored records.
The store can persist state to the local file syste, during queue processing enabling an ETL to continue after interruption.
