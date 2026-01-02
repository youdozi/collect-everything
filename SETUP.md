# 🚀 설정 가이드

이 가이드는 Vercel + Supabase + 네이버 API를 연동하여 웹앱을 배포하는 방법을 안내합니다.

## 📋 필요한 것

1. GitHub 계정
2. Vercel 계정 (무료)
3. Supabase 계정 (무료)
4. 네이버 개발자 계정 (무료)

---

## 1️⃣ Supabase 설정

### 1.1 Supabase 프로젝트 생성

1. https://supabase.com 접속
2. "New Project" 클릭
3. 프로젝트 이름, 비밀번호 설정
4. 리전: **Northeast Asia (Seoul)** 선택 (중요!)
5. 생성 완료 대기 (2-3분)

### 1.2 데이터베이스 테이블 생성

1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New Query** 클릭
3. `supabase-schema.sql` 파일 내용을 복사하여 붙여넣기
4. **Run** 버튼 클릭하여 실행

### 1.3 API 키 확인

1. 왼쪽 메뉴에서 **Settings** > **API** 클릭
2. 다음 정보를 복사해두세요:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...`

---

## 2️⃣ 네이버 API 설정

### 2.1 네이버 개발자 등록

1. https://developers.naver.com/apps 접속
2. "애플리케이션 등록" 클릭
3. 정보 입력:
   - **애플리케이션 이름**: 국내 장소 정보 앱
   - **사용 API**: **검색** 선택 (지역 검색)
   - **환경 추가**: **WEB 설정**
   - **웹 서비스 URL**: `http://localhost:8000` (나중에 변경)

### 2.2 API 키 확인

등록 후 다음 정보를 복사해두세요:
- **Client ID**: `xxxxxxxxxxxxx`
- **Client Secret**: `xxxxxxxxxx`

---

## 3️⃣ 로컬 개발 환경 설정

### 3.1 config.js 파일 생성

```bash
cp config.example.js config.js
```

`config.js` 파일을 열고 Supabase 정보 입력:

```javascript
window.SUPABASE_URL = 'https://xxxxx.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGci...';
```

### 3.2 로컬에서 테스트

```bash
# 간단한 HTTP 서버 실행
python -m http.server 8000

# 또는 npx 사용
npx http-server -p 8000
```

브라우저에서 http://localhost:8000 접속

⚠️ **주의**: 로컬에서는 네이버 API가 작동하지 않습니다. Vercel에 배포 후 사용 가능합니다.

---

## 4️⃣ Vercel 배포

### 4.1 Vercel 프로젝트 생성

```bash
# Vercel CLI 설치 (선택사항)
npm install -g vercel

# Vercel 로그인 및 배포
vercel
```

또는 웹에서:
1. https://vercel.com 접속
2. "Import Project" 클릭
3. GitHub 저장소 선택
4. "Import" 클릭

### 4.2 환경 변수 설정 (중요!)

Vercel 프로젝트 페이지에서:

1. **Settings** > **Environment Variables** 클릭
2. 다음 환경 변수 추가:

| Name | Value |
|------|-------|
| `NAVER_CLIENT_ID` | 네이버 Client ID |
| `NAVER_CLIENT_SECRET` | 네이버 Client Secret |

3. **Save** 클릭
4. **Redeploy** (재배포) 필수!

### 4.3 네이버 API 도메인 업데이트

1. https://developers.naver.com/apps 접속
2. 등록한 애플리케이션 클릭
3. **웹 서비스 URL** 업데이트:
   - `https://your-project.vercel.app` 추가

---

## 5️⃣ 배포 확인

### 5.1 기능 테스트

1. 배포된 URL 접속 (예: https://your-project.vercel.app)
2. **네이버 지도에서 검색** 테스트
3. **장소 추가** 테스트
4. **데이터 조회** 확인

### 5.2 문제 해결

#### 네이버 검색이 안 될 때
- Vercel 환경 변수 확인
- 재배포 했는지 확인
- 네이버 개발자 센터에서 도메인 추가 확인
- 브라우저 콘솔에서 에러 확인

#### 데이터가 저장 안 될 때
- Supabase 프로젝트 활성화 확인
- config.js 설정 확인
- 브라우저 콘솔에서 에러 확인

#### 로컬 저장소 모드로 실행될 때
- config.js 파일 생성 확인
- SUPABASE_URL과 SUPABASE_ANON_KEY 값 확인

---

## 6️⃣ 선택사항

### Custom Domain 설정

1. Vercel 프로젝트 > **Settings** > **Domains**
2. 도메인 입력 및 DNS 설정

### 성능 모니터링

- Vercel Dashboard에서 방문자 통계 확인
- Supabase Dashboard에서 DB 사용량 확인

---

## 📞 도움말

문제가 발생하면:
1. 브라우저 개발자 도구 (F12) > Console 확인
2. Vercel Logs 확인
3. Supabase Logs 확인

---

## 🎉 완료!

이제 네이버 지도에서 장소를 검색하고 저장할 수 있습니다!
