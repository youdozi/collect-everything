-- ============================================
-- 관리자 계정 설정 스크립트
-- ============================================
--
-- 사용 방법:
-- 1. youdozi@gmail.com 계정으로 웹사이트에서 회원가입
-- 2. Supabase Dashboard > SQL Editor에서 이 스크립트 실행
--

-- 현재 사용자 목록 확인
SELECT
  u.id,
  u.email,
  u.role,
  u.display_name,
  u.created_at
FROM users u
ORDER BY u.created_at DESC;

-- youdozi@gmail.com을 관리자로 설정
UPDATE users
SET role = 'admin'
WHERE email = 'youdozi@gmail.com';

-- 결과 확인
SELECT
  email,
  role,
  display_name,
  created_at
FROM users
WHERE email = 'youdozi@gmail.com';

-- ============================================
-- 추가 관리자 계정이 필요한 경우
-- ============================================
-- 다른 이메일을 관리자로 추가하려면:
-- UPDATE users SET role = 'admin' WHERE email = '다른이메일@example.com';

-- 관리자를 일반 사용자로 변경하려면:
-- UPDATE users SET role = 'viewer' WHERE email = 'youdozi@gmail.com';
