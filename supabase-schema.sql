-- ============================================
-- 여행 기록 데이터베이스 스키마 v2.0
-- ============================================

-- 기존 테이블 삭제 (재실행 시)
DROP VIEW IF EXISTS expense_by_category CASCADE;
DROP VIEW IF EXISTS trip_summary CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS places CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 0. 사용자 테이블 (Supabase Auth 연동)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'admin')),
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. 여행 정보 테이블
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  destination VARCHAR(255),
  cover_image TEXT,
  total_budget DECIMAL(10, 2),
  total_spent DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 장소 기본 정보 테이블
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('cafe', 'restaurant', 'accommodation', 'attraction', 'shopping', 'transport', 'other')),
  address TEXT,
  road_address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone VARCHAR(20),
  naver_place_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 방문 기록 테이블 (여행 중 각 장소 방문)
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  visit_order INTEGER, -- 방문 순서
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  weather VARCHAR(50),
  companions TEXT[], -- 동행인
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 비용/메뉴 항목 테이블
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL, -- 메뉴명, 입장료명 등
  category VARCHAR(50) NOT NULL CHECK (category IN ('food', 'accommodation', 'transport', 'ticket', 'shopping', 'other')),
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 사진 테이블
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_trips_start_date ON trips(start_date DESC);
CREATE INDEX idx_visits_trip_id ON visits(trip_id);
CREATE INDEX idx_visits_place_id ON visits(place_id);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_expenses_visit_id ON expenses(visit_id);
CREATE INDEX idx_photos_visit_id ON photos(visit_id);
CREATE INDEX idx_places_category ON places(category);

-- ============================================
-- 자동 업데이트 트리거
-- ============================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 테이블 트리거
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- trips 테이블 트리거
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- visits 테이블 트리거
CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 사용자 자동 생성 트리거 (Supabase Auth 연동)
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    'viewer', -- 기본값은 viewer
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users에 사용자 추가 시 자동으로 public.users에도 추가
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 총 지출 자동 계산 함수
-- ============================================

CREATE OR REPLACE FUNCTION update_trip_total_spent()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE trips
  SET total_spent = (
    SELECT COALESCE(SUM(e.price * e.quantity), 0)
    FROM expenses e
    JOIN visits v ON e.visit_id = v.id
    WHERE v.trip_id = (
      SELECT trip_id FROM visits WHERE id = NEW.visit_id
    )
  )
  WHERE id = (
    SELECT trip_id FROM visits WHERE id = NEW.visit_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 비용 추가/수정/삭제 시 총 지출 업데이트
CREATE TRIGGER trigger_update_total_spent_insert
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_total_spent();

CREATE TRIGGER trigger_update_total_spent_update
  AFTER UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_total_spent();

CREATE TRIGGER trigger_update_total_spent_delete
  AFTER DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_total_spent();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper function: 사용자 권한 확인
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Users 테이블 정책
-- ============================================

-- 모든 로그인 사용자는 자기 정보 조회 가능
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- 관리자는 모든 사용자 조회 가능
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (is_admin());

-- 사용자는 자기 프로필 수정 가능 (role 제외)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    (SELECT role FROM users WHERE id = auth.uid()) = role -- role 변경 불가
  );

-- ============================================
-- Trips 테이블 정책
-- ============================================

-- 로그인한 사용자 (viewer + admin) 모두 조회 가능
CREATE POLICY "Authenticated users can view trips" ON trips
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 관리자만 추가/수정/삭제 가능
CREATE POLICY "Admins can insert trips" ON trips
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update trips" ON trips
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete trips" ON trips
  FOR DELETE USING (is_admin());

-- ============================================
-- Places 테이블 정책
-- ============================================

CREATE POLICY "Authenticated users can view places" ON places
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert places" ON places
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can delete places" ON places
  FOR DELETE USING (is_admin());

-- ============================================
-- Visits 테이블 정책
-- ============================================

CREATE POLICY "Authenticated users can view visits" ON visits
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert visits" ON visits
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update visits" ON visits
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete visits" ON visits
  FOR DELETE USING (is_admin());

-- ============================================
-- Expenses 테이블 정책
-- ============================================

CREATE POLICY "Authenticated users can view expenses" ON expenses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert expenses" ON expenses
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update expenses" ON expenses
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete expenses" ON expenses
  FOR DELETE USING (is_admin());

-- ============================================
-- Photos 테이블 정책
-- ============================================

CREATE POLICY "Authenticated users can view photos" ON photos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert photos" ON photos
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can delete photos" ON photos
  FOR DELETE USING (is_admin());

-- ============================================
-- 유용한 뷰 (Views)
-- ============================================

-- 여행 요약 뷰
CREATE VIEW trip_summary AS
SELECT
  t.id,
  t.title,
  t.start_date,
  t.end_date,
  t.destination,
  t.total_budget,
  t.total_spent,
  COUNT(DISTINCT v.id) as visit_count,
  COUNT(DISTINCT p.id) as photo_count
FROM trips t
LEFT JOIN visits v ON t.id = v.trip_id
LEFT JOIN photos p ON v.id = p.visit_id
GROUP BY t.id;

-- 카테고리별 지출 요약 뷰
CREATE VIEW expense_by_category AS
SELECT
  v.trip_id,
  e.category,
  SUM(e.price * e.quantity) as total
FROM expenses e
JOIN visits v ON e.visit_id = v.id
GROUP BY v.trip_id, e.category;

-- ============================================
-- 샘플 데이터 (테스트용)
-- ============================================

-- 샘플 여행
INSERT INTO trips (title, description, start_date, end_date, destination, total_budget)
VALUES
  ('제주도 힐링 여행', '3박 4일 제주도 여행', '2026-01-15', '2026-01-18', '제주도', 500000),
  ('부산 맛집 투어', '2박 3일 부산 먹방 여행', '2026-02-01', '2026-02-03', '부산', 300000);

-- 샘플 장소
INSERT INTO places (name, category, address)
VALUES
  ('제주 카페 더클리프', 'cafe', '제주시 애월읍'),
  ('부산 해운대 그랜드호텔', 'accommodation', '부산시 해운대구'),
  ('광안리 회센터', 'restaurant', '부산시 수영구 광안리');
