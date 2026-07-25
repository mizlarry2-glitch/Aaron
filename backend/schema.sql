-- schema.sql

CREATE TABLE smtp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  host text NOT NULL,
  port integer NOT NULL CHECK (port IN (587, 465)),
  username text NOT NULL,
  encrypted_password text NOT NULL,
  encryption_type text NOT NULL CHECK (encryption_type IN ('STARTTLS', 'SSL')),
  sender_name text NOT NULL,
  reply_to_email text NOT NULL,
  daily_send_limit integer NOT NULL CHECK (daily_send_limit >= 1),
  sent_today integer NOT NULL DEFAULT 0,
  health_score integer NOT NULL DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','failing','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prospect_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text
);

CREATE TABLE prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  raw_profile_data text,
  website_url text,
  custom_fields jsonb NOT NULL DEFAULT '{}',
  list_id uuid NOT NULL REFERENCES prospect_lists(id),
  status text NOT NULL DEFAULT 'new',
  sequence_status text NOT NULL DEFAULT 'active' CHECK (sequence_status IN ('active','paused','stopped')),
  stopped_reason text,
  stopped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, list_id)
);

CREATE TABLE sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  offer_description text NOT NULL,
  ai_instructions text NOT NULL,
  total_days integer NOT NULL CHECK (total_days > 0),
  ai_provider text NOT NULL CHECK (ai_provider IN ('claude','gemini','openai')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  day_number integer NOT NULL CHECK (day_number > 0),
  cadence_offset_days integer NOT NULL CHECK (cadence_offset_days >= 0),
  step_purpose text NOT NULL,
  pattern_source_prospect_id uuid REFERENCES prospects(id),
  pattern_source text CHECK (pattern_source IN ('ai','manual')),
  pattern_subject text,
  pattern_body text,
  pattern_approved_at timestamptz,
  UNIQUE (sequence_id, day_number)
);

CREATE TABLE generated_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE RESTRICT,
  sequence_id uuid NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES sequence_steps(id) ON DELETE CASCADE,
  ai_provider_used text,
  source text NOT NULL CHECK (source IN ('ai','manual')),
  generated_subject text,
  generated_body text,
  edited_subject text,
  edited_body text,
  approved boolean NOT NULL DEFAULT false,
  scheduled_send_at timestamptz,
  sent boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  skipped_reason text,
  smtp_account_id_used uuid REFERENCES smtp_accounts(id) ON DELETE RESTRICT,
  opened boolean NOT NULL DEFAULT false,
  opened_at timestamptz,
  clicked boolean NOT NULL DEFAULT false,
  clicked_at timestamptz,
  replied boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prospect_id, step_id)
);

CREATE TABLE replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_email_id uuid REFERENCES generated_emails(id),
  prospect_id uuid REFERENCES prospects(id),
  from_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  received_at timestamptz NOT NULL,
  read boolean NOT NULL DEFAULT false
);

CREATE TABLE placeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL,
  description text,
  scope text NOT NULL CHECK (scope IN ('global','sequence')),
  UNIQUE (key_name, scope)
);

CREATE TABLE ai_provider_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('claude','gemini','openai')),
  encrypted_api_key text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (provider)
);

-- Indexes
CREATE INDEX generated_emails_scheduled_idx ON generated_emails(approved, sent, scheduled_send_at);
CREATE INDEX generated_emails_sequence_step_source_idx ON generated_emails(sequence_id, step_id, source);
CREATE INDEX replies_prospect_received_idx ON replies(prospect_id, received_at);
CREATE INDEX prospects_list_status_idx ON prospects(list_id, sequence_status);
