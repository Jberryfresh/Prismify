# Prismify

> AI-powered SEO and content optimization platform with intelligent agents

[![GitHub](https://img.shields.io/github/license/Jberryfresh/Prismify)](https://github.com/Jberryfresh/Prismify/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Jberryfresh/Prismify/blob/main/CONTRIBUTING.md)

Prismify is an intelligent SEO optimization platform that leverages AI agents to automate content analysis, meta tag generation, keyword research, and content optimization. Built with a dual-provider AI architecture (Google Gemini + Anthropic Claude), Supabase backend, and modern Node.js architecture.

## 🚀 Features

- **🤖 AI-Powered SEO Agent**: Intelligent content analysis and optimization
- **📊 Meta Tag Generation**: Automated title, description, and OG tag creation
- **🔍 Keyword Research**: AI-driven keyword suggestions and optimization
- **📈 Content Scoring**: Real-time SEO scoring and recommendations
- **🎯 URL Slug Generation**: SEO-friendly URL slug creation
- **💾 Supabase Backend**: Scalable PostgreSQL database with real-time capabilities
- **🔄 Dual AI Provider**: Free Google Gemini + paid Claude (upgradeable)
- **🧩 Modular Agent Architecture**: Extensible base for specialized agents

## 📋 Quick Start

### Prerequisites

- Node.js 18+ 
- Supabase account
- Google AI Studio API key (free)
- Optional: Anthropic API key (paid)

### Installation

```bash
# Clone the repository
git clone https://github.com/Jberryfresh/Prismify.git
cd Prismify

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npm run migrate

# Verify database setup
npm run verify

# Test the SEO agent
npm run test:agent
```

### Environment Variables

Required variables in `.env`:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Provider (choose one or both)
GEMINI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_claude_api_key  # Optional

# Configuration
AI_PROVIDER=gemini  # or 'claude' or 'auto'
GEMINI_MODEL=gemini-2.0-flash-lite
```

See [`.env.example`](./.env.example) for all available options.

## 📚 Documentation

- [**Quick Start Guide**](./QUICK_START.md) - Get running in 5 minutes
- [**AI Setup Guide**](./docs/AI_SETUP_GUIDE.md) - Configure Google Gemini
- [**Supabase Setup**](./docs/SUPABASE_SETUP.md) - Database configuration
- [**Transition to Claude**](./docs/TRANSITION_TO_CLAUDE.md) - Upgrade to paid AI
- [**Contributing**](./CONTRIBUTING.md) - How to contribute
- [**Project TODO**](./.agents/PROJECT_TODO.md) - Development roadmap
- [**Setup Complete**](./docs/SETUP_COMPLETE.md) - System overview

## 🛠️ Development

### Available Scripts

```bash
npm run test:db       # Test database connectivity
npm run test:agent    # Test SEO agent functionality
npm run migrate       # Run database migrations
npm run verify        # Verify database tables
```

### Project Structure

```
Prismify/
├── .agents/              # Agent configuration and TODO
├── .github/              # GitHub templates and workflows
├── docs/                 # Documentation
├── scripts/              # Utility scripts (migrations, tests)
├── src/
│   ├── agents/           # AI agents
│   │   ├── base/         # Base agent class
│   │   └── specialized/  # SEO, Crawler, Writer agents
│   ├── config/           # Configuration
│   └── services/         # Core services
│       └── ai/           # AI provider services
├── supabase/             # Database schema and migrations
├── .env.example          # Environment template
├── package.json          # Dependencies
└── README.md             # This file
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Development workflow
- Branch and commit guidelines
- Pull request process
- Testing requirements

### Development Workflow

1. Check [`.agents/PROJECT_TODO.md`](./.agents/PROJECT_TODO.md) for available tasks
2. Create feature branch: `phase-X.Y-description`
3. Make changes with clear commits: `[PHASE-X.Y] Description - P{0|1|2}`
4. Submit PR using the provided template
5. Update TODO with progress

## 🏗️ Architecture

### AI Provider Strategy

Prismify uses a **dual-provider architecture**:

1. **Free Bootstrap** (Google Gemini): Zero-cost AI for MVP and development
2. **Production Upgrade** (Anthropic Claude): Higher quality for paying customers
3. **Zero-Code Transition**: Switch providers via environment variable

### Agent Framework

- **Base Agent**: Core orchestration and lifecycle management
- **SEO Agent**: Content analysis, meta generation, keyword research
- **Future Agents**: Crawler, Writer, Analytics (see TODO)

### Database Schema

7 core tables managed via Supabase:

- `users` - User accounts and profiles
- `api_keys` - API key management
- `seo_projects` - SEO project tracking
- `seo_analyses` - Analysis results
- `meta_tags` - Generated meta tags
- `api_usage` - Usage tracking and quotas
- `subscription_history` - Billing and subscriptions

## 📦 Tech Stack

- **Runtime**: Node.js 18+ (ESM modules)
- **Database**: Supabase (PostgreSQL)
- **AI Providers**: 
  - Google Gemini (`@google/generative-ai`)
  - Anthropic Claude (`@anthropic-ai/sdk`)
- **Key Packages**: 
  - `@supabase/supabase-js`
  - `dotenv`

## 🔐 Security

- Secrets managed via `.env` (never committed)
- JWT-based authentication (in progress)
- Rate limiting and quotas per user
- Service role keys for migrations only

## 📈 Roadmap

See [`.agents/PROJECT_TODO.md`](./.agents/PROJECT_TODO.md) for detailed roadmap.

**Phase 1**: Foundation & local development ✅  
**Phase 2**: Core backend & AI services (in progress)  
**Phase 3**: Specialized agents & features  
**Phase 4**: Frontend & UX  
**Phase 5**: QA, security & performance  
**Phase 6**: Launch & operations  

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Google AI Studio for free Gemini access
- Anthropic for Claude API
- Supabase for backend infrastructure
- The open-source community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Jberryfresh/Prismify/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Jberryfresh/Prismify/discussions)
- **Documentation**: [docs/](./docs/)

---

**Built with ❤️ by [Jberryfresh](https://github.com/Jberryfresh)**

*Prismify - Where AI meets SEO excellence*
