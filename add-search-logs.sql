-- ============================================
-- 검색 로그 및 자동 키워드 수집 테이블
-- ============================================

-- 검색 로그 테이블
CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  search_query TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_search_logs_query ON search_logs(search_query);
CREATE INDEX idx_search_logs_date ON search_logs(searched_at DESC);
CREATE INDEX idx_search_logs_user ON search_logs(user_id);

-- RLS 활성화
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자기 검색 기록만 조회
CREATE POLICY "Users can view own searches" ON search_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 누구나 검색 로그 추가 가능 (익명 포함)
CREATE POLICY "Anyone can log searches" ON search_logs
  FOR INSERT WITH CHECK (true);

-- 관리자는 모든 검색 기록 조회 가능
CREATE POLICY "Admins can view all searches" ON search_logs
  FOR SELECT USING (is_admin());

-- ============================================
-- 인기 검색어 조회 함수
-- ============================================

-- 최근 30일 인기 검색어 (결과 5개 이상만)
CREATE OR REPLACE FUNCTION get_popular_searches(days INTEGER DEFAULT 30, min_results INTEGER DEFAULT 5)
RETURNS TABLE (
  search_query TEXT,
  search_count BIGINT,
  avg_result_count NUMERIC,
  last_searched TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sl.search_query,
    COUNT(*) as search_count,
    ROUND(AVG(sl.result_count), 0) as avg_result_count,
    MAX(sl.searched_at) as last_searched
  FROM search_logs sl
  WHERE sl.searched_at > NOW() - (days || ' days')::INTERVAL
    AND sl.result_count >= min_results
  GROUP BY sl.search_query
  HAVING COUNT(*) >= 2  -- 최소 2번 이상 검색
  ORDER BY search_count DESC, last_searched DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- 사용 예시:
-- SELECT * FROM get_popular_searches(30, 5);
