-- ============================================
-- 누락된 사용자 프로필 자동 복구 스크립트
-- ============================================
--
-- 문제: auth.users에는 있지만 public.users에는 없는 경우
-- 원인: 트리거가 실행되지 않았거나, 트리거 생성 전 가입
-- 해결: 누락된 프로필 자동 생성
--

-- 1. 문제 진단: 프로필이 없는 사용자 찾기
SELECT
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  CASE
    WHEN pu.id IS NULL THEN '❌ 프로필 없음 (문제 발생)'
    ELSE '✅ 프로필 있음'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- 2. 누락된 프로필 자동 생성
-- youdozi@gmail.com은 admin, 첫 번째 사용자도 admin, 나머지는 viewer
INSERT INTO public.users (id, email, role, display_name, created_at, updated_at)
SELECT
  au.id,
  au.email,
  CASE
    WHEN au.email = 'youdozi@gmail.com' THEN 'admin'
    WHEN NOT EXISTS (SELECT 1 FROM public.users) THEN 'admin'
    ELSE 'viewer'
  END as role,
  COALESCE(
    au.raw_user_meta_data->>'display_name',
    split_part(au.email, '@', 1)
  ) as display_name,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 3. 수정 결과 확인
SELECT
  u.email,
  u.role,
  u.display_name,
  u.created_at,
  CASE
    WHEN u.role = 'admin' THEN '👑 관리자'
    ELSE '👤 일반 사용자'
  END as role_icon
FROM public.users u
ORDER BY u.created_at DESC;

-- 4. 트리거 작동 확인
-- 새로 가입하는 사용자는 자동으로 프로필이 생성되는지 확인
SELECT
  COUNT(*) as auth_users_count,
  (SELECT COUNT(*) FROM public.users) as public_users_count,
  CASE
    WHEN COUNT(*) = (SELECT COUNT(*) FROM public.users) THEN '✅ 동기화됨'
    ELSE '❌ 동기화 안됨 (트리거 문제)'
  END as sync_status
FROM auth.users;

-- ============================================
-- 참고: 트리거가 제대로 생성되었는지 확인
-- ============================================
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
