# ⏰ 스케줄링 작업 설정 가이드

## 📋 개요

이 프로젝트는 Vercel Cron Jobs를 사용하여 자동화된 작업을 실행합니다.

## 🔧 설정 방법

### 1. Vercel 환경 변수 설정

Vercel Dashboard > Settings > Environment Variables에서 다음 변수를 추가하세요:

```
CRON_SECRET=your-random-secret-key-here
```

**CRON_SECRET 생성 방법:**
```bash
# Node.js에서 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 또는 온라인 도구 사용
# https://randomkeygen.com/
```

### 2. 현재 설정된 Cron Jobs

#### 📅 매일 자정 - 오래된 로그 삭제
```javascript
// Path: /api/cleanup-old-logs
// Schedule: "0 0 * * *" (매일 자정)
// 기능: 30일 이상 된 검색 로그 자동 삭제
```

#### 🔄 매일 오전 9시 - 인기 키워드 자동 업데이트
```javascript
// Path: /api/auto-update-keywords
// Schedule: "0 9 * * *" (매일 오전 9시)
// 기능: 지난 7일간 인기 검색어를 키워드로 자동 추가
```

## 🎯 Cron 표현식 가이드

```
┌───────────── 분 (0 - 59)
│ ┌───────────── 시 (0 - 23)
│ │ ┌───────────── 일 (1 - 31)
│ │ │ ┌───────────── 월 (1 - 12)
│ │ │ │ ┌───────────── 요일 (0 - 6) (일요일=0)
│ │ │ │ │
* * * * *
```

### 자주 사용하는 패턴

| 표현식 | 설명 |
|--------|------|
| `0 0 * * *` | 매일 자정 |
| `0 9 * * *` | 매일 오전 9시 |
| `0 */6 * * *` | 6시간마다 |
| `*/15 * * * *` | 15분마다 |
| `0 0 * * 0` | 매주 일요일 자정 |
| `0 0 1 * *` | 매월 1일 자정 |
| `0 9 * * 1-5` | 평일 오전 9시 |

## 🧪 테스트 방법

### 1. 로컬 테스트
```bash
# CRON_SECRET 환경 변수 설정
export CRON_SECRET=your-secret-key

# API 함수 호출
curl -X POST http://localhost:3000/api/cleanup-old-logs \
  -H "Authorization: Bearer $CRON_SECRET"
```

### 2. Vercel 배포 후 테스트
```bash
# 프로덕션 환경에서 테스트
curl -X POST https://your-app.vercel.app/api/cleanup-old-logs \
  -H "Authorization: Bearer your-secret-key"
```

### 3. Vercel Dashboard에서 확인
1. Vercel Dashboard > Deployments
2. Functions 탭에서 Cron Jobs 실행 로그 확인
3. Logs 탭에서 상세 실행 내역 확인

## 📝 새로운 Cron Job 추가하기

### 1. API 함수 생성
```javascript
// api/my-scheduled-task.js
const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  // 인증 확인
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 여기에 작업 로직 작성
    console.log('Task running:', new Date());

    return res.json({
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

### 2. vercel.json에 추가
```json
{
  "crons": [
    {
      "path": "/api/my-scheduled-task",
      "schedule": "0 12 * * *"
    }
  ]
}
```

### 3. 배포
```bash
git add .
git commit -m "Add new scheduled task"
git push
```

## ⚠️ 주의사항

1. **타임존**: Vercel Cron은 UTC 기준입니다
   - 한국 시간 오전 9시 = UTC 오전 0시
   - 한국 시간 자정 = UTC 오후 3시 (전날)

2. **실행 제한**: Hobby 플랜은 하루 최대 실행 횟수 제한 있음
   - Pro 플랜: 무제한

3. **타임아웃**: 함수 실행 시간은 최대 60초
   - 긴 작업은 분할 실행 고려

4. **보안**: CRON_SECRET을 반드시 설정하세요
   - 누구나 API를 호출할 수 있으므로 인증 필수

## 🔍 트러블슈팅

### Cron이 실행되지 않을 때
1. vercel.json이 루트 디렉토리에 있는지 확인
2. CRON_SECRET 환경 변수가 설정되어 있는지 확인
3. Vercel Dashboard에서 최근 배포가 성공했는지 확인
4. Functions 탭에서 에러 로그 확인

### 401 Unauthorized 에러
- CRON_SECRET이 일치하는지 확인
- 환경 변수가 Production 환경에 설정되어 있는지 확인

### 500 Internal Server Error
- Supabase 연결 정보 확인
- API 함수 로직 에러 확인
- Vercel Logs에서 상세 에러 확인

## 📚 참고 자료

- [Vercel Cron Jobs 문서](https://vercel.com/docs/cron-jobs)
- [Cron 표현식 테스트](https://crontab.guru/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
