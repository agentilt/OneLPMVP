import { put } from '@vercel/blob'

export async function uploadToBlob(
  key: string,
  buffer: Buffer,
  contentType: string,
  access: 'private' | 'public' = 'private'
) {
  const { url } = await put(key, buffer, { access, contentType, token: process.env.BLOB_READ_WRITE_TOKEN })
  return url // Already a signed/private URL for download
}