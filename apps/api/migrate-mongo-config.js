/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

module.exports = {
  mongodb: {
    url: process.env.MONGODB_URI,
    databaseName: 'quiz',
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js',
};
