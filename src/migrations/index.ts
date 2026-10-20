import * as migration_20261020_084901_init from './20261020_084901_init';

export const migrations = [
  {
    up: migration_20261020_084901_init.up,
    down: migration_20261020_084901_init.down,
    name: '20261020_084901_init'
  },
];
