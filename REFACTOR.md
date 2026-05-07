aim of this plan is to simplify the arch.

on the backend, one auth and one REST api service. GraphQL should be scrapped completely, all queries and mutations replaced by REST endpoints.

auth and core should be merged. auth should provide a very simple auth interface. only user + password combination support, nothing else.

only external dependency will be postgres.

gqlwrapper should be renamed to api.
master shouldn't be necessary anymore.