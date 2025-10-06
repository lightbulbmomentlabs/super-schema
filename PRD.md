# AEO Schema Generator - Product Requirements Document

## 1. Executive Summary

### Product Vision
The AEO Schema Generator is a SaaS web application that automatically generates optimized JSON-LD schema markup for websites to improve their visibility in AI-powered search results and traditional SEO.

### Core Value Proposition
- **For Website Owners/SEO Professionals**: Eliminate the complexity of manually creating schema markup
- **Problem Solved**: Most websites lack proper structured data, missing opportunities in AI search optimization
- **Solution**: Automated, AI-powered schema generation with one-click implementation

## 2. Product Overview

### Target Users
- **Primary**: SEO professionals, digital marketers, web developers
- **Secondary**: Small business owners, content creators, e-commerce managers
- **Tertiary**: Agencies managing multiple client websites

### Core Features
1. **URL Analysis & Schema Generation**
   - Input URL for analysis with validation
   - Fetch and parse page content using Puppeteer (handles JavaScript-rendered content)
   - AI-powered intelligent schema type detection using GPT-4 Mini
   - Generate multiple schema types when beneficial for AEO optimization
   - **Real-time Schema Validation**: Live validation as users edit schemas
   - **Intuitive Schema Editor**: User-friendly JSON editor with syntax highlighting and guided editing for non-technical users
   - Generate valid schema.org JSON-LD markup
   - **Error Handling**: Robust error handling with clear user messaging, credit protection until successful generation

2. **User Management**
   - Account creation and authentication via Clerk
   - Credit-based usage system with Google Analytics tracking
   - Minimal data storage (no schema history storage)

3. **Credit System**
   - 2 free credits on signup
   - Purchasable credit packs: 20, 50, 100, 250, 500
   - **Credit Protection**: Credits only consumed on successful schema generation
   - Stripe integration for secure payments

## 3. Technical Requirements

### Architecture
- **Frontend**: React (responsive design)
- **Backend**: Node.js/Express
- **Authentication**: Clerk
- **Database**: Supabase (user data, credit tracking, usage history)
- **Payments**: Stripe
- **AI Processing**: OpenAI API
- **Hosting**: Digital Ocean (App Platform or Droplets)

### Key Integrations
- OpenAI API for content analysis and schema generation
- Web scraping service for page content extraction
- Stripe for payment processing
- Clerk for user authentication

### Data Storage Requirements
- User profiles and authentication data
- Credit balances and transaction history
- Usage analytics and metrics (minimal)
- **No storage of generated schemas** (keeping application lightweight)

## 4. User Experience Flow

### Onboarding
1. User visits landing page
2. Sign up with email/social login (Clerk)
3. Email verification and welcome flow
4. 2 free credits automatically added
5. Quick tutorial/demo of schema generation

### Core Workflow
1. User enters website URL
2. **URL Validation**: System validates URL format and accessibility
3. **Content Extraction**: Puppeteer fetches rendered HTML content (handles SPAs and JavaScript)
4. **AI Analysis**: GPT-4 Mini analyzes content and intelligently determines optimal schema type(s)
5. **Schema Generation**: System generates multiple schemas if beneficial for AEO optimization
6. **Real-time Validation**: Schemas are validated in real-time as user reviews/edits
7. **User Review & Edit**: Intuitive editor allows non-technical users to modify schemas easily
8. **Credit Consumption**: User confirms generation (costs 1 credit per URL, only charged on success)
9. **Output**: Final validated JSON-LD displayed with copy-to-clipboard functionality
10. **Implementation Guide**: Clear instructions for adding schemas to website &lt;head&gt; section

### Credit Management
1. Credit balance visible in dashboard
2. Low credit warnings (< 5 credits)
3. Seamless credit purchase flow
4. Credit usage history tracking

## 5. Monetization Strategy

### Pricing Structure (Suggested)
- **Starter Pack (20 credits)**: $9.99 ($0.50/credit)
- **Professional Pack (50 credits)**: $19.99 ($0.40/credit) - 20% savings
- **Business Pack (100 credits)**: $34.99 ($0.35/credit) - 30% savings  
- **Agency Pack (250 credits)**: $74.99 ($0.30/credit) - 40% savings
- **Enterprise Pack (500 credits)**: $124.99 ($0.25/credit) - 50% savings

### Revenue Projections
[This section would need market research to estimate conversion rates and user acquisition]

## 6. SEO & Growth Strategy

### Domain Strategy
- **Primary**: aioschemagenerator.com
- **Secondary**: freeschemagenerator.com (redirect or separate landing page)

### Content Marketing
- Blog section with articles on:
  - Schema markup best practices
  - AI search optimization guides
  - Case studies and success stories
  - Technical SEO tutorials

### Target Keywords
- Primary: "AEO schema generator", "AI schema generator"
- Secondary: "JSON-LD generator", "schema markup tool"
- Long-tail: "how to add schema markup", "structured data generator"

## 7. Success Metrics

### Key Performance Indicators
- **User Acquisition**: New signups per month
- **Conversion Rate**: Free-to-paid user conversion
- **Revenue Metrics**: MRR, average revenue per user
- **Product Usage**: Schemas generated per user, credit consumption patterns
- **Retention**: Monthly/annual user retention rates

### Technical Metrics
- Page load speed (<3 seconds)
- Schema generation accuracy rate
- API uptime (99.9% target)
- User satisfaction score

## 8. Risk Assessment

### Technical Risks
- **OpenAI API**: Rate limits and costs (mitigated by GPT-4 Mini cost efficiency)
- **Web Scraping**: Site blocking or anti-bot measures (Puppeteer handles most cases)
- **Schema Accuracy**: AI-generated schema validation (real-time validation mitigates)
- **Digital Ocean**: App Platform limitations for web scraping workloads

### Business Risks
- Market competition from existing schema tools
- User acquisition costs vs. lifetime value
- Credit pricing model validation

### Mitigation Strategies
- **Caching**: Implement intelligent caching for repeated URLs
- **Fallback Strategies**: Multiple approaches for difficult-to-scrape sites
- **A/B Testing**: Pricing and user experience optimization
- **Strong SEO Foundation**: Organic growth through optimized content
- **Rate Limiting**: Smart OpenAI API usage to control costs

## 9. Implementation-Ready Technical Specifications

### Environment Setup
- **Development**: Local development environment
- **Production**: Digital Ocean App Platform with GitHub Actions deployment
- **Database**: Supabase with environment-specific configs
- **API Keys**: Environment variables for OpenAI, Stripe, Clerk

### Schema Editor Design (Non-Technical User Friendly)
- **Visual JSON Editor**: Syntax highlighting with collapsible sections
- **Field Labels**: Human-readable labels for schema properties
- **Validation Indicators**: Real-time green/red indicators for valid/invalid fields
- **Auto-completion**: Common schema values and structure suggestions
- **Preview Mode**: Side-by-side JSON and human-readable preview

### Error Handling Strategy
- **URL Validation**: Pre-flight checks before credit consumption
- **Scraping Failures**: Clear error messages with suggested fixes
- **AI Processing**: Retry logic with user notification
- **Credit Protection**: Transactions only complete on successful schema generation
- **User Communication**: Toast notifications and detailed error descriptions

### OpenAI Integration Details
- **Model**: GPT-4 Mini for cost efficiency and performance
- **Rate Limiting**: Built-in exponential backoff and queue management
- **Prompt Engineering**: Specialized prompts for schema detection and generation
- **Cost Optimization**: Intelligent content summarization before API calls

### Performance Considerations
- **Puppeteer Optimization**: Lightweight browser instances with resource blocking
- **Caching Strategy**: Redis or in-memory caching for repeated URL analysis
- **API Response Times**: Target <30 seconds for complete schema generation
- **Concurrent Processing**: Queue system for handling multiple user requests

## 10. Ready for Development

This PRD is now comprehensive and implementation-ready for Claude Code development. All major technical decisions have been made:

✅ **Architecture Defined**: Digital Ocean App Platform + Supabase + Puppeteer + GPT-4 Mini
✅ **User Experience Mapped**: Complete workflow with error handling
✅ **Technical Specifications**: Detailed implementation requirements
✅ **Business Model Clarified**: Credit system with success-based consumption
✅ **Development Phases**: Clear MVP to growth roadmap

### Immediate Next Steps for Claude Code:
1. **Project Initialization**: Set up React + Node.js project structure
2. **Core Infrastructure**: Implement Puppeteer web scraping foundation
3. **AI Integration**: Develop OpenAI GPT-4 Mini integration with schema-specific prompts
4. **Schema Editor**: Build intuitive JSON editor component for non-technical users
5. **Authentication Flow**: Integrate Clerk with credit system

## 11. Next Steps
1. Validate pricing strategy with target market research
2. Create detailed technical architecture document
3. Design wireframes and user interface mockups
4. Set up development environment and initial project structure
5. Begin MVP development with core URL processing functionality