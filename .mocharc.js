module.exports = {
  ui: 'bdd',
  reporter: 'spec',
  timeout: 30000,
  file: '.mochainit.ts',
  require: [
    'ts-node/register',
  ],
  extension: ['ts', 'js'],
  spec: ['src/**/*.test.ts'],
}
