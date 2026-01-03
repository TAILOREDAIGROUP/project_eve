-- ============================================================================
-- DATABASE FUNCTIONS FOR PROACTIVE AGENT SYSTEM
-- ============================================================================

-- ============================================================================
-- SEMANTIC SEARCH FOR MEMORIES
-- ============================================================================
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  p_user_id TEXT
)
RETURNS TABLE (
  id UUID,
  memory_type TEXT,
  content TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    um.id,
    um.memory_type,
    um.content,
    um.confidence,
    um.created_at,
    1 - (um.embedding <=> query_embedding) AS similarity
  FROM user_memory um
  WHERE um.user_id = p_user_id
    AND 1 - (um.embedding <=> query_embedding) > match_threshold
    AND (um.expires_at IS NULL OR um.expires_at > NOW())
  ORDER BY um.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- INCREMENT INTERACTION COUNT
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_interaction_count(p_user_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO agent_state (user_id, interaction_count, last_interaction, updated_at)
  VALUES (p_user_id, 1, NOW(), NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    interaction_count = agent_state.interaction_count + 1,
    last_interaction = NOW(),
    updated_at = NOW();
END;
$$;

-- ============================================================================
-- GET OR CREATE AGENT STATE
-- ============================================================================
CREATE OR REPLACE FUNCTION get_or_create_agent_state(p_user_id TEXT)
RETURNS TABLE (
  id UUID,
  user_id TEXT,
  current_goals JSONB,
  active_tasks JSONB,
  user_profile JSONB,
  last_interaction TIMESTAMPTZ,
  interaction_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Try to get existing state
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.current_goals,
    a.active_tasks,
    a.user_profile,
    a.last_interaction,
    a.interaction_count,
    a.created_at,
    a.updated_at
  FROM agent_state a
  WHERE a.user_id = p_user_id;
  
  -- If not found, create it
  IF NOT FOUND THEN
    INSERT INTO agent_state (user_id, interaction_count)
    VALUES (p_user_id, 0)
    RETURNING 
      agent_state.id,
      agent_state.user_id,
      agent_state.current_goals,
      agent_state.active_tasks,
      agent_state.user_profile,
      agent_state.last_interaction,
      agent_state.interaction_count,
      agent_state.created_at,
      agent_state.updated_at
    INTO 
      id,
      user_id,
      current_goals,
      active_tasks,
      user_profile,
      last_interaction,
      interaction_count,
      created_at,
      updated_at;
      
    RETURN NEXT;
  END IF;
END;
$$;

-- ============================================================================
-- CHECK FOR STALE GOALS (Proactivity Trigger)
-- ============================================================================
CREATE OR REPLACE FUNCTION check_stale_goals(p_user_id TEXT, days_threshold INT DEFAULT 7)
RETURNS TABLE (
  goal TEXT,
  days_since_mention INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH goal_mentions AS (
    SELECT 
      jsonb_array_elements_text(current_goals) AS goal,
      last_interaction
    FROM agent_state
    WHERE user_id = p_user_id
  )
  SELECT 
    gm.goal,
    EXTRACT(DAY FROM NOW() - gm.last_interaction)::INT AS days_since_mention
  FROM goal_mentions gm
  WHERE EXTRACT(DAY FROM NOW() - gm.last_interaction) > days_threshold;
END;
$$;

-- ============================================================================
-- GET RECENT CONVERSATION CONTEXT
-- ============================================================================
CREATE OR REPLACE FUNCTION get_recent_context(
  p_user_id TEXT,
  message_limit INT DEFAULT 10
)
RETURNS TABLE (
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.role,
    m.content,
    m.created_at
  FROM messages m
  WHERE m.user_id = p_user_id
  ORDER BY m.created_at DESC
  LIMIT message_limit;
END;
$$;

-- ============================================================================
-- CREATE PROACTIVE TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION create_proactive_trigger(
  p_user_id TEXT,
  p_trigger_type TEXT,
  p_trigger_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_trigger_id UUID;
BEGIN
  INSERT INTO proactive_triggers (user_id, trigger_type, trigger_data)
  VALUES (p_user_id, p_trigger_type, p_trigger_data)
  RETURNING id INTO new_trigger_id;
  
  RETURN new_trigger_id;
END;
$$;

-- ============================================================================
-- RESOLVE PROACTIVE TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION resolve_trigger(
  p_trigger_id UUID,
  p_resolution TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE proactive_triggers
  SET 
    resolved_at = NOW(),
    resolution = p_resolution
  WHERE id = p_trigger_id;
END;
$$;

-- ============================================================================
-- ADD MESSAGE TO REVIEW QUEUE
-- ============================================================================
CREATE OR REPLACE FUNCTION add_to_review_queue(
  p_user_id TEXT,
  p_content TEXT,
  p_review_type TEXT,
  p_message_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_review_id UUID;
BEGIN
  INSERT INTO review_queue (user_id, message_id, content, review_type)
  VALUES (p_user_id, p_message_id, p_content, p_review_type)
  RETURNING id INTO new_review_id;
  
  RETURN new_review_id;
END;
$$;

-- ============================================================================
-- APPROVE REVIEW
-- ============================================================================
CREATE OR REPLACE FUNCTION approve_review(
  p_review_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE review_queue
  SET 
    status = 'approved',
    reviewed_at = NOW(),
    reviewer_notes = p_notes
  WHERE id = p_review_id;
END;
$$;

-- ============================================================================
-- REJECT REVIEW
-- ============================================================================
CREATE OR REPLACE FUNCTION reject_review(
  p_review_id UUID,
  p_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE review_queue
  SET 
    status = 'rejected',
    reviewed_at = NOW(),
    reviewer_notes = p_notes
  WHERE id = p_review_id;
END;
$$;
