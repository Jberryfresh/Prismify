# 🚀 Prismify AI Setup Guide

## Overview

Prismify uses a **dual AI architecture** that allows you to:
- ✅ Start with **FREE Google Gemini** (15 requests/minute)
- ✅ Switch to **PAID Claude AI** when you have funding
- ✅ **Zero code changes** needed to transition between providers

---

## 🎯 Current Setup (Bootstrap Mode)

### Using Google Gemini (FREE)

**Why Gemini?**
- ✨ **100% FREE** to get started
- ⚡ 15 requests per minute (plenty for MVP testing)
- 🎓 Perfect for beta testing and first customers
- 💰 Zero upfront costs - bootstrap friendly!

### Get Your FREE Gemini API Key

1. **Visit**: https://aistudio.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click** "Create API Key"
4. **Copy** the key
5. **Paste** into `.env` file:

```bash
GEMINI_API_KEY=your-actual-key-here
AI_PROVIDER=gemini
```

---

## 💎 Future Setup (When You Have Funding)

### Upgrading to Claude AI (PAID)

**Why Claude for Production?**
- 🏆 **Best-in-class** SEO content generation
- 📝 Superior meta tag quality
- 🎯 More accurate keyword suggestions
- 💰 Cost: ~$3 per 1M tokens (very affordable at scale)

### Get Your Claude API Key (When Ready)

1. **Visit**: https://console.anthropic.com/settings/keys
2. **Create account** (requires payment method)
3. **Generate** API key
4. **Update** `.env` file:

```bash
ANTHROPIC_API_KEY=your-claude-key-here
AI_PROVIDER=anthropic
```

**That's it!** No code changes needed - the system automatically switches.

---

## 🔄 How the Dual System Works

### Architecture

```
SEOAgent.js
    ↓
unifiedAIService.js  ← Smart Router
    ↓
    ├── geminiService.js (FREE - Active Now)
    └── claudeService.js (PAID - Ready When You Are)
```

### Smart Features

1. **Auto-Detection**: Checks which AI providers are configured
2. **Automatic Fallback**: If primary fails, tries backup
3. **Rate Limiting**: Respects free tier limits automatically
4. **Zero Downtime**: Switch providers without restarting

---

## 📊 Cost Comparison

| Provider | Cost | Speed | Quality | Best For |
|----------|------|-------|---------|----------|
| **Gemini** (Current) | **FREE** | Fast | Good | MVP, Testing, Bootstrap |
| **Claude** (Future) | $3/1M tokens | Fast | Excellent | Production, Scale |

### Estimated Costs at Scale

**With Gemini (FREE):**
- First 1,000 customers: $0/month
- Rate limited to 15 requests/minute
- Perfect for validation phase

**With Claude (When Ready):**
- 10,000 API calls/month: ~$30/month
- 100,000 API calls/month: ~$300/month
- Unlimited rate (within reason)

---

## ⚡ Quick Start Commands

### 1. Install Dependencies

```powershell
cd c:\Prismify
npm install @google/generative-ai @anthropic-ai/sdk
```

### 2. Configure Environment

Edit `.env` file and add your Gemini API key:

```bash
GEMINI_API_KEY=your-key-here
AI_PROVIDER=gemini
```

### 3. Test the Setup

```javascript
import unifiedAIService from './src/services/ai/unifiedAIService.js';

// Initialize
await unifiedAIService.initialize();

// Test
const result = await unifiedAIService.generateText({
  prompt: "Generate 3 SEO keywords for a digital marketing blog",
  maxTokens: 100
});

console.log(result.text);
```

---

## 🛠️ Troubleshooting

### "No AI providers available"

**Solution**: Check your `.env` file has `GEMINI_API_KEY` set

### "Rate limit exceeded"

**Solution**: You're hitting the 15 req/min free limit. Options:
1. Add delays between requests
2. Upgrade to paid Gemini ($0.075/1M tokens)
3. Switch to Claude when funded

### "API key invalid"

**Solution**: 
1. Verify key at https://aistudio.google.com/app/apikey
2. Make sure there are no spaces in the key
3. Restart your application

---

## 🎯 Revenue Milestone Plan

### Phase 1: Bootstrap (Current)
- **AI**: Gemini (FREE)
- **Revenue**: $0 - $5,000 MRR
- **Users**: 0 - 100 customers
- **Cost**: $0/month

### Phase 2: Growth
- **AI**: Gemini (FREE) or Paid Gemini ($0.075/1M tokens)
- **Revenue**: $5,000 - $25,000 MRR
- **Users**: 100 - 500 customers
- **Cost**: $0 - $100/month

### Phase 3: Scale
- **AI**: Claude ($3/1M tokens)
- **Revenue**: $25,000+ MRR
- **Users**: 500+ customers
- **Cost**: $300 - $1,000/month
- **Profit Margin**: Still 90%+ 🚀

---

## 🔑 Key Files

```
c:\Prismify\
├── .env                                    ← Your API keys here
├── src/
│   ├── config/index.js                     ← Config loader
│   ├── services/ai/
│   │   ├── geminiService.js                ← FREE (Active)
│   │   ├── claudeService.js                ← PAID (Ready)
│   │   └── unifiedAIService.js             ← Smart Router
│   └── agents/specialized/
│       └── SEOAgent.js                     ← Modified to use unified service
└── docs/AI_SETUP_GUIDE.md                  ← This file
```

---

## 🎉 Summary

You now have a **production-ready SEO AI system** that:

✅ Costs **$0 to start** (Gemini free tier)  
✅ Handles **15 requests/minute** (perfect for MVP)  
✅ Switches to **premium Claude** with ONE line change  
✅ Zero downtime during transition  
✅ Battle-tested from DigitalTide  

**Get your free Gemini API key now and start building!** 🚀

---

## 📞 Next Steps

1. Get Gemini API key: https://aistudio.google.com/app/apikey
2. Update `.env` file with your key
3. Run `npm install @google/generative-ai`
4. Test the SEO Agent
5. Start onboarding your first customers!

When you hit $5K MRR, you can upgrade to Claude for even better results. But for now, **Gemini is perfect** for validating your business! 💪
