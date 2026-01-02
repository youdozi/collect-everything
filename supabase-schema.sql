-- 장소 정보 테이블 생성
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('cafe', 'restaurant', 'tourist')),

  -- 주소 정보
  address TEXT,
  road_address TEXT,

  -- 좌표 정보
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- 네이버 지도 정보
  naver_place_id VARCHAR(100),
  naver_category VARCHAR(100),

  -- 평점
  naver_rating DECIMAL(2, 1),  -- 네이버 평점
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),  -- 사용자 평점

  -- 상세 정보
  description TEXT,
  tags TEXT[],
  phone VARCHAR(20),

  -- 메타 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_created_at ON places(created_at DESC);
CREATE INDEX idx_places_name ON places USING gin(to_tsvector('korean', name));
CREATE INDEX idx_places_address ON places USING gin(to_tsvector('korean', address));

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 활성화
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능
CREATE POLICY "Anyone can read places"
  ON places FOR SELECT
  USING (true);

-- 누구나 추가 가능 (추후 인증 추가 시 수정)
CREATE POLICY "Anyone can insert places"
  ON places FOR INSERT
  WITH CHECK (true);

-- 누구나 수정 가능 (추후 인증 추가 시 수정)
CREATE POLICY "Anyone can update places"
  ON places FOR UPDATE
  USING (true);

-- 누구나 삭제 가능 (추후 인증 추가 시 수정)
CREATE POLICY "Anyone can delete places"
  ON places FOR DELETE
  USING (true);

-- 샘플 데이터 (선택사항)
INSERT INTO places (name, category, address, road_address, latitude, longitude, user_rating, description, tags)
VALUES
  ('스타벅스 강남점', 'cafe', '서울시 강남구', '테헤란로 123', 37.5012, 127.0396, 5, '조용하고 넓어요', ARRAY['조용한', 'wifi', '콘센트']),
  ('제주 한라산', 'tourist', '제주특별자치도', '제주시 1100로', 33.3617, 126.5292, 5, '경치가 아름다워요', ARRAY['자연', '등산', '힐링']);

-- 통계용 뷰 생성
CREATE VIEW places_stats AS
SELECT
  category,
  COUNT(*) as count,
  AVG(user_rating) as avg_rating
FROM places
GROUP BY category;
