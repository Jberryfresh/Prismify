# 🗄️ Supabase Setup Guide for Prismify

## Step 1: Create FREE Supabase Account

1. **Go to**: https://supabase.com
2. **Click**: "Start your project"
3. **Sign in with**: GitHub (recommended) or email
4. **No credit card required** - FREE tier includes:
   - 500 MB database storage
   - 1 GB file storage
   - 2 GB bandwidth
   - 50,000 monthly active users
   - Perfect for MVP!

---

## Step 2: Create New Project

1. **Click**: "New Project" button
2. **Fill in**:
   ```
   Name: Prismify
   Database Password: [SAVE THIS - you'll need it!]
   Region: Choose closest to you (e.g., US East, EU West)
   Pricing Plan: Free
   ```
3. **Click**: "Create new project"
4. **Wait**: 2-3 minutes for database provisioning

---

## Step 3: Get Your Database Credentials

### Option A: Connection String (Easiest)

1. **Go to**: Project Settings (gear icon) > Database
2. **Find**: "Connection string" section
3. **Copy**: URI format
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
4. **Replace `[YOUR-PASSWORD]`** with the password you created

### Option B: Individual Settings

1. **Go to**: Project Settings > Database
2. **Copy these values**:
   ```
   Host: db.[YOUR-PROJECT-REF].supabase.co
   Database name: postgres
   Port: 5432
   User: postgres
   Password: [your-password]
   ```

---

## Step 4: Get Your API Keys

1. **Go to**: Project Settings (gear icon) > API
2. **Copy these 2 keys**:
   - **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (different long string)

⚠️ **IMPORTANT**: 
- `anon` key is safe for frontend
- `service_role` key is SECRET - only use in backend!

---

## Step 5: Update Your `.env` File

Open `c:\Prismify\.env` and replace these lines:

```bash
# Replace [YOUR-PROJECT-REF] with your actual project reference
# Replace [YOUR-PASSWORD] with your database password

DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-service-role-key

DB_HOST=db.[YOUR-PROJECT-REF].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password-here
DB_SSL=true
```

### Example (with fake values):
```bash
DATABASE_URL=postgresql://postgres:MySecurePass123!@db.xyzabc123.supabase.co:5432/postgres
SUPABASE_URL=https://xyzabc123.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg5MDAwMDAwLCJleHAiOjIwMDQ1NzYwMDB9.fake_signature
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2ODkwMDAwMDAsImV4cCI6MjAwNDU3NjAwMH0.fake_signature

DB_HOST=db.xyzabc123.supabase.co
DB_PASSWORD=MySecurePass123!
```

---

## Step 6: Create Database Tables

### Option A: Using Supabase SQL Editor (Easiest)

1. **Go to**: SQL Editor in Supabase dashboard
2. **Click**: "New query"
3. **Paste this SQL**:

```sql
-- =============================================================================
-- PRISMIFY DATABASE SCHEMA
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'starter',
    subscription_status VARCHAR(50) DEFAULT 'active',
    stripe_customer_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- =============================================================================
-- API KEYS TABLE (for user API access)
-- =============================================================================
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- =============================================================================
-- SEO PROJECTS TABLE
-- =============================================================================
CREATE TABLE seo_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    website_url VARCHAR(500),
    target_keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- =============================================================================
-- SEO ANALYSIS RESULTS TABLE
-- =============================================================================
CREATE TABLE seo_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
    content_url VARCHAR(500),
    content_text TEXT,
    analysis_type VARCHAR(50) NOT NULL,
    results JSONB NOT NULL,
    seo_score INTEGER,
    keyword_density JSONB,
    readability_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_provider VARCHAR(50)
);

-- =============================================================================
-- GENERATED META TAGS TABLE
-- =============================================================================
CREATE TABLE meta_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    keywords TEXT[],
    og_title VARCHAR(255),
    og_description TEXT,
    og_image VARCHAR(500),
    twitter_card VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_provider VARCHAR(50)
);

-- =============================================================================
-- API USAGE TRACKING TABLE
-- =============================================================================
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    ai_provider VARCHAR(50),
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE DEFAULT CURRENT_DATE
);

-- =============================================================================
-- SUBSCRIPTION HISTORY TABLE
-- =============================================================================
CREATE TABLE subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_tier VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id VARCHAR(255),
    amount_cents INTEGER,
    currency VARCHAR(3) DEFAULT 'USD'
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX idx_seo_projects_user ON seo_projects(user_id);
CREATE INDEX idx_seo_analyses_user ON seo_analyses(user_id);
CREATE INDEX idx_seo_analyses_project ON seo_analyses(project_id);
CREATE INDEX idx_meta_tags_user ON meta_tags(user_id);
CREATE INDEX idx_api_usage_user ON api_usage(user_id);
CREATE INDEX idx_api_usage_date ON api_usage(date);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- API keys policies
CREATE POLICY "Users can view own API keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys" ON api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- SEO projects policies
CREATE POLICY "Users can view own projects" ON seo_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects" ON seo_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON seo_projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON seo_projects
    FOR DELETE USING (auth.uid() = user_id);

-- SEO analyses policies
CREATE POLICY "Users can view own analyses" ON seo_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create analyses" ON seo_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Meta tags policies
CREATE POLICY "Users can view own meta tags" ON meta_tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create meta tags" ON meta_tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- API usage policies
CREATE POLICY "Users can view own usage" ON api_usage
    FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for seo_projects table
CREATE TRIGGER update_seo_projects_updated_at
    BEFORE UPDATE ON seo_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get daily usage count
CREATE OR REPLACE FUNCTION get_daily_usage_count(p_user_id UUID, p_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM api_usage
        WHERE user_id = p_user_id
        AND date = p_date
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INITIAL DATA (Optional test user)
-- =============================================================================
-- Uncomment to create a test user
-- INSERT INTO users (email, password_hash, full_name, subscription_tier)
-- VALUES ('test@prismify.com', 'hashed_password_here', 'Test User', 'professional');
```

4. **Click**: "Run" (bottom right)
5. **Check**: "Success" message appears

---

## Step 7: Install Supabase Client Library

```powershell
cd c:\Prismify
npm install @supabase/supabase-js
```

---

## Step 8: Test Your Connection

Create a test script:

```powershell
# This will create a test file
node -e "console.log('Testing Supabase connection...')"
```

Or use this test script I can create for you!

---

## Step 9: Verify Everything Works

Run this quick test:

```powershell
node -e "require('dotenv').config(); console.log('Database URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing'); console.log('Supabase URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing');"
```

---

## 🎯 What You Get

✅ **Free PostgreSQL Database** (500 MB storage)
✅ **Auto-generated REST API** (instant CRUD operations)
✅ **Realtime subscriptions** (WebSocket support)
✅ **Row Level Security** (data isolation per user)
✅ **Built-in authentication** (if you want to use it)
✅ **File storage** (1 GB for user uploads)
✅ **Database backups** (automatic daily backups)

---

## 📊 Database Structure Created

```
users                    → User accounts & subscriptions
  ├── api_keys          → API keys for customers
  ├── seo_projects      → Customer SEO projects
  ├── seo_analyses      → Analysis results
  ├── meta_tags         → Generated meta tags
  ├── api_usage         → Usage tracking
  └── subscription_history → Billing history
```

---

## 🔐 Security Features Enabled

✅ Row Level Security (RLS) - Users only see their data
✅ API keys with expiration
✅ SSL/TLS encryption
✅ Password hashing ready
✅ JWT token authentication

---

## 💡 Pro Tips

1. **Connection Pooling**: Use `pooler.supabase.com:6543` for serverless (Vercel)
2. **Direct Connection**: Use `db.supabase.co:5432` for long-running servers
3. **Backups**: Automatic daily backups on FREE tier
4. **Monitoring**: Check Database → Logs for query performance
5. **Upgrade**: If you exceed limits, Supabase Pro is $25/month

---

## 🆘 Troubleshooting

### "Connection refused"
- Check your firewall settings
- Verify password is correct
- Confirm project is fully provisioned (wait 3-5 min)

### "Invalid API key"
- Make sure you copied the full key (they're very long!)
- Check for extra spaces in `.env` file
- Verify project URL matches

### "Table does not exist"
- Run the SQL schema from Step 6
- Check SQL Editor for error messages

---

## 🚀 Next Steps

1. ✅ Create Supabase project
2. ✅ Run database schema SQL
3. ✅ Update `.env` file
4. ✅ Install `@supabase/supabase-js`
5. 🔲 Test SEO Agent with database
6. 🔲 Build API endpoints
7. 🔲 Deploy to production!

---

**Need help?** Check the Supabase docs: https://supabase.com/docs
