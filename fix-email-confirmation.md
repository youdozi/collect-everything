# 회원가입 확인 이메일 문제 해결 가이드

## 🔍 확인해야 할 사항

### 1️⃣ Supabase 이메일 확인 설정 체크

**Supabase Dashboard → Settings → Authentication**

#### **Enable Email Confirmations 확인**
- 이 옵션이 **켜져 있으면** 확인 이메일 발송
- **꺼져 있으면** 이메일 없이 바로 가입 완료

**개발 중이라면 끄는 것을 추천:**
```
Enable Email Confirmations: OFF (비활성화)
```
→ 즉시 가입 완료되어 개발/테스트가 편리함

---

### 2️⃣ 이메일 발송 설정 확인

**Supabase Dashboard → Settings → Authentication → Email**

#### **SMTP 설정 확인**
Supabase 무료 플랜은 기본 이메일 서버 사용:
- 시간당 발송 제한: 3-4통
- 스팸으로 분류될 가능성 높음

**해결 방법:**
1. **스팸 메일함 확인** (가장 흔한 원인)
2. Custom SMTP 설정 (SendGrid, AWS SES 등)
3. 개발 중에는 이메일 확인 비활성화

---

### 3️⃣ 이메일 템플릿 확인

**Supabase Dashboard → Settings → Authentication → Email Templates**

**Confirm signup** 템플릿이 활성화되어 있는지 확인:
- Subject가 비어있지 않은지
- Body에 `{{ .ConfirmationURL }}`이 포함되어 있는지

---

## ⚡ 빠른 해결 방법 (개발용)

### 방법 1: 이메일 확인 비활성화 (추천)

1. **Supabase Dashboard** → **Settings** → **Authentication**
2. **Enable Email Confirmations** → **OFF**
3. **Save** 클릭

이제 회원가입 즉시 로그인 가능! ✅

---

### 방법 2: 수동으로 사용자 확인 처리

이미 가입했지만 확인 이메일을 못 받은 경우:

**Supabase Dashboard → SQL Editor** 에서 실행:

```sql
-- 특정 이메일 사용자 수동 확인
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'youdozi@gmail.com';
```

또는 모든 미확인 사용자 일괄 확인:

```sql
-- 모든 미확인 사용자 확인 처리
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

---

### 방법 3: 확인 이메일 재발송

Supabase는 기본적으로 재발송 기능이 없지만, 코드로 구현 가능:

**app.js에 추가할 함수:**

```javascript
async function resendConfirmationEmail(email) {
  // 기존 사용자 삭제 후 재가입
  const confirmed = confirm(
    '확인 이메일을 다시 보내려면 계정을 재생성해야 합니다.\n계속하시겠습니까?'
  );

  if (!confirmed) return;

  // 관리자가 직접 auth.users에서 삭제 후 재가입 요청
  alert('관리자에게 문의하여 계정을 재생성해주세요.');
}
```

---

## 🎯 프로덕션 권장 설정

### Custom SMTP 사용 (선택사항)

**SendGrid 무료 플랜 설정 예시:**

1. SendGrid 가입 → API Key 생성
2. **Supabase Dashboard** → **Settings** → **Authentication** → **SMTP Settings**
3. 다음 정보 입력:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: <your-sendgrid-api-key>
   Sender email: noreply@yourdomain.com
   Sender name: 여행 기록장
   ```

**장점:**
- 안정적인 이메일 발송
- 스팸 필터링 통과율 높음
- 발송 제한 완화 (SendGrid 무료: 일 100통)

---

## ✅ 최종 체크리스트

**개발 환경:**
- [ ] Enable Email Confirmations: **OFF** (비활성화)
- [ ] 바로 가입 → 로그인 가능한지 테스트

**프로덕션 환경:**
- [ ] Enable Email Confirmations: **ON**
- [ ] Custom SMTP 설정 (선택)
- [ ] Site URL: 프로덕션 도메인으로 설정
- [ ] Redirect URLs: 프로덕션 + 로컬 추가
- [ ] 스팸 메일함 확인 안내 추가

---

## 🐛 문제 지속 시 디버깅

**Supabase Dashboard → Logs → Auth Logs** 확인:
- 회원가입 이벤트가 기록되는지
- 이메일 발송 시도 로그가 있는지
- 에러 메시지 확인

**브라우저 Console 확인:**
```javascript
// 현재 사용자 상태 확인
const { data } = await authClient.client.auth.getUser();
console.log('User:', data);

// email_confirmed_at이 null이면 미확인 상태
```
