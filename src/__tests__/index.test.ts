import util from 'util';
import assert from 'assert';
import { stub, SinonStub } from 'sinon';
import oracledb, { Connection, PoolAttributes } from 'oracledb';
import OracleWrapper from '../index';
import { Logger, OracleDBOptions } from '../types';

describe('OracleWrapper', function () {
  let wrapper: OracleWrapper;
  let getConnectionStub: SinonStub;
  let createPoolStub: SinonStub;
  let connectionPool: Record<string, SinonStub>;
  let dbConnection: Record<string, SinonStub>;
  let queryResult: Record<string, Record<string, SinonStub>>;
  const credentials = {
    host: '127.0.0.1',
    port: '1521',
    sid: 'ORCTEST',
    user: 'SYSADMIN',
    password: 'oracledbtest',
  };
  let options: OracleDBOptions;
  let testLogger: Record<string, SinonStub>;

  beforeEach(function () {
    testLogger = {
      log: stub(),
      error: stub(),
      warn: stub(),
      info: stub(),
      debug: stub(),
      verbose: stub(),
    };
    connectionPool = {
      close: stub(),
    };
    dbConnection = {
      execute: stub(),
      release: stub(),
    };
    queryResult = {
      resultSet: {
        getRows: stub(),
        close: stub(),
      },
    };
    options = {
      alias: 'TestDB1',
      logger: testLogger as unknown as Logger,
    };
    wrapper = new OracleWrapper(credentials, options);
    getConnectionStub = stub(oracledb, 'getConnection');
    createPoolStub = stub(oracledb, 'createPool');
  });
  describe('Constructor', function () {
    describe('Alias', function () {
      const testAlias = 'TestDB2';
      let aliasedWrapper: OracleWrapper;
      context('With a value in options', function () {
        beforeEach(function () {
          aliasedWrapper = new OracleWrapper(credentials, { alias: testAlias });
        });
        it('Should use the alias as the property', function () {
          // eslint-disable-next-line @typescript-eslint/dot-notation
          assert.strictEqual(aliasedWrapper['alias'], testAlias);
        });
      });
      context('Without a value in options', function () {
        beforeEach(function () {
          aliasedWrapper = new OracleWrapper(credentials);
        });
        it('Should use the sid as the alias property', function () {
          // eslint-disable-next-line @typescript-eslint/dot-notation
          assert.strictEqual(aliasedWrapper['alias'], credentials.sid);
        });
      });
    });
  });
  describe('getConnection', function () {
    context('When a connection pool hasn\'t been instantiated', function () {
      context('When createPool fails', function () {
        let testError: Error;
        beforeEach(function () {
          testError = new Error('createPool failed');
          createPoolStub.rejects(testError);
        });
        it('Should attempt to create a new connection pool', async function () {
          try {
            await wrapper.getConnection();
            assert.fail();
          } catch (error) {
            assert.strictEqual(createPoolStub.callCount, 1);
          }
        });
        it('Should use the alias from options', async function () {
          try {
            await wrapper.getConnection();
            assert.fail();
          } catch (error) {
            const { poolAlias } = createPoolStub.args[0][0] as PoolAttributes;
            assert.strictEqual(poolAlias, options.alias);
          }
        });
        it('Should use the credentials', async function () {
          try {
            await wrapper.getConnection();
            assert.fail();
          } catch (error) {
            const {
              user,
              password,
              connectionString,
            } = createPoolStub.args[0][0] as PoolAttributes;
            assert.strictEqual(user, credentials.user);
            assert.strictEqual(password, credentials.password);
            assert.strictEqual(
              connectionString,
              `${credentials.host}:${credentials.port}/${credentials.sid}`
            );
          }
        });
        it('Should log an error notice', async function () {
          try {
            await wrapper.getConnection();
            assert.fail();
          } catch (error) {
            assert.strictEqual(testLogger.error.callCount, 2);
            assert.strictEqual(
              testLogger.error.args[0][0],
              'Failed to create connectionPool'
            );
            assert.strictEqual(testLogger.error.args[1][0], testError);
          }
        });
        it('Should throw the error', async function () {
          try {
            await wrapper.getConnection();
            assert.fail();
          } catch (error) {
            assert.deepStrictEqual(error, testError);
          }
        });
      });
      context('When createPool succeeds', function () {
        context('When getConnection fails', function () {
          let testError: Error;
          beforeEach(function () {
            testError = new Error('getConnection failed');
            createPoolStub.resolves(connectionPool);
            getConnectionStub.rejects(testError);
          });
          it('Should call getConnection', async function () {
            try {
              await wrapper.getConnection();
              assert.fail();
            } catch (error) {
              assert.strictEqual(getConnectionStub.callCount, 1);
            }
          });
          it('Should use the alias from the options', async function () {
            try {
              await wrapper.getConnection();
              assert.fail();
            } catch (error) {
              assert.strictEqual(getConnectionStub.args[0][0], options.alias);
            }
          });
          it('Should log a message about the error', async function () {
            try {
              await wrapper.getConnection();
              assert.fail();
            } catch (error) {
              assert.strictEqual(testLogger.error.callCount, 2);
              assert.strictEqual(testLogger.error.args[0][0], 'Failed to get connection');
              assert.strictEqual(testLogger.error.args[1][0], testError);
            }
          });
          it('Should throw the error', async function () {
            try {
              await wrapper.getConnection();
              assert.fail();
            } catch (error) {
              assert.deepStrictEqual(error, testError);
            }
          });
        });
        context('When getConnection succeeds', function () {
          let result: Connection;
          beforeEach(async function () {
            createPoolStub.resolves(connectionPool);
            getConnectionStub.resolves(dbConnection);
            result = await wrapper.getConnection();
          });
          it('Should attempt to create a new connection pool', function () {
            assert.strictEqual(createPoolStub.callCount, 1);
          });
          it('Should use the alias from options', function () {
            const { poolAlias } = createPoolStub.args[0][0] as PoolAttributes;
            assert.strictEqual(poolAlias, options.alias);
          });
          it('Should use the credentials', function () {
            const {
              user,
              password,
              connectionString,
            } = createPoolStub.args[0][0] as PoolAttributes;
            assert.strictEqual(user, credentials.user);
            assert.strictEqual(password, credentials.password);
            assert.strictEqual(
              connectionString,
              `${credentials.host}:${credentials.port}/${credentials.sid}`
            );
          });
          it('Should call getConnection', function () {
            assert.strictEqual(getConnectionStub.callCount, 1);
          });
          it('Should use the alias from the options', function () {
            assert.strictEqual(getConnectionStub.args[0][0], options.alias);
          });
          it('Should reuturn the result', function () {
            assert.deepStrictEqual(result, dbConnection);
          });
        });
      });
    });
    context('When a connection pool already exists', function () {
      beforeEach(async function () {
        createPoolStub.resolves(connectionPool);
        getConnectionStub.resolves(dbConnection);
        await wrapper.getConnection();
        createPoolStub.reset();
        getConnectionStub.reset();
      });
      it('Should not call createPool again', async function () {
        await wrapper.getConnection();
        assert.strictEqual(createPoolStub.callCount, 0);
      });
      it('Should call getConnection', async function () {
        await wrapper.getConnection();
        assert.strictEqual(getConnectionStub.callCount, 1);
      });
    });
  });
  describe('releasePool', function () {
    let testError: Error;
    beforeEach(function () {
      testError = new Error('Failed to release Pool');
      createPoolStub.resolves(connectionPool);
    });
    context('When there is no connectionPool', function () {
      beforeEach(async function () {
        return wrapper.releasePool();
      });
      it('Should not call connectionPool.close', function () {
        assert.strictEqual(connectionPool.close.callCount, 0);
      });
      it('Should not log anything', function () {
        Object.values(testLogger).forEach((logStub) => {
          assert.strictEqual(logStub.callCount, 0);
        });
      });
    });
    context('When there is an existing connectionPool', function () {
      beforeEach(async function () {
        return wrapper.getConnection();
      });
      context('When the pool fails to release', function () {
        beforeEach(function () {
          connectionPool.close.rejects(testError);
        });
        it('Should call connectionPool.close', async function () {
          try {
            await wrapper.releasePool();
            assert.fail();
          } catch (error) {
            assert.strictEqual(connectionPool.close.callCount, 1);
          }
        });
        it('Should log an error message', async function () {
          try {
            await wrapper.releasePool();
            assert.fail();
          } catch (error) {
            assert.strictEqual(testLogger.error.callCount, 2);
            assert.strictEqual(
              testLogger.error.args[0][0],
              'Could not release pool'
            );
            assert.strictEqual(testLogger.error.args[1][0], testError);
          }
        });
        it('Should rethrow the error', async function () {
          try {
            await wrapper.releasePool();
            assert.fail();
          } catch (error) {
            assert.strictEqual(error, testError);
          }
        });
      });
      context('When the pool successfully releases', function () {
        beforeEach(async function () {
          connectionPool.close.resolves();
          return wrapper.releasePool();
        });
        it('Should call connectionPool.close', function () {
          assert.strictEqual(connectionPool.close.callCount, 1);
        });
        it('Should log a message about the connection pool releasing', function () {
          assert.strictEqual(testLogger.info.callCount, 1);
          assert.strictEqual(
            testLogger.info.args[0][0],
            'Connection pool released'
          );
        });
      });
    });
  });
  describe('query', function () {
    let testError: Error;
    let testQuery: string;
    let testQueryWithoutVariables: string;
    let testVariables: Record<string, string>;
    beforeEach(function () {
      testError = new Error('query failed');
      testQueryWithoutVariables = 'SELECT * FROM USERS;';
      testQuery = "SELECT * FROM USERS WHERE NAME=':name';";
      testVariables = { name: 'foo' };
      dbConnection.release.resolves();
      stub(OracleWrapper.prototype, 'getConnection')
        .resolves(dbConnection as unknown as Connection);
    });
    context('When initial query fails', function () {
      beforeEach(function () {
        dbConnection.execute.rejects(testError);
      });
      it('Should log the query and variables to the debug channel', async function () {
        try {
          await wrapper.query(testQuery, testVariables);
          assert.fail();
        } catch (err) {
          assert.strictEqual(testLogger.debug.callCount, 2);
          assert.strictEqual(
            testLogger.debug.args[0][0],
            `Executing Query: ${testQuery}`
          );
          assert.strictEqual(
            testLogger.debug.args[1][0],
            `Parameters: ${util.inspect(testVariables)}`
          );
        }
      });
      it('Should attempt to execute the query', async function () {
        try {
          await wrapper.query(testQuery, testVariables);
          assert.fail();
        } catch (err) {
          assert.strictEqual(dbConnection.execute.callCount, 1);
        }
      });
      it('Should log an error message', async function () {
        try {
          await wrapper.query(testQuery, testVariables);
          assert.fail();
        } catch (err) {
          assert.strictEqual(testLogger.error.callCount, 2);
          assert.strictEqual(testLogger.error.args[0][0], 'Query failed');
          assert.strictEqual(testLogger.error.args[1][0], testError);
        }
      });
      it('Should release the connection', async function () {
        try {
          await wrapper.query(testQuery, testVariables);
          assert.fail();
        } catch (err) {
          assert.strictEqual(dbConnection.release.callCount, 1);
        }
      });
      it('Should throw the error', async function () {
        try {
          await wrapper.query(testQuery, testVariables);
          assert.fail();
        } catch (err) {
          assert.strictEqual(err, testError);
        }
      });
    });
    context('When initial query succeeds', function () {
      context('When response generation fails', function () {
        beforeEach(function () {
          testError = new Error('Fetching Rows failed');
          queryResult.resultSet.close.resolves();
          queryResult.resultSet.getRows.rejects(testError);
          dbConnection.execute.resolves(queryResult);
        });
        it('Should log an error message', async function () {
          try {
            await wrapper.query(testQuery, testVariables);
            assert.fail();
          } catch (err) {
            assert.strictEqual(testLogger.error.callCount, 2);
            assert.strictEqual(testLogger.error.args[0][0], 'Error fetching data from query');
            assert.strictEqual(testLogger.error.args[1][0], testError);
          }
        });
        it('Should close the result set', async function () {
          try {
            await wrapper.query(testQuery, testVariables);
            assert.fail();
          } catch (err) {
            assert.strictEqual(queryResult.resultSet.close.callCount, 1);
          }
        });
        it('Should release the connection', async function () {
          try {
            await wrapper.query(testQuery, testVariables);
            assert.fail();
          } catch (err) {
            assert.strictEqual(dbConnection.release.callCount, 1);
          }
        });
        it('Should throw the error', async function () {
          try {
            await wrapper.query(testQuery, testVariables);
            assert.fail();
          } catch (err) {
            assert.strictEqual(err, testError);
          }
        });
      });
      context('When response generation succeeds', function () {
        let results: Record<string, unknown>[];
        const fullQueryResults = [
          { name: 'one' },
          { name: 'two' },
          { name: 'three' },
          { name: 'four' },
          { name: 'fix' },
          { name: 'six' },
        ];
        beforeEach(function () {
          queryResult.resultSet.close.resolves();
          queryResult.resultSet.getRows.onFirstCall()
            .resolves(fullQueryResults.slice(0, 3));
          queryResult.resultSet.getRows.onSecondCall()
            .resolves(fullQueryResults.slice(3, 6));
          queryResult.resultSet.getRows.onThirdCall().resolves([]);
          dbConnection.execute.resolves(queryResult);
        });
        context('with Variables', function () {
          beforeEach(async function () {
            results = await wrapper.query(testQuery, testVariables);
          });
          it('should close the resultSet', function () {
            assert.strictEqual(queryResult.resultSet.close.callCount, 1);
          });
          it('should close the connection', function () {
            assert.strictEqual(dbConnection.release.callCount, 1);
          });
          it('should return the full set of results', function () {
            assert.strictEqual(queryResult.resultSet.getRows.callCount, 3);
            assert.deepStrictEqual(results, fullQueryResults);
          });
        });
        context('without Variables', function () {
          beforeEach(async function () {
            results = await wrapper.query(testQueryWithoutVariables);
          });
          it('should close the resultSet', function () {
            assert.strictEqual(queryResult.resultSet.close.callCount, 1);
          });
          it('should close the connection', function () {
            assert.strictEqual(dbConnection.release.callCount, 1);
          });
          it('should return the full set of results', function () {
            assert.strictEqual(queryResult.resultSet.getRows.callCount, 3);
            assert.deepStrictEqual(results, fullQueryResults);
          });
        });
      });
    });
  });
});
