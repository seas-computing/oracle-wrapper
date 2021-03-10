import util from 'util';
import { strictEqual, deepStrictEqual, fail } from 'assert';
import { stub, SinonStub } from 'sinon';
import oracledb, { Connection, PoolAttributes } from 'oracledb';
import OracleWrapper from '../index';
import { Logger, OracleDBOptions } from '../types';
import * as dummy from './mockData';

describe('OracleWrapper', function () {
  let wrapper: OracleWrapper;
  let getConnectionStub: SinonStub;
  let createPoolStub: SinonStub;
  let connectionPool: Record<string, SinonStub>;
  let dbConnection: Record<string, SinonStub>;
  let queryResult: Record<string, Record<string, SinonStub>>;
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
    wrapper = new OracleWrapper(dummy.dbCredentials, options);
    getConnectionStub = stub(oracledb, 'getConnection');
    createPoolStub = stub(oracledb, 'createPool');
  });
  describe('Constructor', function () {
    describe('Alias', function () {
      const testAlias = 'TestDB2';
      let aliasedWrapper: OracleWrapper;
      context('With a value in options', function () {
        beforeEach(function () {
          aliasedWrapper = new OracleWrapper(
            dummy.dbCredentials,
            { alias: testAlias }
          );
        });
        it('Should use the alias as the property', function () {
          // eslint-disable-next-line @typescript-eslint/dot-notation
          strictEqual(aliasedWrapper['alias'], testAlias);
        });
      });
      context('Without a value in options', function () {
        beforeEach(function () {
          aliasedWrapper = new OracleWrapper(dummy.dbCredentials);
        });
        it('Should use the sid as the alias property', function () {
          // eslint-disable-next-line @typescript-eslint/dot-notation
          strictEqual(aliasedWrapper['alias'], dummy.dbCredentials.sid);
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
            fail();
          } catch (error) {
            strictEqual(createPoolStub.callCount, 1);
          }
        });
        it('Should use the alias from options', async function () {
          try {
            await wrapper.getConnection();
            fail();
          } catch (error) {
            const { poolAlias } = createPoolStub.args[0][0] as PoolAttributes;
            strictEqual(poolAlias, options.alias);
          }
        });
        it('Should use the credentials', async function () {
          try {
            await wrapper.getConnection();
            fail();
          } catch (error) {
            const {
              user,
              password,
              connectionString,
            } = createPoolStub.args[0][0] as PoolAttributes;
            strictEqual(user, dummy.user);
            strictEqual(password, dummy.password);
            strictEqual(
              connectionString,
              `${dummy.host}:${dummy.port}/${dummy.sid}`
            );
          }
        });
        it('Should log an error notice', async function () {
          try {
            await wrapper.getConnection();
            fail();
          } catch (error) {
            strictEqual(testLogger.error.callCount, 2);
            strictEqual(
              testLogger.error.args[0][0],
              'Failed to create connectionPool'
            );
            strictEqual(testLogger.error.args[1][0], testError);
          }
        });
        it('Should throw the error', async function () {
          try {
            await wrapper.getConnection();
            fail();
          } catch (error) {
            deepStrictEqual(error, testError);
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
              fail();
            } catch (error) {
              strictEqual(getConnectionStub.callCount, 1);
            }
          });
          it('Should use the alias from the options', async function () {
            try {
              await wrapper.getConnection();
              fail();
            } catch (error) {
              strictEqual(getConnectionStub.args[0][0], options.alias);
            }
          });
          it('Should log a message about the error', async function () {
            try {
              await wrapper.getConnection();
              fail();
            } catch (error) {
              strictEqual(testLogger.error.callCount, 2);
              strictEqual(testLogger.error.args[0][0], 'Failed to get connection');
              strictEqual(testLogger.error.args[1][0], testError);
            }
          });
          it('Should throw the error', async function () {
            try {
              await wrapper.getConnection();
              fail();
            } catch (error) {
              deepStrictEqual(error, testError);
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
            strictEqual(createPoolStub.callCount, 1);
          });
          it('Should use the alias from options', function () {
            const { poolAlias } = createPoolStub.args[0][0] as PoolAttributes;
            strictEqual(poolAlias, options.alias);
          });
          it('Should use the credentials', function () {
            const {
              user,
              password,
              connectionString,
            } = createPoolStub.args[0][0] as PoolAttributes;
            strictEqual(user, dummy.user);
            strictEqual(password, dummy.password);
            strictEqual(
              connectionString,
              `${dummy.host}:${dummy.port}/${dummy.sid}`
            );
          });
          it('Should call getConnection', function () {
            strictEqual(getConnectionStub.callCount, 1);
          });
          it('Should use the alias from the options', function () {
            strictEqual(getConnectionStub.args[0][0], options.alias);
          });
          it('Should reuturn the result', function () {
            deepStrictEqual(result, dbConnection);
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
        strictEqual(createPoolStub.callCount, 0);
      });
      it('Should call getConnection', async function () {
        await wrapper.getConnection();
        strictEqual(getConnectionStub.callCount, 1);
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
        strictEqual(connectionPool.close.callCount, 0);
      });
      it('Should not log anything', function () {
        Object.values(testLogger).forEach((logStub) => {
          strictEqual(logStub.callCount, 0);
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
            fail();
          } catch (error) {
            strictEqual(connectionPool.close.callCount, 1);
          }
        });
        it('Should log an error message', async function () {
          try {
            await wrapper.releasePool();
            fail();
          } catch (error) {
            strictEqual(testLogger.error.callCount, 2);
            strictEqual(
              testLogger.error.args[0][0],
              'Could not release pool'
            );
            strictEqual(testLogger.error.args[1][0], testError);
          }
        });
        it('Should rethrow the error', async function () {
          try {
            await wrapper.releasePool();
            fail();
          } catch (error) {
            strictEqual(error, testError);
          }
        });
      });
      context('When the pool successfully releases', function () {
        beforeEach(async function () {
          connectionPool.close.resolves();
          return wrapper.releasePool();
        });
        it('Should call connectionPool.close', function () {
          strictEqual(connectionPool.close.callCount, 1);
        });
        it('Should log a message about the connection pool releasing', function () {
          strictEqual(testLogger.info.callCount, 1);
          strictEqual(
            testLogger.info.args[0][0],
            'Connection pool released'
          );
        });
      });
    });
  });
  describe('query', function () {
    let testError: Error;
    beforeEach(function () {
      testError = new Error('query failed');
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
          await wrapper.query(dummy.queryWithParameters, dummy.queryParameters);
          fail();
        } catch (err) {
          strictEqual(testLogger.debug.callCount, 2);
          strictEqual(
            testLogger.debug.args[0][0],
            `Executing Query: ${dummy.queryWithParameters}`
          );
          strictEqual(
            testLogger.debug.args[1][0],
            `Parameters: ${util.inspect(dummy.queryParameters)}`
          );
        }
      });
      it('Should attempt to execute the query', async function () {
        try {
          await wrapper.query(dummy.queryWithParameters, dummy.queryParameters);
          fail();
        } catch (err) {
          strictEqual(dbConnection.execute.callCount, 1);
        }
      });
      it('Should log an error message', async function () {
        try {
          await wrapper.query(dummy.queryWithParameters, dummy.queryParameters);
          fail();
        } catch (err) {
          strictEqual(testLogger.error.callCount, 2);
          strictEqual(testLogger.error.args[0][0], 'Query failed');
          strictEqual(testLogger.error.args[1][0], testError);
        }
      });
      it('Should release the connection', async function () {
        try {
          await wrapper.query(dummy.queryWithParameters, dummy.queryParameters);
          fail();
        } catch (err) {
          strictEqual(dbConnection.release.callCount, 1);
        }
      });
      it('Should throw the error', async function () {
        try {
          await wrapper.query(dummy.queryWithParameters, dummy.queryParameters);
          fail();
        } catch (err) {
          strictEqual(err, testError);
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
            await wrapper.query(
              dummy.queryWithParameters,
              dummy.queryParameters
            );
            fail();
          } catch (err) {
            strictEqual(testLogger.error.callCount, 2);
            strictEqual(testLogger.error.args[0][0], 'Error fetching data from query');
            strictEqual(testLogger.error.args[1][0], testError);
          }
        });
        it('Should close the result set', async function () {
          try {
            await wrapper.query(
              dummy.queryWithParameters,
              dummy.queryParameters
            );
            fail();
          } catch (err) {
            strictEqual(queryResult.resultSet.close.callCount, 1);
          }
        });
        it('Should release the connection', async function () {
          try {
            await wrapper.query(
              dummy.queryWithParameters,
              dummy.queryParameters
            );
            fail();
          } catch (err) {
            strictEqual(dbConnection.release.callCount, 1);
          }
        });
        it('Should throw the error', async function () {
          try {
            await wrapper.query(
              dummy.queryWithParameters,
              dummy.queryParameters
            );
            fail();
          } catch (err) {
            strictEqual(err, testError);
          }
        });
      });
      context('When response generation succeeds', function () {
        let results: Record<string, unknown>[];
        beforeEach(function () {
          queryResult.resultSet.close.resolves();
          queryResult.resultSet.getRows.onFirstCall()
            .resolves(dummy.queryResults.slice(0, 3));
          queryResult.resultSet.getRows.onSecondCall()
            .resolves(dummy.queryResults.slice(3, 6));
          queryResult.resultSet.getRows.onThirdCall().resolves([]);
          dbConnection.execute.resolves(queryResult);
        });
        context('with Variables', function () {
          beforeEach(async function () {
            results = await wrapper.query(
              dummy.queryWithParameters,
              dummy.queryParameters
            );
          });
          it('should close the resultSet', function () {
            strictEqual(queryResult.resultSet.close.callCount, 1);
          });
          it('should close the connection', function () {
            strictEqual(dbConnection.release.callCount, 1);
          });
          it('should return the full set of results', function () {
            strictEqual(queryResult.resultSet.getRows.callCount, 3);
            deepStrictEqual(results, dummy.queryResults);
          });
        });
        context('without Variables', function () {
          beforeEach(async function () {
            results = await wrapper.query(dummy.queryWithoutParameters);
          });
          it('should close the resultSet', function () {
            strictEqual(queryResult.resultSet.close.callCount, 1);
          });
          it('should close the connection', function () {
            strictEqual(dbConnection.release.callCount, 1);
          });
          it('should return the full set of results', function () {
            strictEqual(queryResult.resultSet.getRows.callCount, 3);
            deepStrictEqual(results, dummy.queryResults);
          });
        });
      });
    });
  });
});
