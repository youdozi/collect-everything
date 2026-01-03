# ✈️ 여행 기록장 (Travel Journal)

소중한 여행의 순간들을 기록하고 관리하는 웹 애플리케이션입니다.

## 🎯 특징

**여행 중심 설계**
- 여행 단위로 모든 기록 관리
- 타임라인 형식의 직관적인 UI
- 실시간 예산/지출 추적

**자동화된 데이터 수집**
- 네이버 지도 API로 장소 정보 자동 입력
- MCP 웹 브라우저로 메뉴/가격 스크래핑 (선택)
- 카테고리 자동 분류

**상세한 기록 관리**
- 방문 장소 + 날짜/시간
- 메뉴/비용 항목별 관리
- 개인 평점 & 메모
- 자동 지출 집계

---

## ✨ 주요 기능

### 1. 여행 관리
- ✈️ 여행 추가/수정/삭제
- 📅 날짜별 일정 관리
- 💰 예산 설정 & 지출 추적
- 📊 여행별 통계 자동 집계

### 2. 방문 기록
- 📍 장소 정보 (네이버 API 연동)
- ⏰ 방문 일시 기록
- ⭐ 개인 평점
- 📝 방문 메모

### 3. 비용 관리
- 🍽️ 메뉴/항목별 비용 기록
- 💵 수량 & 가격 자동 계산
- 📈 카테고리별 지출 분석
- 💸 여행 총 지출 자동 계산

### 4. 데이터 수집
- 🔍 **네이버 API**: 장소 이름, 주소, 전화번호
- 🤖 **MCP 스크래핑**: 메뉴, 가격 (선택적)
- ✍️ **수동 입력**: 개인 메모, 평점

---

## 🏗️ 시스템 구조

```
프론트엔드 (HTML/CSS/JS)
    ↓
┌───────────────────────────┐
│  Vercel Serverless        │
│  - 네이버 API 프록시      │
└───────────────────────────┘
    ↓
┌───────────────────────────┐
│  Supabase PostgreSQL      │
│  - trips (여행)           │
│  - places (장소)          │
│  - visits (방문)          │
│  - expenses (비용)        │
│  - photos (사진)          │
└───────────────────────────┘
```

---

## 🗄️ 데이터베이스 스키마

### trips (여행)
```sql
- id, title, destination
- start_date, end_date
- total_budget, total_spent (자동 계산)
```

### places (장소)
```sql
- id, name, category
- address, latitude, longitude
- naver_place_id (중복 방지)
```

### visits (방문 기록)
```sql
- trip_id, place_id
- visit_date, rating, notes
```

### expenses (비용)
```sql
- visit_id, item_name
- price, quantity
- category (food/accommodation/etc)
```

**특징:**
- CASCADE 삭제 (여행 삭제 시 관련 데이터 자동 삭제)
- 자동 트리거 (비용 변경 시 여행 총 지출 자동 업데이트)
- 인덱스 최적화 (빠른 검색)

---

## 🚀 사용 방법

### 1. 여행 추가

```
"+ 새 여행 추가" 클릭
→ 제목: "제주도 3박 4일"
→ 날짜: 2026-01-15 ~ 01-18
→ 예산: 500,000원
→ 추가하기
```

### 2. 방문 기록 추가

```
여행 선택 → "방문 추가" 클릭

[네이버 검색]
→ "제주 카페 더클리프" 검색
→ 결과 선택 (주소/전화번호 자동 입력)

[방문 정보]
→ 방문일시: 2026-01-15 14:00
→ 평점: ⭐⭐⭐⭐⭐
→ 메모: "바다 뷰가 환상적!"

[비용 항목]
→ 아메리카노 - 6,000원 x 2
→ 케이크 - 7,000원 x 1
→ 총: 19,000원 (자동 계산)

→ 추가하기
```

### 3. MCP로 메뉴 자동 수집 (선택)

```
방법 1: Claude에게 직접 요청
"이 네이버 플레이스 링크에서 메뉴 가져와줘"
→ Claude가 MCP 브라우저로 페이지 방문
→ 메뉴/가격 추출
→ JSON 반환
→ 복사해서 붙여넣기

방법 2: 수동 입력
직접 메뉴 항목 추가
```

---

## 📊 데이터 수집 전략

### 하이브리드 접근 (API + MCP + 수동)

| 정보 | 수집 방법 | 자동화 |
|------|----------|--------|
| 장소명 | 네이버 API | ✅ 자동 |
| 주소 | 네이버 API | ✅ 자동 |
| 전화번호 | 네이버 API | ✅ 자동 |
| 카테고리 | 자동 분류 | ✅ 자동 |
| 메뉴 | MCP (선택) | ⚠️ 반자동 |
| 가격 | MCP 또는 수동 | ✍️ 수동 |
| 평점 | 사용자 입력 | ✍️ 수동 |
| 메모 | 사용자 입력 | ✍️ 수동 |

**장점:**
- 편리함: 기본 정보 자동 입력
- 정확함: 직접 확인한 메뉴/가격 기록
- 합법: 공식 API 사용
- 개인화: 본인만의 평점/메모

---

## 🌐 배포 (Vercel + Supabase)

### 1. Supabase 설정

```bash
1. https://supabase.com 접속
2. 새 프로젝트 생성 (리전: Seoul)
3. SQL Editor에서 supabase-schema.sql 실행
4. API 키 복사
```

### 2. Vercel 배포

```bash
# CLI로 배포
npx vercel

# 환경 변수 설정
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

### 3. 프론트엔드 설정

```javascript
// config.js 생성
window.SUPABASE_URL = 'https://xxxxx.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGci...';
```

**자세한 설정은 [SETUP.md](./SETUP.md) 참조**

---

## 💡 MCP 웹 스크래핑 사용법

MCP(Model Context Protocol)를 활용하면 네이버 플레이스에서 메뉴/가격을 자동으로 가져올 수 있습니다.

### 사용 시나리오

```
1. 네이버에서 장소 검색
2. 장소 선택 (링크 확인)
3. Claude에게 요청:

   "이 네이버 플레이스에서 메뉴 가져와줘
    https://m.place.naver.com/restaurant/12345"

4. Claude 응답:
   {
     "menus": [
       {"name": "아메리카노", "price": 4500},
       {"name": "카페라떼", "price": 5000}
     ]
   }

5. 복사해서 비용 항목에 추가
```

### 주의사항

⚠️ **법적/윤리적 고려**
- 개인 여행 기록 용도로만 사용
- 소규모 데이터 수집
- 상업적 사용 금지
- 대량 수집 금지

✅ **안전한 사용**
- 본인이 방문한 곳만 기록
- 필요한 정보만 수집
- API 우선, MCP는 보조

---

## 📦 프로젝트 구조

```
collect-everything/
├── index.html              # 메인 HTML (여행 목록 + 상세)
├── style.css               # 타임라인 스타일
├── app.js                  # 메인 JavaScript 로직
├── supabase-client.js      # Supabase DB 클라이언트
├── config.example.js       # 환경 변수 템플릿
├── api/
│   └── search-place.js     # 네이버 API 프록시
├── supabase-schema.sql     # PostgreSQL 스키마
├── package.json            # NPM 설정
├── .env.example            # Vercel 환경 변수
├── SETUP.md                # 설정 가이드
└── README.md               # 이 파일
```

---

## 🛠️ 기술 스택

### 프론트엔드
- HTML5
- CSS3 (Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)

### 백엔드 & DB
- Vercel Serverless Functions
- Supabase PostgreSQL
- 네이버 지도 API

### 데이터 수집
- 네이버 Local Search API (공식)
- MCP 웹 브라우저 (선택적)

---

## 📊 무료 할당량

| 서비스 | 무료 제공 |
|--------|----------|
| Vercel | 100GB/월 대역폭 |
| Supabase | 500MB DB, 무제한 API |
| 네이버 API | 25,000건/일 |

**개인 사용에 충분합니다!**

---

## 🎨 UI 특징

- 타임라인 디자인 (세로 라인 + 점)
- 카드 형식 레이아웃
- 반응형 디자인 (모바일 지원)
- 부드러운 애니메이션
- 모달 인터페이스

---

## 🔮 향후 계획

- [ ] 사진 업로드 기능
- [ ] 지도 시각화 (방문 경로)
- [ ] 여행 공유 기능
- [ ] PDF/이미지 내보내기
- [ ] 다크 모드
- [ ] PWA (앱처럼 설치)
- [ ] 날씨 정보 연동
- [ ] 환율 계산기

---

## 🐛 문제 해결

### Supabase 연결 안 될 때
```
1. config.js 파일 존재 확인
2. SUPABASE_URL, SUPABASE_ANON_KEY 확인
3. 브라우저 콘솔(F12) 에러 확인
```

### 네이버 검색 안 될 때
```
1. Vercel 환경 변수 확인
2. 재배포 했는지 확인
3. 네이버 개발자 센터 도메인 등록 확인
```

### 비용이 자동 계산 안 될 때
```
Supabase 트리거가 작동하지 않는 경우:
1. supabase-schema.sql 전체 실행 확인
2. expenses 테이블에 트리거 확인
```

---

## 📄 라이선스

MIT License

---

## 🙏 기여

이슈와 PR 환영합니다!

---

## 📞 문의

문제 발생 시:
1. 브라우저 콘솔(F12) 확인
2. Issues 탭에 보고
3. SETUP.md 참조

---

**Made with ❤️ for travelers**

🌟 이 프로젝트가 유용하다면 Star를 눌러주세요!
