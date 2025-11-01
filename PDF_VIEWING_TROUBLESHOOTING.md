# PDF Viewing Troubleshooting Guide

## Recent Changes Made

### ✅ Enhanced Logging
- Added detailed logging to the direct investment document proxy endpoint
- Added debug logging to PDFViewer component
- Logs will now show:
  - When the proxy endpoint is called
  - Document lookup results
  - Access control decisions
  - Google Drive fetch attempts and responses
  - PDF fetch success/failure with details

### ✅ Content Security Policy Fix
- Changed CSP header from `default-src 'none'` to `frame-ancestors 'self'; default-src 'none'`
- This allows PDFs to be embedded in iframes from the same origin
- Applied to both fund and direct investment document proxies

## How to Diagnose the Issue

### Step 1: Check Browser Console
When you try to view a PDF, open the browser's Developer Console (F12) and look for:

1. **PDFViewer logs**: Should show `[PDFViewer] Loading PDF from URL: ...`
2. **Network requests**: Check if the proxy endpoint is being called
3. **Console errors**: Look for any JavaScript errors or CORS issues

### Step 2: Check Server Logs
After attempting to view a PDF, check your server logs for:

1. **`[INFO] Direct investment document proxy requested: {documentId}`** - Confirms the endpoint was called
2. **`[INFO] Document found: {title}, URL: {url}`** - Confirms document exists in database
3. **`[INFO] Access granted for user {userId}`** - Confirms access control passed
4. **`[INFO] Fetching PDF from: {url}`** - Shows the Google Drive URL being fetched
5. **`[INFO] PDF fetch response status: {status}`** - Shows if Google Drive responded
6. **`[ERROR] ...`** - Any errors will be logged with details

### Step 3: Test the Proxy Endpoint Directly
Try accessing the proxy endpoint directly in your browser:

```
https://onelp.capital/api/direct-investment-documents/{documentId}/proxy
```

**Expected behaviors:**
- If not logged in: Should return 401 Unauthorized
- If logged in but no access: Should return 403 Forbidden  
- If logged in with access: Should download/show the PDF

### Step 4: Verify Google Drive URL Format
Check the document URL in your database. It should be:
- Format: `https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing`
- The proxy automatically converts this to: `https://drive.google.com/uc?export=download&id={FILE_ID}`

### Step 5: Verify Google Drive Sharing Settings
The PDF must be shared correctly:

1. Open the file in Google Drive
2. Right-click → Share
3. Set to "Anyone with the link" (View only)
4. Copy the share link and verify it matches the URL in your database

## Common Issues and Solutions

### Issue 1: No Logs Appearing
**Symptom**: No `[INFO]` or `[ERROR]` logs in server console

**Possible causes**:
- Proxy endpoint not being called
- PDFViewer not rendering
- Wrong URL being used

**Solution**:
- Check browser console for `[PDFViewer]` logs
- Check Network tab to see if request is made
- Verify `documentId` and `documentType` are being passed correctly

### Issue 2: 403 Forbidden
**Symptom**: Logs show `[WARN] Access denied`

**Possible causes**:
- User doesn't own the direct investment
- User's clientId doesn't match direct investment's clientId
- User doesn't have ADMIN or DATA_MANAGER role

**Solution**:
- Verify user has access to the direct investment
- Check database: `DirectInvestment.userId` or `DirectInvestment.clientId`
- Verify user's `clientId` matches

### Issue 3: 502 Bad Gateway
**Symptom**: Logs show `[ERROR] Failed to fetch PDF from source`

**Possible causes**:
- Google Drive file not shared correctly
- Google Drive URL format incorrect
- Network connectivity issues
- Google Drive file deleted or moved

**Solution**:
1. Verify Google Drive sharing: "Anyone with the link"
2. Test the Google Drive URL directly in browser
3. Check the converted URL: `https://drive.google.com/uc?export=download&id={FILE_ID}`
4. Verify file still exists in Google Drive

### Issue 4: PDF Loads but Shows Blank/Error in Iframe
**Symptom**: Network request succeeds (200 OK) but iframe shows error

**Possible causes**:
- Content-Type header incorrect
- PDF corrupted
- Browser compatibility issue
- CSP/X-Frame-Options blocking

**Solution**:
1. Try downloading the PDF (should work)
2. Try opening in new tab (should work)
3. Check Content-Type is `application/pdf`
4. Verify PDF file itself is valid (open directly from Google Drive)

### Issue 5: PDF Loads Very Slowly
**Symptom**: Long delay before PDF appears

**Possible causes**:
- Large PDF file
- Slow Google Drive response
- Network latency

**Solution**:
- This is normal for large files
- Consider optimizing PDF size
- For very large files, recommend download instead of inline viewing

## Testing Checklist

- [ ] Browser console shows `[PDFViewer]` log with correct URL
- [ ] Server logs show `[INFO] Direct investment document proxy requested`
- [ ] Server logs show `[INFO] Document found`
- [ ] Server logs show `[INFO] Access granted`
- [ ] Server logs show `[INFO] Fetching PDF from: {url}`
- [ ] Server logs show `[INFO] PDF fetch response status: 200`
- [ ] Server logs show `[INFO] PDF fetched successfully, size: {bytes}`
- [ ] Network request returns 200 OK with `Content-Type: application/pdf`
- [ ] PDF displays in iframe or fallback message appears

## Next Steps if Still Not Working

1. **Share the logs**: Copy the server logs and browser console output
2. **Test with a simple PDF**: Try with a different, known-good Google Drive PDF
3. **Test the fund documents**: See if fund documents work (to isolate if it's direct investment specific)
4. **Check browser compatibility**: Try different browsers
5. **Verify database**: Ensure document exists and URL is correct

## Additional Debugging

To get even more detailed logs, you can temporarily add:

```typescript
// In the proxy endpoint, after fetching document:
console.log('[DEBUG] Document data:', JSON.stringify(document, null, 2))
console.log('[DEBUG] User data:', JSON.stringify({ id: session.user.id, role: session.user.role, clientId: user?.clientId }, null, 2))
console.log('[DEBUG] Direct investment data:', JSON.stringify(document.directInvestment, null, 2))
```

This will help identify any data issues.

