import util from 'util';
import oracledb, {
  Pool,
  Connection,
  Result,
  PoolAttributes,
} from 'oracledb';
import { Logger, OracleDBCredentials, OracleDBOptions } from './types';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

/**
 * Interface to the Oracle database
 */

export default class OracleWrapper {
  /**
   * A cache alias that will be used to identify this connection
   * defaults to using the sid from the credentials
   */
  private readonly alias: string;

  /**
   * A logging instance.
   * Defaults to using the console.
   */
  private logger: Logger;

  /**
   * A set of connections used to communicate with the db server
   */
  private connectionPool: Pool;

  /**
   * The credentials needed to connect to this database
   */
  private poolCredentials: PoolAttributes;

  /**
  * Create a new oracle interface
  */
  public constructor(
    credentials: OracleDBCredentials,
    options: OracleDBOptions = {}
  ) {
    const {
      host, port, sid, user, password,
    } = credentials;
    this.alias = options.alias || sid;
    this.logger = options.logger || console;
    this.poolCredentials = {
      user,
      password,
      poolAlias: this.alias,
      connectionString: `${host}:${port}/${sid}`,
      poolMin: 0,
      poolMax: 2,
      poolIncrement: 1,
    };
  }

  /**
   * Retrieves a connection from the cache pool
   */
  public async getConnection(): Promise<Connection> {
    if (!this.connectionPool) {
      try {
        this.connectionPool = await oracledb.createPool(this.poolCredentials);
      } catch (err) {
        this.logger.error('Failed to create connectionPool');
        throw err;
      }
    }
    try {
      const connection = await oracledb.getConnection(this.alias);
      return connection;
    } catch (err) {
      this.logger.error('Failed to get connection');
      throw err;
    }
  }

  /**
   * Attempts to close the connection pool, waiting up to 60 seconds for any
   * active connections to close before forcing it closed.
   */
  public async releasePool(): Promise<void> {
    if (this.connectionPool) {
      try {
        await this.connectionPool.close(60);
        this.connectionPool = null;
        this.logger.info('Connection pool released');
      } catch (err) {
        this.logger.error('Could not release pool');
        throw err;
      }
    }
  }

  /**
   * Runs queries against the oracle database
   * Will process the results in chunks, returning a single results object with
   * all of the rows returned from the database and a metadata object
   */
  public async query<T = Record<string, unknown>>(
    query: string,
    variables: Record<string, unknown> = {}
  ): Promise<T[]> {
    const ROW_COUNT = 1000;
    const options = {
      resultSet: true,
      prefetchRows: ROW_COUNT,
    };
    const conn = await this.getConnection();
    // Execute Query
    let result: Result<T>;
    this.logger.debug(`Executing Query: ${query}`);
    this.logger.debug(`Parameters: ${util.inspect(variables)}`);
    try {
      result = await conn.execute(query, variables, options);
    } catch (err) {
      this.logger.error('Query failed');
      await conn.release();
      throw err;
    }
    // Iterate over response rows, 1000 at a time, creating a complete response
    // https://jsao.io/2015/07/an-overview-of-result-sets-in-the-nodejs-driver/
    try {
      const fetchAndConcat = async (prevRows: T[]): Promise<T[]> => {
        const rows = await result.resultSet.getRows(ROW_COUNT);
        if (rows.length) {
          return fetchAndConcat([...prevRows, ...rows]);
        }
        return prevRows;
      };
      const response = await fetchAndConcat([]);
      await result.resultSet.close();
      await conn.release();
      return response;
    } catch (err) {
      this.logger.error('Error fetching data from query');
      await result.resultSet.close();
      await conn.release();
      throw err;
    }
  }
}
