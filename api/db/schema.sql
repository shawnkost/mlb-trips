CREATE TABLE IF NOT EXISTS parks (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    team          TEXT NOT NULL,
    city          TEXT NOT NULL,
    state         TEXT NOT NULL,
    latitude      NUMERIC(9,6) NOT NULL,
    longitude     NUMERIC(9,6) NOT NULL
);

CREATE TABLE IF NOT EXISTS visits (
    id          SERIAL PRIMARY KEY,
    park_id     INT NOT NULL REFERENCES parks(id),
    visit_date  DATE NOT NULL,
    rating      INT CHECK (rating BETWEEN 1 AND 5),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
