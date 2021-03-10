/**
 * The user name for the connection
 */
export const user = 'SYSADMIN';
/**
 * The password for the connection
 */
export const password = 'oracledbtest';
/**
 * The host to connect to
 */
export const host = '127.0.0.1';
/**
 * The port on which the database is running
 */
export const port = '1521';
/**
 * The SID for the connection
 */
export const sid = 'ORCTEST';

/**
 * Fake Credentials for an OracleDB database
 */

export const dbCredentials = {
  host,
  port,
  sid,
  user,
  password,
};

/**
 * A fake query without an parameters
 */

export const queryWithoutParameters = 'SELECT * FROM users;';

/**
 * A fake query with parameters
 */

export const queryWithParameters = "SELECT * FROM users WHERE name=':name';";

/**
 * fake parameters to use with the fake query
 */

export const queryParameters = { name: 'three' };

/**
 * The fake results from our fake query
 */
export const queryResults = [
  { name: 'one' },
  { name: 'two' },
  { name: 'three' },
  { name: 'four' },
  { name: 'fix' },
  { name: 'six' },
];
