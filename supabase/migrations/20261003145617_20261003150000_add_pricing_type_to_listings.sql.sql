-- Add pricing_type column to listings for per-hour / per-day pricing
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pricing_type text NOT NULL DEFAULT 'day' CHECK (pricing_type IN ('hour', 'day'));