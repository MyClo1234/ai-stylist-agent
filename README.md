# AI Stylist Agent - 옷 이미지 특징 추출 앱

React + Vite 기반의 옷 이미지 특징 추출 웹 애플리케이션입니다. Gemini API를 사용하여 이미지에서 옷의 특징을 자동으로 추출하고 JSON 형식으로 저장합니다.

## 주요 기능

- 🖼️ **이미지 업로드**: 드래그 앤 드롭 또는 파일 선택으로 이미지 업로드
- 🤖 **AI 특징 추출**: Gemini API를 활용한 옷의 특징 자동 추출
  - 카테고리 (상의, 하의, 아우터 등)
  - 색상 및 톤
  - 패턴
  - 소재
  - 핏
  - 상세 정보 (넥라인, 소매, 길이 등)
  - 스타일 태그
  - 점수 (정장스러움, 따뜻함, 계절, 활용도)
- 💾 **JSON 저장**: 추출된 특징을 JSON 형식으로 자동 저장 및 다운로드

## 시작하기

### 프론트엔드 실행

```bash
cd ai-stylist-agent
npm install
npm run dev
```

### 백엔드 API 서버 실행

#### 방법 1: uv 사용 (권장)

uv는 빠른 Python 패키지 관리자이자 프로젝트 관리 도구입니다. **가상환경을 수동으로 만들 필요가 없습니다.** `uv sync` 명령어 하나로 모든 것을 자동으로 처리합니다.

1. uv 설치:
```bash
# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Mac/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. 프로젝트 설정 (한 번만 실행):
```bash
# 프로젝트 디렉토리에서 실행
# uv sync는 다음을 자동으로 수행합니다:
# - .python-version 파일을 읽어서 Python 버전 확인
# - 필요한 Python 버전이 없으면 자동으로 다운로드 및 설치
# - .venv 가상환경 자동 생성 (없으면 생성, 있으면 기존 것 사용)
# - pyproject.toml의 의존성 자동 설치
# --no-install-project: 이 프로젝트는 단일 스크립트이므로 패키지로 설치하지 않음
uv sync --no-install-project
```

> **중요**: 
> - `python -m venv .venv` 같은 수동 가상환경 생성은 **필요 없습니다**. `uv sync`가 자동으로 처리합니다!
> - `--no-install-project` 옵션은 이 프로젝트가 단일 스크립트 파일(`api_server.py`)이므로 패키지로 빌드하지 않도록 합니다.

3. Gemini API 키 설정:

#### 방법 2: 기존 방식 (venv + pip)

1. Python 가상환경 생성 및 활성화:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

2. 필요한 패키지 설치:
```bash
pip install -r requirements.txt
```

3. Gemini API 키 설정:

**방법 1: .env 파일 사용 (권장)**
프로젝트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가하세요:
```
GEMINI_API_KEY=your_api_key_here
```

**방법 2: 환경변수로 설정**
```bash
# Windows (PowerShell)
$env:GEMINI_API_KEY="your_api_key_here"

# Mac/Linux
export GEMINI_API_KEY=your_api_key_here
```

4. API 서버 실행:

**uv 사용 시 (가상환경 활성화 불필요):**
```bash
# 방법 1: uv run으로 직접 실행 (권장 - 가상환경 활성화 불필요)
uv run python api_server.py

# 방법 2: 가상환경을 활성화한 후 실행 (선택사항)
# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
# Windows (CMD)
.venv\Scripts\activate.bat
# Mac/Linux
source .venv/bin/activate

# 활성화 후
python api_server.py
```

> **팁**: `uv run`을 사용하면 가상환경을 활성화하지 않아도 자동으로 올바른 Python 환경에서 실행됩니다!

**기존 방식 사용 시:**
```bash
python api_server.py
```

서버가 `http://localhost:5000`에서 실행됩니다.

### Python 버전 관리

이 프로젝트는 uv를 사용하여 Python 버전을 관리합니다:

- **`.python-version`**: 프로젝트에서 사용할 Python 버전 지정 (현재: 3.12)
- **`pyproject.toml`**: 프로젝트 의존성 및 설정 관리

uv의 작동 방식:
1. `uv sync` 실행 시 `.python-version` 파일을 읽어서 Python 버전 확인
2. 해당 버전이 없으면 자동으로 다운로드 및 설치
3. `.venv` 가상환경 자동 생성 (이미 있으면 기존 것 사용)
4. `pyproject.toml`의 의존성 자동 설치

```bash
# 설치된 Python 버전 목록 확인
uv python list

# 특정 Python 버전 수동 설치 (보통 자동으로 설치되므로 불필요)
uv python install 3.12

# 프로젝트에 고정된 Python 버전 확인
uv python pin
```

### uv 주요 명령어

```bash
# 의존성 설치 및 가상환경 생성/업데이트
uv sync

# 가상환경 활성화 없이 스크립트 실행
uv run python api_server.py

# 패키지 추가
uv add 패키지명

# 패키지 제거
uv remove 패키지명

# 의존성 업데이트
uv sync --upgrade
```

## 사용 방법

1. `/wardrobe/new` 페이지로 이동
2. 이미지를 드래그 앤 드롭하거나 파일 선택 버튼 클릭
3. 이미지가 업로드되면 자동으로 특징 추출 시작
4. 추출 완료 후 결과 확인 및 JSON 다운로드 가능

## API 문서

자세한 API 문서는 [README_API.md](./README_API.md)를 참고하세요.

## 기술 스택

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Flask, Flask-CORS
- **AI**: Google Gemini API
- **Image Processing**: Pillow (PIL)
- **Python 관리**: uv (Python 버전 및 패키지 관리)
