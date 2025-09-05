

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "gen_random_uuid";

-- Session storage table (mandatory for Replit Auth)
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IDX_session_expire ON sessions (expire);

-- User storage table (mandatory for Replit Auth)
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  role VARCHAR CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Employees table for additional employee data
CREATE TABLE employees (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  employee_id VARCHAR UNIQUE,
  department VARCHAR,
  position VARCHAR,
  phone VARCHAR,
  address TEXT,
  joining_date TIMESTAMP,
  salary DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  company VARCHAR,
  position VARCHAR,
  source VARCHAR,
  status VARCHAR CHECK (status IN ('NEW', 'CONTACTED', 'FOLLOW_UP', 'NOT_INTERESTED', 'CONVERTED')) DEFAULT 'NEW',
  assigned_to VARCHAR REFERENCES users(id),
  notes TEXT,
  value DECIMAL(10, 2),
  expected_close_date TIMESTAMP,
  last_contact_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMP NOT NULL,
  punch_in TIMESTAMP,
  punch_out TIMESTAMP,
  punch_in_location JSONB,
  punch_out_location JSONB,
  total_hours DECIMAL(4, 2),
  status VARCHAR CHECK (status IN ('present', 'absent', 'late', 'half_day')) DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activity_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR,
  details JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Insert some sample data (optional)
INSERT INTO users (id, email, first_name, last_name, role) 
VALUES ('sample-user-id', 'admin@example.com', 'Admin', 'User', 'admin')
ON CONFLICT (email) DO NOTHING;
