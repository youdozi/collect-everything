-- ============================================
-- 사용자 수동 확인 처리 스크립트
-- ============================================
--
-- 이메일 확인이 안 되는 경우 사용하는 스크립트
-- Supabase Dashboard > SQL Editor에서 실행
--

-- 1. 모든 미확인 사용자 확인
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 2. youdozi@gmail.com 수동 확인
UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'youdozi@gmail.com';

-- 3. 모든 미확인 사용자 일괄 확인 (주의: 모든 사용자)
UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 4. 특정 이메일 사용자 확인
UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = '사용자이메일@example.com';

-- 5. 확인 결과 조회
SELECT
  email,
  email_confirmed_at,
  CASE
    WHEN email_confirmed_at IS NOT NULL THEN '✅ 확인됨'
    ELSE '❌ 미확인'
  END as status
FROM auth.users
ORDER BY created_at DESC;
