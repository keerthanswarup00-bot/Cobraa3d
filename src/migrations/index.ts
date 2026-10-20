import * as migration_20261020_084901_init from './20261020_084901_init';
import * as migration_20261020_151800_private_enquiry_files from './20261020_151800_private_enquiry_files';
import * as migration_20261020_164200_request_rate_limits from './20261020_164200_request_rate_limits';

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
  {
    up: migration_20261020_164200_request_rate_limits.up,
    down: migration_20261020_164200_request_rate_limits.down,
    name: '20261020_164200_request_rate_limits'
  },
];
