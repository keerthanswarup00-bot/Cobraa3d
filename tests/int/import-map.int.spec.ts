import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Payload admin import map', () => {
  it('includes the S3 upload handler used when cloud storage is configured', () => {
    const importMap = readFileSync(resolve(process.cwd(), 'src/app/(payload)/admin/importMap.js'), 'utf8')

    expect(importMap).toContain('@payloadcms/storage-s3/client#S3ClientUploadHandler')
  })
})
