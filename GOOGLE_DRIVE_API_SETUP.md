# Google Drive API Setup Guide

## Problem
Google Drive is returning PNG image previews instead of actual PDF files when accessed programmatically. This happens because:
- Google Drive blocks programmatic downloads for files that require authentication
- The file may have security restrictions that prevent direct download
- Browser sessions work, but server-side requests without authentication don't

## Solution: Google Drive API with Service Account

### Step 1: Install Google APIs Package ✅
Already installed via: `npm install googleapis`

### Step 2: Create Google Cloud Project & Service Account

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or Select a Project**
3. **Enable Google Drive API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click "Enable"

4. **Create Service Account**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Fill in:
     - Name: `onelp-document-proxy`
     - Description: `Service account for secure document access`
   - Click "Create and Continue"
   - Skip role assignment (click "Continue")
   - Click "Done"

5. **Create Key for Service Account**:
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON" format
   - Click "Create" (this downloads a JSON file)

6. **Get Service Account Email**:
   - From the service account details page, copy the email address
   - Format: `onelp-document-proxy@your-project.iam.gserviceaccount.com`

### Step 3: Share Files with Service Account

For each PDF file in Google Drive:

1. Open the file in Google Drive
2. Right-click → "Share"
3. Add the service account email (e.g., `onelp-document-proxy@your-project.iam.gserviceaccount.com`)
4. Set permission to "Viewer" (Read-only)
5. Click "Send" (or "Share" if notifications are disabled)

**Important**: You must share each file individually with the service account email.

### Step 4: Add Environment Variables

Add to your `.env` file:

```env
# Google Drive API Configuration
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=onelp-document-proxy@your-project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**To get the private key from the downloaded JSON file:**

1. Open the JSON file you downloaded
2. Find the `private_key` field
3. Copy the entire value (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
4. Replace all actual newlines with `\n` (or keep as-is if your .env supports multiline)
5. Wrap in quotes

**Example .env format:**
```env
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=onelp-document-proxy@myproject-123456.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### Step 5: Test

1. Restart your Next.js server (to load new environment variables)
2. Try viewing a PDF that you've shared with the service account
3. Check server logs - you should see:
   ```
   [INFO] Attempting to fetch via Google Drive API using service account
   [INFO] Successfully fetched PDF via Google Drive API
   ```

## How It Works

The proxy endpoint will:
1. **First try**: Google Drive API (if credentials are configured)
2. **Fallback**: Public download methods (if API fails or not configured)

This ensures backward compatibility while enabling secure access when configured.

## Troubleshooting

### "Permission denied" or "File not found" errors

- **Ensure the file is shared with the service account email**
- Check that the service account email matches exactly (case-sensitive)
- Verify the file ID in the database matches the actual Google Drive file

### "Invalid credentials" error

- Verify `GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL` is correct
- Check `GOOGLE_DRIVE_PRIVATE_KEY` includes the full key with BEGIN/END markers
- Ensure newlines in the private key are properly escaped (`\n`)

### API still not being used

- Check that environment variables are loaded: `console.log(process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL)`
- Verify `googleapis` package is installed: `npm list googleapis`
- Restart your server after adding environment variables

### Files still showing PNG previews

- Ensure the file is actually a PDF (not an image file)
- Verify the file is shared correctly with the service account
- Check server logs for API errors

## Security Notes

- ✅ Service account keys should be kept secure (never commit to git)
- ✅ Use `.env.local` for local development (already in .gitignore)
- ✅ For production, use your hosting platform's environment variable system (Vercel, etc.)
- ✅ Service account has read-only access (can't modify files)
- ✅ Files must be explicitly shared with the service account

## Alternative: Quick Fix (Without API)

If you can't set up the API right now, you can:

1. **Make files truly public**:
   - Share file → "Anyone with the link" → "Viewer"
   - This may work for some files but not all

2. **Use direct download links**:
   - In the database, change URLs to direct download format
   - Format: `https://drive.google.com/uc?export=download&id={FILE_ID}`
   - Less secure but may work for testing

However, **Google Drive API is the recommended solution** for production use with sensitive financial documents.

