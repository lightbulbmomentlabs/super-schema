-- Insert predefined credit packs
INSERT INTO credit_packs (id, name, credits, price_in_cents, savings, is_popular, is_active) VALUES
    (uuid_generate_v4(), 'Starter Pack', 20, 999, NULL, false, true),
    (uuid_generate_v4(), 'Professional Pack', 50, 1999, 20, true, true),
    (uuid_generate_v4(), 'Business Pack', 100, 3499, 30, false, true),
    (uuid_generate_v4(), 'Agency Pack', 250, 7499, 40, false, true),
    (uuid_generate_v4(), 'Enterprise Pack', 500, 12499, 50, false, true);

-- Update credit pack IDs for easier reference (optional, can be removed in production)
-- This creates predictable UUIDs for development/testing
UPDATE credit_packs SET id = 'a0000000-0000-0000-0000-000000000001' WHERE name = 'Starter Pack';
UPDATE credit_packs SET id = 'a0000000-0000-0000-0000-000000000002' WHERE name = 'Professional Pack';
UPDATE credit_packs SET id = 'a0000000-0000-0000-0000-000000000003' WHERE name = 'Business Pack';
UPDATE credit_packs SET id = 'a0000000-0000-0000-0000-000000000004' WHERE name = 'Agency Pack';
UPDATE credit_packs SET id = 'a0000000-0000-0000-0000-000000000005' WHERE name = 'Enterprise Pack';