# 🛠 GuideMatch 시스템 구축 및 설정 가이드 (통합본)

본 문서는 GuideMatch 프로젝트의 초기 세팅부터 실제 운영 단계까지 필요한 모든 외부 서비스 설정과 연동 방법을 정리한 공식 가이드라인입니다.

## 1. 시스템 전체 아키텍처 (System Architecture)

```text
       [  사용자 (User)  ]
              │
              ▼
      [  Vercel (Frontend)  ] ───┐
     (Next.js App Router)       │
              │                 │ (Auth / DB Request)
              ▼                 ▼
      [  Supabase (Backend) ] <──┘
     ┌───────────────┬───────────────┐
     │ Authenticator │   Postgres    │
     └──────┬────────┴───────┬───────┘
            │                │
            ▼                ▼
     [ Resend (Email) ] [ DNS (mrsure.kr) ]
     (Email Sending)    (SPF/MX Record)
```

---

## 2. 연동 서비스 및 주요 기능

| 서비스명 | 주요 역할 | 비고 |
| :--- | :--- | :--- |
| **Vercel** | 프론트엔드 호스팅 및 브랜치 배포 | 환경 변수 관리 포함 |
| **Supabase** | DB(Postgres), 사용자 인증(Auth), 파일 저장소 | Admin API 활용 |
| **Domain (Hostinger)** | 서비스 도메인 관리 (`mrsure.kr`) | DNS 설정 |
| **Resend** | 트랜잭션 이메일 발송 (회원가입, 비번찾기) | SMTP 서버 브릿지 |

---

## 3. 서비스별 세부 설정 (Setup Checklist)

### 🟢 Supabase 설정
1. **Authentication > URL Configuration**:
   - **Site URL**: `https://tourguide2-five.vercel.app` (실제 배포 주소)
   - **Redirect URLs**: `/auth/callback` 경로 추가 필수.
2. **Authentication > Email Templates**:
   - **Confirm Signup**: 회원가입 시 보낼 내용 확인. (실수로 Password Reset과 겹치지 않게 주의)
   - **Reset Password**: 이메일 본문에 `{{ .ConfirmationURL }}` 포함 여부 확인.
3. **API Settings**:
   - `anon` key: 클라이언트용 (NEXT_PUBLIC_...)
   - `service_role` key: 서버 관리자용 (절대 노출 금지, Vercel 환경 변수 전용)

### 🔵 Vercel 설정
1. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service_role key (**[Fix]** 회원 탈퇴 기능 핵심)
   - `NEXT_PUBLIC_SITE_URL`: `https://tourguide2-five.vercel.app`
2. **Redeploy**: 환경 변수를 추가한 후에는 반드시 [Redeploy]를 실행해야 서버가 새 값을 인식합니다.

### 🟡 Domain & Email (DNS) 설정
- **SPF Record**: 이메일이 스팸으로 분류되거나 발송 실패하는 것을 방지하기 위해 도메인 관리 페이지(Hostinger 등)에 아래 값을 추가합니다.
  - **Type**: TXT
  - **Value**: `v=spf1 include:_spf.mail.hostinger.com include:resend.com ~all`

---

## 4. 운영 시 주의사항 (Troubleshooting)

1. **Email Rate Limit**:
   - Supabase는 보안 상 동일 IP/이메일에 대해 **시간당 3건**의 메일 발송 제한을 둡니다. 테스트 시 너무 자주 시도하면 메일이 오지 않을 수 있으니 1시간 간격을 두거나 다른 주소로 테스트하세요.
2. **Z-Index (레이어 겹침)**:
   - 메뉴바(Header)가 다른 요소에 가려질 경우, `MainLandingClient.tsx`의 헤더 태그에 `relative z-[100]` 이상의 값을 부여하여 우선순위를 확보합니다.
3. **Database Cascades**:
   - 사용자 삭제 시 연관 데이터가 함께 지워지도록 테이블 정의 시 `ON DELETE CASCADE` 옵션이 설정되어 있는지 확인합니다.

---

이 가이드는 프로젝트의 '생존 가이드'이며, 새로운 인프라가 추가될 때마다 업데이트되어야 합니다.
