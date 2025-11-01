# Secure Document Display Guide

## Overview

This application now includes a **secure document proxy system** that ensures sensitive financial documents are protected from unauthorized access, even when stored in external services like Google Drive.

## Security Architecture

### 🔒 Secure Proxy Endpoint

All document access is now routed through a secure server-side proxy endpoint:
- **Endpoint**: `/api/documents/[documentId]/proxy`
- **Method**: GET
- **Authentication**: Required (NextAuth session)

### How It Works

1. **User Authentication**: Verifies user is logged in
2. **Permission Check**: Validates user has access to the fund that owns the document
3. **Server-Side Fetch**: Retrieves PDF from source (Google Drive, S3, etc.) server-side
4. **Stream to Client**: Sends PDF to browser with security headers
5. **Audit Logging**: Records all access attempts (authorized and unauthorized)

## Security Features

### ✅ Access Control
- Documents are only accessible to users with proper fund permissions
- Supports fund ownership, FundAccess grants, and admin roles
- Unauthorized access attempts are logged and blocked

### ✅ URL Protection
- Original document URLs (e.g., Google Drive links) are **never exposed to the client**
- Users only see proxy URLs that require authentication
- Direct access to source URLs is impossible without authentication

### ✅ Security Headers
Documents are served with:
- `Cache-Control: private, no-cache, no-store, must-revalidate` - Prevents caching
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Content-Security-Policy: default-src 'none'` - Restricts resource loading

### ✅ Audit Trail
Every document access is logged with:
- User ID
- Document ID and title
- Timestamp
- IP address
- User agent

## Using with Google Drive

### Setting Up Google Drive Documents

1. **Upload your PDF to Google Drive**
2. **Share the file** with appropriate permissions:
   - **For public access**: Share with "Anyone with the link" (View only)
   - **For private access**: Use Google Drive API with service account (see below)

3. **Get the shareable link**:
   - Supported formats:
     - `https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing`
     - `https://drive.google.com/file/d/{FILE_ID}/view?usp=drive_link`
     - `https://drive.google.com/file/d/{FILE_ID}/view`
     - `https://drive.google.com/open?id={FILE_ID}`
   
4. **Create document in OneLP**:
   - Use any of the supported shareable link formats as the `url` field
   - The proxy will automatically convert it to a direct download URL

### Google Drive URL Conversion

The proxy automatically handles various Google Drive URL formats:
- Input: `https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing`
- Input: `https://drive.google.com/file/d/1ABC123xyz/view?usp=drive_link`
- Input: `https://drive.google.com/file/d/1ABC123xyz/view`
- Converts all to: `https://drive.google.com/uc?export=download&id=1ABC123xyz`

### Private Google Drive Files (Advanced)

For enhanced security with private files, integrate Google Drive API:

1. **Create a Google Cloud Project**
2. **Enable Google Drive API**
3. **Create a Service Account**
4. **Add environment variables**:
   ```env
   GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

5. **Share files with service account email** (View only)

6. **Update proxy endpoint** to use Google Drive API:
   ```typescript
   // In /api/documents/[documentId]/proxy/route.ts
   import { google } from 'googleapis'
   
   const auth = new google.auth.JWT(
     process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL,
     null,
     process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
     ['https://www.googleapis.com/auth/drive.readonly']
   )
   
   const drive = google.drive({ version: 'v3', auth })
   const file = await drive.files.get({
     fileId: fileId,
     alt: 'media'
   })
   ```

## Frontend Usage

### PDFViewer Component

The `PDFViewer` component now supports secure document viewing:

```tsx
<PDFViewer
  url={document.url}           // Original URL (stored in DB)
  title={document.title}
  documentId={document.id}      // Required for secure proxy
  onClose={() => setOpen(false)}
/>
```

**Important**: Always pass `documentId` when displaying sensitive documents to use the secure proxy.

### Direct Links

For download/open links, use the proxy endpoint:

```tsx
<a href={`/api/documents/${document.id}/proxy`} target="_blank">
  Download
</a>
```

## Security Best Practices

### ✅ DO
- Always use the proxy endpoint for sensitive documents
- Pass `documentId` to PDFViewer component
- Use Google Drive API with service accounts for private files
- Regularly review audit logs for suspicious activity
- Set Google Drive files to "View only" permissions

### ❌ DON'T
- Never expose original Google Drive URLs to the client
- Don't share Google Drive files publicly if they contain sensitive data
- Don't bypass the proxy for financial documents
- Don't store API keys or credentials in client-side code

## Access Control Logic

The proxy checks access using this hierarchy:

1. **Fund Owner**: User who owns the fund
2. **Admin Role**: Users with ADMIN role can access all documents
3. **Data Manager Role**: Users with DATA_MANAGER role can access all documents
4. **FundAccess**: Users explicitly granted access via FundAccess model

## Audit Logs

View access logs in the audit system:
- **Resource**: `DOCUMENT`
- **Action**: `DOWNLOAD`
- **Includes**: User, timestamp, IP, document ID, success/failure

## Testing

To test the secure proxy:

1. Create a document with a Google Drive URL
2. Try accessing `/api/documents/{documentId}/proxy`:
   - **Without login**: Should return 401 Unauthorized
   - **With login but no access**: Should return 403 Forbidden
   - **With proper access**: Should return PDF with 200 OK

## Migration from Direct URLs

If you have existing documents using direct URLs:

1. **No database changes needed** - Existing `url` fields work as-is
2. **Update frontend code** to use proxy endpoints:
   - Replace direct URL references with `/api/documents/{id}/proxy`
   - Add `documentId` prop to PDFViewer components
3. **Test thoroughly** - Ensure all document access points use proxy

## Troubleshooting

### Document not loading
- Check user has access to the fund
- Verify Google Drive file is shared correctly
- Check server logs for fetch errors
- Ensure document URL is valid

### 403 Forbidden
- Verify user has FundAccess record
- Check fund ownership
- Confirm user role permissions

### 502 Bad Gateway
- Google Drive file may not be accessible
- Check Google Drive sharing settings
- Verify network connectivity from server

## Future Enhancements

Potential improvements:
- [ ] Signed URLs with expiration tokens
- [ ] Rate limiting per user/IP
- [ ] Watermarking for sensitive documents
- [ ] Client-side encryption for storage
- [ ] Integration with additional storage providers (S3, Azure Blob, etc.)

