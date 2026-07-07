# 자양한강도서관 스터디 공간 자동 인원 카운팅 시스템
2026 자양한강도서관 운영 개선 프로젝트

별도의 앱 설치 없이, 웹캠 기반 AI와 웹 대시보드로 스터디 공간 인원을 자동 집계하는 시스템입니다.

## 📖 프로젝트 배경

"수기로 인원을 세고 전달하는 방식 때문에 운영자가 자리를 비워야 할까?"

본 프로젝트는 자양한강도서관의 스터디 공간 운영에서 발견한 수기 체크의 비효율을 개선하기 위해 시작되었습니다.
기존 방식은 운영자에게 반복적인 확인 업무를 요구하고, 이용 현황을 즉시 파악하기 어렵다는 한계가 있었습니다.

이 문제를 해결하기 위해, 웹캠으로 사람 수를 자동 인식하고 실시간으로 웹 대시보드에 반영되는 구조를 설계했습니다.

## 📱 서비스 시연 (Service Flow)

### 1. 간편한 인원 감지 (Edge Device)
Windows 노트북에 연결된 웹캠에서 프레임을 캡처하고, YOLOv8n으로 사람(person) 클래스만 카운트합니다.
이미지는 저장하지 않으며, 프레임은 즉시 폐기하여 개인정보 노출을 줄입니다.

### 2. 실시간 데이터 적재 (Supabase)
인식된 인원수는 일정 주기마다 Supabase `room_logs` 테이블에 저장됩니다.
엣지 장비는 `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`를 사용해 REST API로 데이터를 전송합니다.

### 3. 실시간 관리자 대시보드 (Web Dashboard)
관리자는 웹 브라우저에서 현재 인원 상태와 최근 변화 추이를 확인할 수 있습니다.
`room_logs` 데이터를 기반으로 신호등 상태와 간단한 추이 그래프를 보여줍니다.

## 🚀 문제 해결 (Problem Solving)

| 구분 | 기존 방식 (As-Is) | 개선된 시스템 (To-Be) |
| --- | --- | --- |
| 인원 확인 | 사람이 직접 세고 기록 | 웹캠 + AI가 자동 카운트 |
| 기록 방식 | 수기 메모 또는 별도 전달 | Supabase DB에 즉시 적재 |
| 운영 효율 | 반복 확인과 이동이 필요 | 대시보드로 한눈에 확인 |
| 데이터 활용 | 일회성 확인에 그침 | 시간대별 이용 패턴 분석 가능 |
| 개인정보 | 이미지 저장 가능성 존재 | 프레임 즉시 폐기, 저장 최소화 |

## 🛠 기술 스택 (Tech Stack)

| 구분 | 기술 (Stack) | 상세 내용 |
| --- | --- | --- |
| Edge AI | Python 3 | 웹캠 캡처 및 카운팅 로직 |
| Vision | OpenCV / Ultralytics YOLOv8n | 사람 클래스만 검출 |
| Backend / DB | Supabase (PostgreSQL) | `room_logs` 저장 및 조회 |
| Frontend | Next.js | 실시간 웹 대시보드 |
| Styling | Tailwind CSS | 반응형 UI 스타일링 |
| Data Fetch | REST API | Supabase와의 데이터 송수신 |

## ⚙ 실행 방법

### 1) Windows 엣지 단 실행
PowerShell에서 아래 순서대로 실행합니다.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\windows-setup.ps1
.\windows-run-edge.ps1
```

또는 전체를 한 번에 띄우려면:

```powershell
.\windows-run-all.ps1
```

### 2) 웹 대시보드 실행
Next.js 프로젝트를 실행합니다.

```powershell
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 을 엽니다.

### 3) Supabase 스키마 적용
Supabase SQL editor에서 `phase2_supabase_schema.sql` 내용을 실행합니다.

## 🔐 환경변수

### 엣지 장비용
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 웹 대시보드용
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

주의:
- `SUPABASE_SERVICE_ROLE_KEY`는 웹에 넣지 않습니다.
- 웹에서는 `NEXT_PUBLIC_`로 시작하는 공개 키만 사용합니다.
- `.env.local`은 Git에 올라가지 않도록 `.gitignore`에 포함되어 있습니다.

## 🐳 Docker 실행

웹 대시보드는 Docker로도 실행할 수 있습니다.

```powershell
docker compose up --build web
```

엣지 카운터를 컨테이너로 실행하는 경우에는 `edge` profile을 사용합니다.

```powershell
docker compose --profile edge up edge
```

주의: 엣지 단은 카메라 접근이 필요하므로 실제 운영에서는 Windows 호스트에서 직접 실행하는 방식을 권장합니다.

## 🌐 배포 가이드

권장 배포 구조와 자세한 운영 절차는 [DEPLOYMENT.md](DEPLOYMENT.md) 를 참고합니다.

## 📁 주요 파일

- `phase1_edge_counter.py`는 웹캠에서 사람 수를 카운트하고 Supabase로 전송합니다.
- `phase2_supabase_schema.sql`은 `room_logs` 테이블과 기본 정책을 정의합니다.
- `phase3_dashboard_page.tsx`는 실시간 대시보드 UI를 담당합니다.
- `app/page.tsx`는 Next.js App Router의 실제 진입점입니다.
- `windows-setup.ps1`, `windows-run-edge.ps1`, `windows-run-web.ps1`, `windows-run-all.ps1`, `launch-all.ps1`는 새 Windows 노트북에서 바로 실행할 수 있는 런처입니다.

## ✅ 필요한 정보

GitHub 업로드나 발표 자료를 더 완성도 있게 만들고 싶다면 아래 정보가 추가되면 좋습니다.

- 프로젝트 최종 발표용 대표 이미지 또는 스크린샷
- 작성자 이름 또는 팀명
- 발표용 한 줄 소개
- 필요 시 연락처 또는 이메일

## 📌 참고

이 저장소는 자양한강도서관의 스터디 공간 운영 효율을 높이기 위한 MVP입니다.
실제 운영 환경에서는 카메라 위치, 조도, 좌석 구조에 따라 카운팅 정확도를 추가 조정할 수 있습니다.
