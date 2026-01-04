# Supabase 설정 가이드

## 🔧 필수 설정 단계

### 1️⃣ Site URL 설정 (회원가입 확인 이메일 도메인 수정)

Vercel 배포 후 프로덕션 URL로 Site URL을 업데이트해야 합니다.

1. **Supabase Dashboard** 접속
2. **Settings** → **Authentication** 메뉴로 이동
3. **Site URL** 섹션 찾기
4. Site URL을 프로덕션 도메인으로 변경:
   ```
   https://your-app-name.vercel.app
   ```
5. **Save** 버튼 클릭

### 2️⃣ Redirect URLs 설정 (추가 허용 도메인)

1. 같은 **Authentication** 설정 페이지에서
2. **Redirect URLs** 섹션 찾기
3. 다음 URL들 추가:
   ```
   https://your-app-name.vercel.app/**
   http://localhost:3000/**  (로컬 개발용)
   http://localhost:8080/**  (로컬 개발용)
   ```
4. **Save** 버튼 클릭

### 3️⃣ 이메일 템플릿 확인 (선택사항)

1. **Settings** → **Authentication** → **Email Templates**
2. **Confirm signup** 템플릿 확인
3. 기본 템플릿에는 `{{ .ConfirmationURL }}`이 포함되어 있어야 함
4. 필요시 커스터마이징 가능

---

## 🚀 Vercel 배포 후 할 일

1. Vercel 배포 완료 후 프로덕션 URL 확인
   - 예: `https://korean-places-app.vercel.app`

2. Supabase에서 Site URL 업데이트 (위 1️⃣ 참고)

3. 테스트:
   - 프로덕션 사이트에서 회원가입
   - 확인 이메일 수신 확인
   - 이메일 링크 클릭 시 프로덕션 도메인으로 이동하는지 확인

---

## 📋 환경 변수 설정 (Vercel)

Vercel Dashboard에서 다음 환경 변수 설정 필요:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
KAKAO_REST_API_KEY=your-kakao-key
```

**설정 방법:**
1. Vercel Dashboard → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 각 변수 추가
4. **Save** 후 재배포

---

## ✅ 확인 사항

- [ ] Supabase Site URL이 프로덕션 도메인으로 설정됨
- [ ] Redirect URLs에 프로덕션 + 로컬호스트 추가됨
- [ ] Vercel 환경 변수 설정 완료
- [ ] SQL 스키마 실행 완료 (supabase-schema.sql)
- [ ] youdozi@gmail.com으로 회원가입 시 자동 관리자 권한 부여 확인

---

## 🔍 문제 해결

### 회원가입 후 localhost로 리다이렉트되는 경우
→ Supabase Site URL이 localhost로 되어 있음. 프로덕션 URL로 변경 필요

### 이메일 확인 링크 클릭 시 404 에러
→ Redirect URLs에 프로덕션 도메인이 없음. 추가 필요

### 환경 변수를 찾을 수 없다는 에러
→ Vercel 환경 변수 설정 후 재배포 필요
