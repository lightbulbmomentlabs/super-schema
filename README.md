# AEO Schema Generator

AI-powered JSON-LD schema markup generator for optimizing websites for AI search engines and traditional SEO.

## Features

- 🤖 **AI-Powered Generation**: Uses GPT-4 Mini to analyze website content and generate optimal schema markup
- 🔍 **Smart Content Analysis**: Puppeteer-based web scraping with JavaScript rendering support
- ✅ **Real-Time Validation**: Instant Schema.org compliance checking with error reporting
- 🎨 **Professional Editor**: Monaco Editor with syntax highlighting and implementation guides
- 💳 **Credit System**: Secure payment processing with Stripe integration
- 📊 **Analytics Dashboard**: Track usage, success rates, and generation history
- 🔐 **Secure Authentication**: Clerk-based user management with automatic credit allocation

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS v4** for modern styling
- **Clerk** for authentication
- **Stripe Elements** for payments
- **Monaco Editor** for code editing
- **React Query** for data management

### Backend
- **Node.js + Express** with TypeScript
- **Supabase** for database and real-time features
- **OpenAI GPT-4 Mini** for AI-powered schema generation
- **Puppeteer** for web scraping and content analysis
- **Stripe** for payment processing
- **Zod** for schema validation

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` in both `client/` and root directories
   - Fill in your API keys (see Environment Variables section below)

3. **Set up the database:**
   - The database migrations are already applied to the configured Supabase instance
   - Credit packs are pre-seeded

4. **Start development servers:**
```bash
npm run dev
```

This starts both the client (port 3000) and server (port 3001) concurrently.

## Environment Variables

### Root `.env`
```env
# Server Configuration
PORT=3001
CLIENT_URL=http://localhost:3000

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication (Clerk)
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# AI Processing (OpenAI)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Payment Processing (Stripe)
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Client `.env`
```env
# Client Environment Variables
VITE_APP_NAME=AEO Schema Generator
VITE_APP_URL=http://localhost:3000
VITE_API_URL=http://localhost:3001

# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Payment Processing (Stripe)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Testing Payment Flow

### Stripe Test Cards

Use these test card numbers in development:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

Use any future date for expiry, any 3-digit CVC, and any 5-digit ZIP code.

### Testing Steps

1. **Sign up for a new account** - You'll automatically get 2 free credits
2. **Generate a schema** - Use any valid URL to test the AI generation
3. **Check credit balance** - Navigate to Credits page to see balance decremented
4. **Purchase credits** - Use test card numbers to test payment flow
5. **Verify credit addition** - Credits should be added immediately after successful payment

## API Endpoints

### Schema Generation
- `POST /api/schema/generate` - Generate schema from URL
- `POST /api/schema/validate` - Validate JSON-LD schema
- `GET /api/schema/history` - Get generation history
- `GET /api/schema/stats` - Get user statistics

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/credits` - Get credit balance
- `GET /api/user/transactions` - Get credit transactions

### Payments
- `GET /api/payment/credit-packs` - Get available credit packs
- `POST /api/payment/create-intent` - Create Stripe payment intent
- `GET /api/payment/history` - Get payment history

### Webhooks
- `POST /webhooks/clerk` - Clerk user events
- `POST /webhooks/stripe` - Stripe payment events

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start both client and server
npm run dev:client       # Start client only
npm run dev:server       # Start server only

# Building
npm run build           # Build both client and server
npm run build:client    # Build client only
npm run build:server    # Build server only

# Type checking
npm run type-check      # Check types in all workspaces

# Linting
npm run lint           # Lint all workspaces
```

### Project Structure

```
├── client/             # React frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   └── utils/      # Utility functions
├── server/             # Express backend
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/ # Express middleware
│   │   ├── routes/     # API routes
│   │   └── services/   # Business logic
├── shared/             # Shared types and utilities
│   └── src/
│       ├── types/      # TypeScript types
│       └── schemas/    # Zod validation schemas
└── database/           # Database migrations and seeds
```

## Deployment

### Digital Ocean App Platform (Recommended)

This application is optimized for deployment on Digital Ocean App Platform.

#### Setup Steps

1. **Fork/Clone the Repository**
   ```bash
   git clone https://github.com/lightbulbmomentlabs/super-schema.git
   cd super-schema
   ```

2. **Create a New App** on Digital Ocean App Platform
   - Connect your GitHub repository: `https://github.com/lightbulbmomentlabs/super-schema`
   - Digital Ocean will automatically detect the monorepo structure

3. **Configure Build Settings**

   **Client (Web Service)**:
   - Build Command: `npm run build --workspace=client`
   - Output Directory: `client/dist`
   - HTTP Port: Auto-detected (default 8080)

   **Server (Web Service)**:
   - Build Command: `npm run build --workspace=server`
   - Run Command: `node server/dist/index.js`
   - HTTP Port: `8080` (use environment variable `PORT`)

4. **Add Environment Variables**

   Set these in the Digital Ocean App Platform dashboard for each service:

   **Server Environment Variables**:
   ```
   NODE_ENV=production
   PORT=${PORT}
   CLIENT_URL=https://your-client-url.ondigitalocean.app
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   OPENAI_API_KEY=your_openai_key
   STRIPE_SECRET_KEY=your_stripe_secret
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   REDIS_URL=redis://your-redis-host:6379
   ```

   **Client Environment Variables**:
   ```
   VITE_API_URL=https://your-server-url.ondigitalocean.app
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
   ```

5. **Set Up Redis**
   - Add a Redis managed database in Digital Ocean
   - Link it to your server component
   - Redis is required for BullMQ job queues

6. **Configure Webhooks**
   - **Clerk**: Set webhook URL to `https://your-server-url.ondigitalocean.app/webhooks/clerk`
   - **Stripe**: Set webhook URL to `https://your-server-url.ondigitalocean.app/webhooks/stripe`

7. **Database Migrations**
   - Run `database/deploy-all.sql` in your Supabase SQL Editor before deploying

8. **Deploy**
   - Push to your main branch to trigger automatic deployment
   - Digital Ocean will build and deploy both services

#### Important Notes for Production

- ✅ Port configuration is handled via `PORT` environment variable
- ✅ Build scripts are optimized for Digital Ocean
- ✅ Node.js version >=18.0.0 is specified in package.json
- ⚠️  Case-sensitive file systems: All imports use lowercase (Digital Ocean compatible)
- ⚠️  Ensure CORS origins are configured for your production domains
- 📊 Monitor logs in Digital Ocean dashboard for errors

### Alternative Deployment Options

- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render, Heroku
- **Database**: Supabase (managed PostgreSQL)

Make sure to:
1. Set all environment variables in production
2. Configure Clerk and Stripe webhooks with production URLs
3. Update CORS settings for production domain
4. Set up proper monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@aioschemagenerator.com or join our Discord community.