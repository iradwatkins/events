# Email Setup Guide

This guide will help you configure email sending for Magic Link authentication using Resend.

## Step 1: Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Get Your API Key

1. Once logged in, go to [https://resend.com/api-keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Give it a name like "SteppersLife Events Development"
4. Copy the API key (it starts with `re_`)

## Step 3: Configure Environment Variables

1. Open your `.env.local` file in the project root
2. Add or uncomment these lines:

```bash
# Resend Email Service
RESEND_API_KEY=re_YOUR_API_KEY_HERE
RESEND_FROM_EMAIL=SteppersLife Events <onboarding@resend.dev>
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

3. Replace `re_YOUR_API_KEY_HERE` with your actual Resend API key

## Step 4: Verify Domain (Optional for Production)

For development, you can use `onboarding@resend.dev` as the sender email.

For production:
1. Go to [https://resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `stepperslife.com`)
4. Add the DNS records to your domain provider
5. Wait for verification (usually takes a few minutes)
6. Update `RESEND_FROM_EMAIL` to use your verified domain:
   ```bash
   RESEND_FROM_EMAIL=SteppersLife Events <noreply@stepperslife.com>
   ```

## Step 5: Test Email Sending

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Go to [http://localhost:3004/login](http://localhost:3004/login)
3. Enter your email address
4. Click "Send Magic Link"
5. Check your email inbox for the magic link

## Troubleshooting

### Email not arriving?

1. **Check spam folder** - Sometimes emails end up in spam
2. **Verify API key** - Make sure your `RESEND_API_KEY` is correct
3. **Check Resend dashboard** - Go to [https://resend.com/emails](https://resend.com/emails) to see email logs
4. **Console logs** - Check the terminal for error messages

### Common Errors

**"Email service not configured"**
- Make sure `RESEND_API_KEY` is set in `.env.local`
- Restart your development server after adding the key

**"Failed to send email"**
- Check if your API key is valid
- Verify you haven't exceeded Resend's free tier limits (100 emails/day for free accounts)
- Check Resend dashboard for any account issues

## Email Templates

The magic link email includes:
- Professional branded header
- Clear call-to-action button
- Security information (15-minute expiration)
- Plain text fallback for email clients that don't support HTML
- Copy-paste link as backup

## Rate Limits

Resend free tier includes:
- 100 emails per day
- 3,000 emails per month
- Full API access

For production, consider upgrading to a paid plan for higher limits.

## Security Notes

1. **Token Expiration**: Magic links expire after 15 minutes
2. **One-Time Use**: Each link can only be used once
3. **HTTPS Required**: Always use HTTPS in production for secure token transmission
4. **Environment Variables**: Never commit `.env.local` to version control

## Production Checklist

Before going to production:

- [ ] Verify your sending domain with Resend
- [ ] Update `RESEND_FROM_EMAIL` to use your domain
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production URL
- [ ] Test email delivery to multiple email providers (Gmail, Outlook, etc.)
- [ ] Upgrade Resend plan if needed for higher volumes
- [ ] Set up email monitoring and alerts
- [ ] Implement proper token storage and validation in database

## Support

- Resend Documentation: [https://resend.com/docs](https://resend.com/docs)
- Resend Support: [https://resend.com/support](https://resend.com/support)
- SteppersLife Events Issues: [GitHub Issues](https://github.com/your-repo/issues)
