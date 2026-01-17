# AI Stylist Agent

AI 기반 스마트 옷장 관리 및 코디 추천 서비스입니다. Gemini API를 활용하여 옷의 특징을 자동으로 추출하고, 저장된 옷들을 기반으로 개인화된 코디를 추천합니다.

## ✨ 주요 기능

- 🖼️ **이미지 업로드 및 특징 추출**: 드래그 앤 드롭으로 여러 이미지를 한 번에 업로드하고 AI가 자동으로 특징 추출
- 👔 **옷장 관리**: 카테고리별 필터링, 이미지 표시, 아이템 상세 정보
- 🎨 **코디 추천**: Rule-based + Gemini 하이브리드 방식으로 최적의 코디 추천
- 📅 **캘린더 관리**: 코디 저장 및 착용 기록 관리
- 📊 **점수 계산**: 색상 조화, 스타일 매칭, 정장스러움 등을 종합한 코디 점수

## 🚀 시작하기

### 필수 요구사항

- Node.js 18+ (프론트엔드)
- Python 3.12+ (백엔드)
- Gemini API 키

### 프론트엔드 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드는 `http://localhost:5173`에서 실행됩니다.

### 백엔드 API 서버 실행

#### 방법 1: uv 사용 (권장)

```bash
# uv 설치 (한 번만)
# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Mac/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# 프로젝트 설정 (의존성 설치 및 가상환경 생성)
uv sync --no-install-project

# 서버 실행
uv run python api_server.py
```

#### 방법 2: 기존 방식 (venv + pip)

```bash
# 가상환경 생성 및 활성화
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python api_server.py
```

### 환경변수 설정

프로젝트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```
GEMINI_API_KEY=your_api_key_here
```

또는 환경변수로 설정:

```bash
# Windows (PowerShell)
$env:GEMINI_API_KEY="your_api_key_here"

# Mac/Linux
export GEMINI_API_KEY=your_api_key_here
```

서버가 `http://localhost:5000`에서 실행됩니다.

## 📖 사용 방법

### 1. 옷 추가하기

1. `/wardrobe/new` 페이지로 이동
2. 이미지를 드래그 앤 드롭하거나 파일 선택 버튼 클릭
   - **지원 형식**: JPG, PNG, GIF, WEBP
   - **파일 크기 제한**: 최대 10MB
   - **최대 업로드 개수**: 20개
3. 이미지가 업로드되면 자동으로 특징 추출 시작
4. 추출 완료 후 옷장에서 확인 가능

### 2. 코디 추천 받기

1. 홈 페이지(`/`)에서 자동으로 코디 추천
2. 추천된 코디의 점수, 스타일 설명, 추천 이유 확인
3. "Wear This" 버튼으로 상세 페이지 이동

### 3. 옷장 관리

1. Profile → Wardrobe 탭에서 모든 옷 확인
2. 카테고리 필터링 (All, Outerwear, Tops, Bottoms, Shoes, Accessories)
3. 아이템 클릭으로 상세 정보 확인

### 4. 캘린더 관리

1. Profile → Calendar 탭에서 월별 캘린더 확인
2. 코디 상세 페이지에서 "Save to Calendar"로 저장
3. "Worn Today" 토글로 착용 기록 관리

## 🔌 API 엔드포인트

### 주요 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `GET` | `/api/health` | 서버 상태 확인 |
| `POST` | `/api/extract` | 이미지 업로드 및 특징 추출 |
| `GET` | `/api/wardrobe/items` | 옷장 아이템 목록 조회 |
| `GET` | `/api/recommend/outfit` | 코디 추천 |
| `GET` | `/api/outfit/score` | 특정 조합의 점수 계산 |
| `GET` | `/api/images/<filename>` | 이미지 파일 서빙 |

### 예시: 코디 추천

```bash
# 기본 추천 (1개)
GET /api/recommend/outfit?count=1

# 계절 필터링
GET /api/recommend/outfit?count=3&season=winter

# 정장스러움 필터링
GET /api/recommend/outfit?count=2&formality=0.8

# Rule-based만 사용
GET /api/recommend/outfit?count=1&use_gemini=false
```

### 예시: 점수 계산

```bash
GET /api/outfit/score?top_id=attributes_20241223_123456&bottom_id=attributes_20241223_123457
```

## 🎯 추출되는 특징

- **카테고리**: main (outer, top, bottom 등), sub (coat, tshirt, jeans 등)
- **색상**: primary, secondary, tone (dark, mid, light 등)
- **패턴**: solid, stripe, check, dot, graphic, floral 등
- **소재**: cotton, denim, knit, wool, leather 등
- **핏**: slim, regular, oversized, wide
- **상세 정보**: neckline, sleeve, length, closure, print_or_logo
- **스타일 태그**: minimal, classic, street, sporty, feminine, vintage, business, formal, casual
- **점수**: formality (0.0-1.0), warmth (0.0-1.0), season (배열), versatility (0.0-1.0)
- **메타 정보**: is_layering_piece, notes, confidence

## 🧠 코디 추천 알고리즘

### Rule-Based 점수 계산

- **색상 조화** (40%): 색상 휠 기반 조화 점수
  - Complementary (보색): 0.95점
  - Analogous (유사색): 0.85점
  - Monochromatic (단색): 0.9점
- **스타일 태그 매칭** (30%): 공통 스타일 태그 기반
- **Formality 일치** (20%): 정장스러움 점수 차이
- **계절 일치** (10%): 공통 계절 여부

### Gemini 하이브리드 추천

1. Rule-based로 모든 조합 사전 필터링
2. 상위 5개만 Gemini에 전달 (프롬프트 최적화)
3. Gemini가 최종 추천 및 설명 생성
4. 실패 시 자동으로 Rule-based로 폴백

## 📁 프로젝트 구조

```
ai-stylist-agent/
├── api_server.py              # Flask 백엔드 서버
├── requirements.txt            # Python 의존성
├── pyproject.toml             # uv 프로젝트 설정
├── .env                       # 환경변수 (GEMINI_API_KEY)
├── extracted_attributes/      # 저장된 옷 데이터 (자동 생성)
│   ├── attributes_*.json      # 특징 데이터
│   └── attributes_*.jpg       # 원본 이미지
├── src/
│   ├── App.jsx                # 라우팅 설정
│   ├── main.jsx               # 진입점
│   ├── components/
│   │   └── Navbar.jsx         # 네비게이션 바
│   └── pages/
│       ├── Home.jsx           # 홈 (코디 추천)
│       ├── WardrobeNew.jsx    # 옷 추가
│       ├── ItemDetail.jsx     # 아이템 상세
│       ├── OutfitDetail.jsx   # 코디 상세
│       ├── Profile.jsx         # 프로필 (옷장, 캘린더, 설정)
│       ├── Login.jsx           # 로그인
│       └── Onboarding.jsx     # 온보딩
└── README.md                   # 이 파일
```

## 🛠️ 기술 스택

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Routing**: React Router v6
- **Icons**: Lucide React

### Backend
- **Framework**: Flask
- **CORS**: Flask-CORS
- **AI**: Google Gemini API (gemini-2.5-flash)
- **Image Processing**: Pillow (PIL)
- **Environment**: python-dotenv

### 데이터 저장
- **옷 특징 데이터**: JSON 파일 (`extracted_attributes/` 폴더)
- **이미지 파일**: 파일 시스템 (`extracted_attributes/` 폴더)
- **사용자 데이터**: localStorage (캘린더, 착용 기록, 코디 히스토리)

### Python 관리
- **패키지 관리**: uv (Python 버전 및 패키지 관리)
- **Python 버전**: 3.12 (`.python-version` 파일로 관리)

## 🔧 최근 개선 사항

- ✅ Gemini 추천 파싱 개선: 배열과 객체 모두 처리
- ✅ 파일명 충돌 방지: 밀리초 + 랜덤 suffix 추가
- ✅ OutfitDetail 점수 계산: 전용 엔드포인트 추가
- ✅ 업로드 제한: 파일 크기(10MB), 타입, 개수(20개) 검증
- ✅ 문서 업데이트: 실제 구조에 맞게 정리

## 📝 라이선스

이 프로젝트는 개인 프로젝트입니다.

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

---

**최종 업데이트**: 2026-01-16
