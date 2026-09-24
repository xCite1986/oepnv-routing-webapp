-- PostgreSQL + PostGIS Schema Definition (§20)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. transport Schema (GTFS statische Fahrplandaten)
CREATE SCHEMA IF NOT EXISTS transport;

CREATE TABLE IF NOT EXISTS transport.stop (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    platform_code VARCHAR(32),
    wheelchair_boarding INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_transport_stop_geom ON transport.stop USING GIST(geom);

CREATE TABLE IF NOT EXISTS transport.route (
    id VARCHAR(64) PRIMARY KEY,
    short_name VARCHAR(64) NOT NULL,
    long_name VARCHAR(255),
    route_type INT NOT NULL, -- 0=Tram, 1=Subway, 2=Rail, 3=Bus
    color VARCHAR(16),
    text_color VARCHAR(16)
);

CREATE TABLE IF NOT EXISTS transport.trip (
    id VARCHAR(128) PRIMARY KEY,
    route_id VARCHAR(64) REFERENCES transport.route(id),
    headsign VARCHAR(255),
    direction_id INT
);

-- 2. realtime Schema (GTFS-RT Livedaten)
CREATE SCHEMA IF NOT EXISTS realtime;

CREATE TABLE IF NOT EXISTS realtime.trip_update (
    id VARCHAR(128) PRIMARY KEY,
    trip_id VARCHAR(128) REFERENCES transport.trip(id),
    delay_seconds INT DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS realtime.stop_time_update (
    id SERIAL PRIMARY KEY,
    trip_id VARCHAR(128),
    stop_id VARCHAR(64) REFERENCES transport.stop(id),
    arrival_delay INT,
    departure_delay INT,
    schedule_relationship VARCHAR(32) DEFAULT 'SCHEDULED' -- SCHEDULED, SKIPPED, NO_DATA
);

CREATE TABLE IF NOT EXISTS realtime.vehicle_position (
    vehicle_id VARCHAR(64) PRIMARY KEY,
    trip_id VARCHAR(128),
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    geom GEOMETRY(Point, 4326),
    speed DOUBLE PRECISION,
    bearing DOUBLE PRECISION,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. incident Schema (Störungen & Baustellen)
CREATE SCHEMA IF NOT EXISTS incident;

CREATE TABLE IF NOT EXISTS incident.disruption (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(32) DEFAULT 'WARNING',
    affected_lines TEXT[],
    geom GEOMETRY(Geometry, 4326),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE
);

-- 4. routing Schema (Nutzeranfragen und berechnete Journeys)
CREATE SCHEMA IF NOT EXISTS routing;

CREATE TABLE IF NOT EXISTS routing.request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_label VARCHAR(255),
    origin_geom GEOMETRY(Point, 4326),
    destination_label VARCHAR(255),
    destination_geom GEOMETRY(Point, 4326),
    departure_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routing.journey (
    id VARCHAR(64) PRIMARY KEY,
    request_id UUID REFERENCES routing.request(id),
    recommended BOOLEAN DEFAULT FALSE,
    departure_time TIMESTAMP WITH TIME ZONE,
    arrival_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INT,
    transfer_count INT,
    walking_meters INT,
    explanation JSONB
);

CREATE TABLE IF NOT EXISTS routing.journey_leg (
    id VARCHAR(64) PRIMARY KEY,
    journey_id VARCHAR(64) REFERENCES routing.journey(id),
    leg_type VARCHAR(32),
    line_name VARCHAR(64),
    headsign VARCHAR(255),
    from_stop_name VARCHAR(255),
    to_stop_name VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INT
);

-- 5. analytics Schema (Historische Kennzahlen & Pünktlichkeit)
CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.delay_history (
    id SERIAL PRIMARY KEY,
    line_name VARCHAR(64),
    stop_id VARCHAR(64),
    delay_seconds INT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics.travel_time_history (
    id SERIAL PRIMARY KEY,
    origin_stop_id VARCHAR(64),
    dest_stop_id VARCHAR(64),
    scheduled_duration_sec INT,
    actual_duration_sec INT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
