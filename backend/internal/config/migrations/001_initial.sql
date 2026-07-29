CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL CHECK (type IN ('limit', 'streak', 'accumulate')),
    target_value DOUBLE PRECISION NOT NULL CHECK (target_value > 0),
    current_value DOUBLE PRECISION NOT NULL DEFAULT 0,
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'none')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals (user_id);

CREATE TABLE IF NOT EXISTS checkins (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    value DOUBLE PRECISION NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS checkins_goal_id_timestamp_idx
    ON checkins (goal_id, timestamp DESC);
