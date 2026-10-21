import * as migration_20261020_084901_init from './20261020_084901_init';
import * as migration_20261020_151800_private_enquiry_files from './20261020_151800_private_enquiry_files';
import * as migration_20261020_164200_request_rate_limits from './20261020_164200_request_rate_limits';
import * as migration_20261020_164300_products_page_settings from './20261020_164300_products_page_settings';
import * as migration_20261020_164400_locked_docs_rels from './20261020_164400_locked_docs_rels';
import * as migration_20261020_164500_upload_object_key from './20261020_164500_upload_object_key';

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
  {
    up: migration_20261020_164300_products_page_settings.up,
    down: migration_20261020_164300_products_page_settings.down,
    name: '20261020_164300_products_page_settings'
  },
  {
    up: migration_20261020_164400_locked_docs_rels.up,
    down: migration_20261020_164400_locked_docs_rels.down,
    name: '20261020_164400_locked_docs_rels'
  },
  {
    up: migration_20261020_164500_upload_object_key.up,
    down: migration_20261020_164500_upload_object_key.down,
    name: '20261020_164500_upload_object_key'
  },
];
