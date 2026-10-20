import * as migration_20261020_084901_init from './20261020_084901_init';
import * as migration_20261020_151800_private_enquiry_files from './20261020_151800_private_enquiry_files';

export const migrations = [
  {
    up: migration_20261020_084901_init.up,
    down: migration_20261020_084901_init.down,
    name: '20261020_084901_init'
  },
  {
    up: migration_20261020_151800_private_enquiry_files.up,
    down: migration_20261020_151800_private_enquiry_files.down,
    name: '20261020_151800_private_enquiry_files'
  },
];
