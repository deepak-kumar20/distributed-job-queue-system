    CREATE TABLE IF NOT EXISTS jobs(
        id SERIAL PRIMARY KEY,
        job_id VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        priority INTEGER DEFAULT 0,
        data JSONB,
        results JSONB,
        error TEXT,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        failed_at TIMESTAMPTZ
    );
    
    CREATE INDEX idx_jobs_status ON jobs(status);
    CREATE INDEX idx_jobs_type ON jobs(type);
    CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);