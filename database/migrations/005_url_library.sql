-- Migration 005: URL Library System
-- Enables persistent storage of discovered URLs and user domains

-- Create user_domains table
CREATE TABLE user_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    last_crawled_at TIMESTAMP WITH TIME ZONE,
    total_urls_discovered INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, domain)
);

-- Create discovered_urls table
CREATE TABLE discovered_urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES user_domains(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    depth INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT false,
    has_schema BOOLEAN DEFAULT false,
    last_schema_generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, url)
);

-- Add discovered_url_id to schema_generations for relationship tracking
ALTER TABLE schema_generations
ADD COLUMN discovered_url_id UUID REFERENCES discovered_urls(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_user_domains_user_id ON user_domains(user_id);
CREATE INDEX idx_user_domains_domain ON user_domains(domain);
CREATE INDEX idx_user_domains_created_at ON user_domains(created_at);

CREATE INDEX idx_discovered_urls_user_id ON discovered_urls(user_id);
CREATE INDEX idx_discovered_urls_domain_id ON discovered_urls(domain_id);
CREATE INDEX idx_discovered_urls_url ON discovered_urls(url);
CREATE INDEX idx_discovered_urls_has_schema ON discovered_urls(has_schema);
CREATE INDEX idx_discovered_urls_is_hidden ON discovered_urls(is_hidden);
CREATE INDEX idx_discovered_urls_created_at ON discovered_urls(created_at);

CREATE INDEX idx_schema_generations_discovered_url_id ON schema_generations(discovered_url_id);

-- Add updated_at triggers
CREATE TRIGGER update_user_domains_updated_at BEFORE UPDATE ON user_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discovered_urls_updated_at BEFORE UPDATE ON discovered_urls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update has_schema flag when schema is generated
CREATE OR REPLACE FUNCTION update_url_schema_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'success' AND NEW.discovered_url_id IS NOT NULL THEN
        UPDATE discovered_urls
        SET has_schema = true,
            last_schema_generated_at = NOW()
        WHERE id = NEW.discovered_url_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schema_generation_updates_url_status
    AFTER INSERT OR UPDATE ON schema_generations
    FOR EACH ROW
    WHEN (NEW.discovered_url_id IS NOT NULL)
    EXECUTE FUNCTION update_url_schema_status();
