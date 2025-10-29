# Update Vercel DATABASE_URL

## ✅ Migration Applied to Correct Database

The Client table migration has been successfully applied to:
- **Database**: `ep-lucky-poetry-adfr9ux6-pooler.c-2.us-east-1.aws.neon.tech`
- **Database Name**: `neondb`
- **Status**: ✅ Client table created, Fund table updated

## 🔧 Next Step: Update Vercel Environment Variable

Your backend is currently connected to the wrong database. Update it now:

### Steps:

1. **Go to Vercel Dashboard**
   - Navigate to your project: `OneLPMVP`
   - Click **Settings** → **Environment Variables**

2. **Find `DATABASE_URL`**
   - Look for the variable named `DATABASE_URL`
   - It's currently set to: `ep-shiny-mouse-...` (WRONG)
   - It should be: `ep-lucky-poetry-adfr9ux6-...` (CORRECT)

3. **Update the Value**
   - Click the **edit icon** (pencil) next to `DATABASE_URL`
   - Replace with:
     ```
     postgresql://neondb_owner:npg_rVqMblS9Jm3v@ep-lucky-poetry-adfr9ux6-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
     ```
 Mittel
   - Make sure it's set for **Production** environment
   - Click **Save**

4. **Redeploy the Application**
   - After updating the environment variable, Vercel will show a "Redeploy" button
   - Click **Redeploy** → **Redeploy with existing Build Cache** (faster) or **Redeploy** (clean build)
   - Wait for deployment to complete

5. **Verify It's Working**
   - After deployment, call the diagnostic endpoint:
     ```bash
     curl https://onelp.capital/api/debug/db-info
     ```
   - It should show:
     ```json
     {
       "connection": {
         "host": "ep-lucky-poetry-adfr9ux6-pooler.c-2.us-east-1.aws.neon.tech",
         "database": "neondb"
       },
       "clientTable": {
         "exists": true,
         "recordCount": 0
       }
     }
     ```

6. **Test the API**
   - Try calling the clients endpoint:
     ```bash
     curl -H "x-api-key: YOUR_ADMIN_API_KEY" https://onelp.capital/api/admin/clients
     ```
   - Should return `{"data":[],"page":1,"pageSize":20,"total":0}` (empty but working!)

## ⚠️ Important Notes

- The migration has already been applied to the **correct** database
- You just need to update the Vercel environment variable to point to it
- After redeploy, your backend will be connected to the right database
- No need to run migrations again - they're already done!

## 🔒 Security

After updating, consider:
- Rotating the database password (generate new one in Neon)
- Updating the connection string with the new password
- Never commit connection strings to git

---

**Once you update Vercel and redeploy, your admin app should work perfectly!** 🎉

