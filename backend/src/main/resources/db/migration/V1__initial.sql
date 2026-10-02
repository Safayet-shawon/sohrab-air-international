CREATE TABLE staff_members (
  id uuid PRIMARY KEY, login_id varchar(80) NOT NULL UNIQUE,
  password_hash varchar(100) NOT NULL, name varchar(120) NOT NULL,
  role varchar(20) NOT NULL CHECK (role IN ('owner','manager')),
  active boolean NOT NULL DEFAULT true,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE admin_sessions (
  token_hash varchar(64) PRIMARY KEY, staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX idx_sessions_expires ON admin_sessions(expires_at);
CREATE TABLE packages (
  id uuid PRIMARY KEY, category varchar(20) NOT NULL CHECK (category IN ('hajj','umrah')),
  name_bn varchar(120) NOT NULL, name_en varchar(120) NOT NULL,
  description_bn text NOT NULL DEFAULT '', description_en text NOT NULL DEFAULT '',
  price bigint NOT NULL DEFAULT 0 CHECK (price >= 0),
  duration_days integer NOT NULL DEFAULT 0 CHECK (duration_days >= 0),
  destinations_json text NOT NULL DEFAULT '[]', inclusions_json text NOT NULL DEFAULT '[]',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_packages_public ON packages(category, active, price);
CREATE TABLE submissions (
  id uuid PRIMARY KEY, type varchar(20) NOT NULL CHECK (type IN ('booking','ticket','job','leader')),
  status varchar(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','confirmed','closed')),
  name varchar(120) NOT NULL, phone varchar(20) NOT NULL, email varchar(160),
  payload_json text NOT NULL DEFAULT '{}', file_key varchar(100),
  area varchar(160) NOT NULL DEFAULT 'Unspecified',
  travellers_count integer NOT NULL DEFAULT 1 CHECK (travellers_count BETWEEN 1 AND 1000),
  group_leader_name varchar(160), package_id uuid REFERENCES packages(id) ON DELETE SET NULL,
  revenue bigint NOT NULL DEFAULT 0 CHECK (revenue >= 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_submissions_created ON submissions(created_at DESC);
CREATE TABLE audit_events (
  id bigserial PRIMARY KEY, submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  action varchar(100) NOT NULL, actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
