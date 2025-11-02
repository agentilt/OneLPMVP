# Support Chatbox Setup Guide

This guide explains how to set up the support chatbox feature for your OneLP application.

## Overview

The chatbox component supports multiple providers and can be easily configured. Currently, we support:
- **Crisp** (Recommended - Free tier available)
- **Tawk.to** (Free)

Both work seamlessly with Vercel deployments.

## Quick Setup: Crisp (Recommended)

### Step 1: Create a Crisp Account
1. Go to [https://crisp.chat](https://crisp.chat)
2. Sign up for a free account
3. Create a new website/inbox in your dashboard

### Step 2: Get Your Website ID
1. In your Crisp dashboard, go to **Settings** → **Website Settings**
2. Find your **Website ID** (it's a UUID like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. Copy this ID

### Step 3: Configure Environment Variables
Add the following to your `.env.local` file (and Vercel environment variables):

```env
NEXT_PUBLIC_CHAT_PROVIDER=crisp
NEXT_PUBLIC_CRISP_WEBSITE_ID=2c24875c-7fa9-416b-9074-82140254ff81
```

**Your Crisp Website ID:** `2c24875c-7fa9-416b-9074-82140254ff81`

### Step 4: Deploy
The chatbox will automatically appear on all pages once deployed!

## Alternative Setup: Tawk.to

### Step 1: Create a Tawk.to Account
1. Go to [https://www.tawk.to](https://www.tawk.to)
2. Sign up for a free account
3. Create a new property

### Step 2: Get Your IDs
1. In your Tawk.to dashboard, go to **Administration** → **Channels** → **Chat Widget**
2. Find your **Property ID** and **Widget ID**
3. Copy both IDs

### Step 3: Configure Environment Variables
Add the following to your `.env.local` file:

```env
NEXT_PUBLIC_CHAT_PROVIDER=tawk
NEXT_PUBLIC_TAWK_PROPERTY_ID=your-property-id
NEXT_PUBLIC_TAWK_WIDGET_ID=your-widget-id
```

## Features

### Automatic User Identification
When users are logged in, the chatbox automatically identifies them with:
- Email address
- Name/Nickname

This helps you see who you're chatting with directly in your dashboard.

### Works on All Pages
The chatbox appears on all pages of your application, making it easy for clients to reach out from anywhere.

## Vercel Configuration

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the environment variables listed above
4. Redeploy your application

The chatbox will work automatically on all deployments (including preview deployments).

## Customization

### Hide Chatbox on Specific Pages
If you need to hide the chatbox on certain pages, you can modify the `Chatbox` component to accept props:

```tsx
// Example: Hide on login page
{router.pathname !== '/login' && <Chatbox />}
```

### Styling
Both Crisp and Tawk.to allow customization of the chatbox appearance through their respective dashboards.

## Testing

1. Start your development server: `npm run dev`
2. Navigate to any page
3. Look for the chat widget in the bottom-right corner
4. Click it to open the chat interface

## Troubleshooting

### Chatbox Not Appearing
- Check that environment variables are set correctly
- Ensure the variables start with `NEXT_PUBLIC_` for client-side access
- Check browser console for any error messages
- Verify your website/widget IDs are correct

### User Information Not Showing
- Ensure users are logged in (the component uses `useSession()`)
- Check that NextAuth is properly configured
- Verify session data includes `email` and `name` fields

## Switching Providers

To switch from one provider to another:
1. Update `NEXT_PUBLIC_CHAT_PROVIDER` environment variable
2. Update the corresponding provider-specific environment variables
3. Redeploy

## Cost

- **Crisp**: Free tier includes 2 seats, unlimited chats. Paid plans start at $25/month for more features
- **Tawk.to**: Completely free forever

Both options are excellent for starting out!

## Support

If you need help configuring the chatbox:
- Check the provider's documentation
- Review the `Chatbox.tsx` component code
- Ensure all environment variables are correctly set in both local and production environments

