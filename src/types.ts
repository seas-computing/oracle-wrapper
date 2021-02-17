export type Loggable = Record<string, unknown>
| Record<string, unknown>[]
| (string | number)
| (string | number)[]
| Error
| unknown[];

export interface Logger extends Console{
  log: (...args: Loggable[]) => void;
  error: (...args: Loggable[]) => void;
  warn: (...args: Loggable[]) => void;
  info: (...args: Loggable[]) => void;
  http?: (...args: Loggable[]) => void;
  verbose?: (...args: Loggable[]) => void;
  debug: (...args: Loggable[]) => void;
  silly?: (...args: Loggable[]) => void;
}

export interface OracleDBCredentials {
  /** Hostname of DB Server */
  host: string;
  /** Port number used by db server */
  port: string;
  /** Oracle Database Site Identifier */
  sid: string;
  /** Database username */
  user: string;
  /** Database user password */
  password: string;
}

export interface OracleDBOptions {
  /**
   * An alias to use for this instances connection in the pool
   * if none is provided, will use the sid
   */
  alias?: string
  /**
   * An instance of a logger. Uses the console by default.
  */
  logger?: Logger;

}
