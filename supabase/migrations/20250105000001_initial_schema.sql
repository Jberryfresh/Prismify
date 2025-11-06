-- =============================================================================
-- PRISMIFY DATABASE SCHEMA - Initial Migration
-- =============================================================================
-- Migration: 20250105000001_initial_schema.sql
-- Description: Create all tables, indexes, and security policies for Prismify

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS api_keys (
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
CREATE TABLE IF NOT EXISTS seo_projects (
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
CREATE TABLE IF NOT EXISTS seo_analyses (
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
CREATE TABLE IF NOT EXISTS meta_tags (
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
CREATE TABLE IF NOT EXISTS api_usage (
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
CREATE TABLE IF NOT EXISTS subscription_history (
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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_seo_projects_user ON seo_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_analyses_user ON seo_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_analyses_project ON seo_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_meta_tags_user ON meta_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(date);

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
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for seo_projects table
DROP TRIGGER IF EXISTS update_seo_projects_updated_at ON seo_projects;
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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- API keys policies
DROP POLICY IF EXISTS "Users can view own API keys" ON api_keys;
CREATE POLICY "Users can view own API keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own API keys" ON api_keys;
CREATE POLICY "Users can create own API keys" ON api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own API keys" ON api_keys;
CREATE POLICY "Users can delete own API keys" ON api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- SEO projects policies
DROP POLICY IF EXISTS "Users can view own projects" ON seo_projects;
CREATE POLICY "Users can view own projects" ON seo_projects
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create projects" ON seo_projects;
CREATE POLICY "Users can create projects" ON seo_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON seo_projects;
CREATE POLICY "Users can update own projects" ON seo_projects
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON seo_projects;
CREATE POLICY "Users can delete own projects" ON seo_projects
    FOR DELETE USING (auth.uid() = user_id);

-- SEO analyses policies
DROP POLICY IF EXISTS "Users can view own analyses" ON seo_analyses;
CREATE POLICY "Users can view own analyses" ON seo_analyses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create analyses" ON seo_analyses;
CREATE POLICY "Users can create analyses" ON seo_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Meta tags policies
DROP POLICY IF EXISTS "Users can view own meta tags" ON meta_tags;
CREATE POLICY "Users can view own meta tags" ON meta_tags
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create meta tags" ON meta_tags;
CREATE POLICY "Users can create meta tags" ON meta_tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- API usage policies
DROP POLICY IF EXISTS "Users can view own usage" ON api_usage;
CREATE POLICY "Users can view own usage" ON api_usage
    FOR SELECT USING (auth.uid() = user_id);
