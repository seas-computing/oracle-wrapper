This is a light wrapper around the official [`oracledb`
driver](https://github.com/oracle/node-oracledb) used to read data from external Oracle databases
for a number of ETL services at SEAS

## Installation

The package can be installed from `npm`. You'll also need to install the official driver:

```sh
npm install @seas-computing/oracle-wrapper oracledb
```

There are some additional steps required to set up client libraries needed by the oracledb driver,
which can be found in [the official documentation](https://oracle.github.io/node-oracledb/INSTALL.html#quickstart)

Typescript definitions for this library are included; definitions for the official driver require
the `@types/oracledb` package.
