# Deployment Guide

추천 배포 방식은 다음과 같습니다.

- Edge device: Windows 노트북에서 Python 스크립트 실행
- Backend/DB: Supabase
- Web dashboard: Vercel + Next.js

이 구성이 가장 단순하고, 카메라 접근 문제를 피하기 쉽고, 운영과 유지보수가 편합니다.

## 키 입력 위치

아래 표대로 넣으면 됩니다.

| 값 | 넣는 곳 | 용도 |
| --- | --- | --- |
| `SUPABASE_URL` | Windows edge 장비의 PowerShell 세션 또는 시스템 환경변수 | Python 엣지 스크립트가 Supabase REST API를 호출할 때 사용 |
| `SUPABASE_SERVICE_ROLE_KEY` | Windows edge 장비의 PowerShell 세션 또는 시스템 환경변수 | 엣지 장비에서 `room_logs`에 insert할 때 사용 |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel 환경변수 또는 `.env.local` | 웹 대시보드가 Supabase를 읽을 때 사용 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel 환경변수 또는 `.env.local` | 웹 대시보드가 공개 권한으로 `room_logs`를 읽을 때 사용 |

주의:

- `SUPABASE_SERVICE_ROLE_KEY`는 절대 웹에 넣지 않습니다.
- 웹 대시보드는 `NEXT_PUBLIC_`로 시작하는 공개용 값만 사용합니다.
- `SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_URL`은 보통 같은 프로젝트 URL입니다.

## 1. Supabase 준비

1. Supabase 프로젝트를 생성합니다.
2. `phase2_supabase_schema.sql` 내용을 Supabase SQL editor에서 실행합니다.
3. `room_logs` 테이블이 만들어졌는지 확인합니다.
4. RLS 정책은 현재 insert/select만 허용하는 형태이므로, 실제 운영 계정 정책에 맞게 조정합니다.

필요한 값:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Edge Device 배포

Windows 노트북에서 아래 순서로 실행합니다.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\windows-setup.ps1
.\windows-run-edge.ps1
```

권장 운영 방식:

- 엣지 단은 항상 카메라가 연결된 Windows 장비에서 실행합니다.
- 서비스 역할 키는 edge 장비에만 두고, GitHub에 올리지 않습니다.
- 환경변수는 `.env.local` 대신 PowerShell 세션 또는 Windows 시스템 환경변수로 관리합니다.

## 3. Web Dashboard 배포 on Vercel

1. GitHub 저장소를 Vercel에 연결합니다.
2. Framework preset은 Next.js로 둡니다.
3. 환경변수를 추가합니다.

Vercel 환경변수:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

빌드 설정은 기본값을 사용해도 됩니다.

- Build Command: `npm run build`
- Output Directory: `.next`

배포 후 웹 대시보드는 `app/page.tsx`를 통해 `phase3_dashboard_page.tsx`의 UI를 그대로 렌더링합니다.

## 4. Local Docker Verification

배포 전 로컬에서 확인하려면 Docker를 사용할 수 있습니다.

```powershell
docker compose up --build web
```

엣지 단은 카메라 접근이 필요하므로, Docker보다는 Windows 호스트 실행을 권장합니다.

## 5. 운영 체크리스트

- edge 장비에서 `phase1_edge_counter.py`가 주기적으로 `room_logs`에 insert하는지 확인
- 웹 대시보드에서 최신 로그가 반영되는지 확인
- Supabase 정책이 의도대로 최소 권한인지 확인
- 환경변수가 저장소에 커밋되지 않았는지 확인
