-- ============================================
-- 인기 키워드 관리 테이블 추가
-- ============================================

-- 인기 키워드 테이블
CREATE TABLE IF NOT EXISTS popular_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🔍',
  category TEXT NOT NULL CHECK (category IN ('cafe', 'restaurant', 'accommodation', 'attraction', 'other')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_keywords_category ON popular_keywords(category);
CREATE INDEX idx_keywords_order ON popular_keywords(display_order);
CREATE INDEX idx_keywords_active ON popular_keywords(is_active);

-- RLS 활성화
ALTER TABLE popular_keywords ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성화된 키워드 조회 가능
CREATE POLICY "Anyone can view active keywords" ON popular_keywords
  FOR SELECT USING (is_active = true);

-- 관리자만 키워드 추가/수정/삭제 가능
CREATE POLICY "Admins can insert keywords" ON popular_keywords
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update keywords" ON popular_keywords
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete keywords" ON popular_keywords
  FOR DELETE USING (is_admin());

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_keywords_updated_at
  BEFORE UPDATE ON popular_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 기본 키워드 데이터 삽입
-- ============================================

INSERT INTO popular_keywords (keyword, emoji, category, display_order) VALUES
  -- 카페 (1-4)
  ('강남 카페', '☕', 'cafe', 1),
  ('홍대 카페', '☕', 'cafe', 2),
  ('제주 카페', '☕', 'cafe', 3),
  ('부산 카페', '☕', 'cafe', 4),

  -- 맛집 (5-8)
  ('강남 맛집', '🍽️', 'restaurant', 5),
  ('홍대 맛집', '🍽️', 'restaurant', 6),
  ('제주 맛집', '🍽️', 'restaurant', 7),
  ('부산 맛집', '🍽️', 'restaurant', 8),

  -- 숙소 (9-11)
  ('제주 숙소', '🏨', 'accommodation', 9),
  ('부산 숙소', '🏨', 'accommodation', 10),
  ('강원도 숙소', '🏨', 'accommodation', 11),

  -- 관광지 (12)
  ('경주 관광지', '🏞️', 'attraction', 12)
ON CONFLICT DO NOTHING;

-- 키워드 조회
SELECT
  id,
  keyword,
  emoji,
  category,
  display_order,
  is_active,
  created_at
FROM popular_keywords
ORDER BY display_order;
