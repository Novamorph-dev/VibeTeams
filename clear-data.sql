-- Clear all participants and teams
-- Run this in the Neon SQL Editor

-- Must clear users first (foreign key references teams)
DELETE FROM users;
DELETE FROM teams;

-- Reset auto-increment sequences so IDs start from 1 again
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE teams_id_seq RESTART WITH 1;
