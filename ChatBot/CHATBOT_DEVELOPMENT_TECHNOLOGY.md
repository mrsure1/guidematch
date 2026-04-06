# 🤖 ChatBot 기술 스택 및 개발 가이드

GuideMatch 서비스의 FAQ 응대를 위한 챗봇 시스템 기술 스택 정리입니다.

## 1. 핵심 기술 스택 (Core Tech Stack)

- **Language**: Python 3.x
- **UI Framework**: [Streamlit](https://streamlit.io/) (빠른 웹 인터페이스 구축 및 프로토타이핑)
- **Data Analysis**: Pandas (FAQ 데이터 로드 및 관리)
- **Machine Learning/NLP**:
  - `scikit-learn`: TF-IDF 벡터화 및 코사인 유사도(Cosine Similarity) 계산
  - `Custom NLP Logic`: 한국어 특성을 고려한 정규식 기반 텍스트 정규화 및 어미(Suffix) 처리 로직

## 2. 프로젝트 구조 (Project Structure)

- `streamlit_app.py`: 웹 UI 레이아웃, 세션 상태 관리, 스타일링(CSS) 및 이벤트 핸들링
- `faq_chatbot.py`: 검색 엔진 핵심 로직 (전처리, 토큰화, 유사도 계산)
- `create_faq_data.py`: FAQ 지식 베이스(`faq_data.csv`) 생성 및 데이터 정제 스크립트
- `faq_data.csv`: 챗봇이 답변을 생성하는 기준이 되는 질문-답변 데이터 세트
- `chat_logs/`: 사용자 대화 로그(JSONL) 자동 저장 및 분석용 데이터 축적

## 3. 주요 기능 및 특징

1. **임베디드(Embed) 모드**: Next.js 기반 메인 웹사이트의 iframe 내에서 구동될 수 있도록 `?embed=1` 파라미터에 대응하는 전용 테마를 지원합니다.
2. **실시간 검색 및 추천**: 사용자의 질문과 가장 유사한 FAQ를 즉시 찾아 답변하며, 상위 3개의 연관 질문을 함께 추천합니다.
3. **고급 스타일링**: Streamlit의 기본 레이아웃을 넘어선 커스텀 CSS 주입을 통해 프리미엄 위젯 디자인(Glassmorphism, 애니메이션 효과 등)을 구현했습니다.
4. **운영 편의성**: 새로운 FAQ 내용을 `faq_data.csv`에 추가하는 것만으로 챗봇의 지식 범위를 쉽게 확장할 수 있습니다.

---
*최종 업데이트: 2026-04-06*
