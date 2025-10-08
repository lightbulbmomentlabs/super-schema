# HubSpot App Credentials Needed

## What I Need From You

To complete the HubSpot integration setup, please provide the following from your HubSpot OAuth app:

### 1. Client ID
```
Example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Where to find it:**
- HubSpot app dashboard → Auth tab → Client ID

---

### 2. Client Secret
```
Example: abc123def456ghi789jkl012mno345pqr678
```

**Where to find it:**
- HubSpot app dashboard → Auth tab → Client Secret

---

### 3. Confirmation Checklist

Please confirm:
- [ ] Redirect URL is set to: `http://localhost:3000/hubspot/callback`
- [ ] Scopes include: `content` and `oauth` (minimum)
- [ ] App is in "Active" or "Development" status

---

## What I'll Do Next

Once you provide these credentials, I will:

1. ✅ Generate encryption key
2. ✅ Update environment variables (both `.env` files)
3. ✅ Run database migration in Supabase
4. ✅ Restart development server
5. ✅ Test OAuth connection flow
6. ✅ Verify schema push functionality

**Estimated time:** 5 minutes

---

## Format

You can provide the credentials in any format, for example:

```
Client ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Client Secret: abc123def456ghi789jkl012mno345pqr678
Redirect URL: ✅ Confirmed - http://localhost:3000/hubspot/callback
Scopes: ✅ Confirmed - content, oauth
```

Or simply paste them like:
```
Client ID: [paste here]
Client Secret: [paste here]
```

---

## Security Note

The Client Secret is sensitive - it will be:
- Stored in your local `.env` file (which is gitignored)
- Used only to exchange OAuth authorization codes for access tokens
- Never exposed to the client-side application
- Never committed to git

---

Ready when you are! 🚀
