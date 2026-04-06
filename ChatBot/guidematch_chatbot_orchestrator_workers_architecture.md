# GuideMatch 챗봇 고도화 통합 설계 문서 (Orchestrator + Workers 버전)

이 문서는 GuideMatch 챗봇을 기존의 FAQ 유사도 매칭형 구조에서, 운영 가능한 RAG 기반 고객지원 챗봇으로 전환하기 위한 통합 설계 문서입니다.  
아래 내용은 이전에 설명한 1번~15번 항목을 하나의 실행 기준 문서로 재구성한 것입니다.  
이 문서는 여러 에이전트가 동시에 제멋대로 작업하는 방식이 아니라, **오케스트레이터 1개 + 역할별 워커 몇 개**가 순차적으로 협업하는 구조를 기준으로 작성되었습니다.

---

## 1. 목표 아키텍처

현재 구조는 사실상 아래와 같습니다.

```text
사용자 질문 → FAQ CSV TF-IDF 검색 → 가장 비슷한 답변 출력
```

이를 아래 구조로 변경하는 것이 목표입니다.

```text
[User Question]
      ↓
[Orchestrator]
      ↓
[Query Understanding Worker]
  - 한국어 정규화
  - 동의어 확장
  - 검색용 rewrite
  - intent/category/audience 추론
      ↓
[Retrieval Worker]
  ├─ BM25/Keyword Search
  └─ Vector Search (Embeddings)
      ↓
[Hybrid Merge]
      ↓
[Reranker Worker]
  - 상위 후보 20개 → 5개 재정렬
      ↓
[Answer Worker]
  - 검색 근거 안에서만 답변
  - 근거 없으면 추측 금지
  - 출처/관련 링크 제시
      ↓
[Eval/Logging Worker]
  - 질문 저장
  - 검색 결과 저장
  - 최종 답변 저장
  - grounded 여부 기록
  - 사용자 피드백 연결
      ↓
[Response + Citations]
```

핵심은 `FAQ 질문문장 매칭`이 아니라, `근거를 검색해서 답하는 구조`로 바꾸는 것입니다.

---

## 2. GuideMatch에 맞는 시스템 역할 분리

GuideMatch 챗봇은 단순 FAQ 모음이 아니라, 운영 정책과 서비스 규칙을 검색·인용해야 하는 구조가 되어야 합니다.

### 2-1. 저장해야 할 지식 종류

최소한 아래 6개 영역으로 나누는 것이 좋습니다.

1. 정책 문서
   - 취소/환불 규정
   - 정산/수수료 규정
   - 가이드 등록 조건
   - 계정/인증 정책

2. 운영 가이드
   - 예약 흐름
   - 고객 문의 처리
   - 분쟁 대응
   - 가이드 활동 절차

3. 상품/서비스 설명
   - 플랫폼 소개
   - 투어 이용 방식
   - 지역별 지원 여부

4. FAQ
   - 자주 묻는 질문
   - 단답형 응답 템플릿

5. 동의어/질문 패턴
   - “호스트” = “가이드”
   - “환불” = “취소 후 환급”
   - “예약 변경” = “일정 변경”

6. 대화 로그 기반 학습용 데이터
   - 실제 질문
   - 정답 여부
   - 검색 실패 여부
   - 개선 포인트

핵심 원칙은 FAQ 자체보다 `정책 원문`, `운영 가이드`, `서비스 설명`을 우선 지식베이스화하는 것입니다.

---

## 3. 추천 기술 스택

지금 Python 기반이라면 아래 스택이 가장 현실적입니다.

### 3-1. 최소 권장 스택

- Backend API: FastAPI
- Chat UI: 초기에는 Streamlit 유지 가능, 장기적으로는 Next.js 위젯 추천
- DB: PostgreSQL
- Vector Search: pgvector
- Keyword Search: PostgreSQL Full Text Search 또는 OpenSearch/Elasticsearch
- Embedding: OpenAI Embeddings API
- LLM Answering: OpenAI Responses API
- Reranker:
  - 1차는 rule-based/LLM rerank
  - 이후 필요 시 별도 reranker 모델
- Queue(Optional): Celery / RQ
- Logging/Analytics: Postgres + admin dashboard

### 3-2. 왜 pgvector가 좋은가

GuideMatch 규모에서는 초반부터 별도 벡터 DB를 붙이기보다 `Postgres + pgvector` 구성이 관리가 쉽습니다.

장점:
- 기존 운영 데이터와 벡터를 한 DB에 저장 가능
- 메타데이터 필터링이 쉬움
- 운영 복잡도가 낮음
- FAQ/정책/로그를 한곳에서 다룰 수 있음

---

## 4. DB 스키마 설계

### 4-1. knowledge_documents

문서 원본 메타 정보 저장용 테이블입니다.

```sql
CREATE TABLE knowledge_documents (
    id BIGSERIAL PRIMARY KEY,
    doc_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    source_url TEXT,
    language VARCHAR(10) DEFAULT 'ko',
    status VARCHAR(20) DEFAULT 'active',
    policy_version VARCHAR(50),
    category VARCHAR(100),
    audience VARCHAR(50),
    region VARCHAR(50),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 4-2. knowledge_chunks

RAG 검색의 핵심 테이블입니다.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    content_clean TEXT,
    token_count INT,
    embedding vector(1536),
    keywords TEXT[],
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 4-3. faq_pairs

기존 FAQ는 유지하되, 메인 소스가 아니라 보조 신호로 활용합니다.

```sql
CREATE TABLE faq_pairs (
    id BIGSERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    alt_questions TEXT[],
    category VARCHAR(100),
    audience VARCHAR(50),
    source_document_id BIGINT REFERENCES knowledge_documents(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4-4. synonym_dictionary

한국어 검색 품질 개선용 사전입니다.

```sql
CREATE TABLE synonym_dictionary (
    id BIGSERIAL PRIMARY KEY,
    canonical_term TEXT NOT NULL,
    synonym TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'ko',
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4-5. chat_sessions

```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY,
    user_id UUID,
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4-6. chat_messages

```sql
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4-7. retrieval_logs

정확도 개선의 핵심 로그입니다.

```sql
CREATE TABLE retrieval_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID,
    user_question TEXT NOT NULL,
    normalized_question TEXT,
    rewritten_query TEXT,
    retrieved_chunk_ids BIGINT[],
    reranked_chunk_ids BIGINT[],
    final_answer TEXT,
    confidence_score NUMERIC(5,4),
    grounded BOOLEAN,
    fallback_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4-8. feedback_labels

```sql
CREATE TABLE feedback_labels (
    id BIGSERIAL PRIMARY KEY,
    retrieval_log_id BIGINT REFERENCES retrieval_logs(id) ON DELETE CASCADE,
    user_feedback VARCHAR(30),
    admin_label VARCHAR(50),
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. 인덱스 설계

```sql
CREATE INDEX idx_knowledge_chunks_embedding
ON knowledge_chunks
USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_knowledge_chunks_fts
ON knowledge_chunks
USING GIN (to_tsvector('simple', content_clean));

CREATE INDEX idx_knowledge_documents_category
ON knowledge_documents(category);

CREATE INDEX idx_knowledge_documents_audience
ON knowledge_documents(audience);

CREATE INDEX idx_knowledge_documents_region
ON knowledge_documents(region);
```

초기에는 이 정도로 충분합니다.

---

## 6. 문서 적재 방식

현재는 `faq_data.csv` 중심이지만, 앞으로는 아래 2단계로 넣는 것이 좋습니다.

### 6-1. 원문 문서 적재

예:
- `refund_policy.md`
- `guide_onboarding.md`
- `payout_rules.md`
- `booking_faq.csv`

### 6-2. chunking

문서를 검색 가능한 조각으로 분할합니다.

권장 기준:
- 1 chunk = 약 250~500 토큰
- 문단 경계 우선
- 제목/소제목 포함
- overlap 50~100 토큰

예:

```text
[문서명] 환불 정책
[소제목] 고객이 예약 7일 전 취소하는 경우
[본문] ...
```

핵심은 chunk가 너무 길면 검색이 둔해지고, 너무 짧으면 문맥이 깨진다는 점입니다.

---

## 7. 검색 파이프라인 상세

### 7-1. Step 1: Query normalization

사용자 질문 예:
> 외국인 고객이 예약 취소하면 돈은 언제 환불돼?

정규화:
- 소문자화
- 특수문자 제거
- 띄어쓰기 정리
- 동의어 치환
  - 외국인 고객 → 고객
  - 돈 → 환불금
  - 예약 취소 → 취소

출력:
- original_query
- normalized_query
- rewritten_query

예:
- original: `외국인 고객이 예약 취소하면 돈은 언제 환불돼?`
- normalized: `고객 예약 취소 환불 언제`
- rewritten: `예약 취소 후 환불 시점 및 처리 기간`

### 7-2. Step 2: Hybrid retrieval

두 갈래로 동시에 검색합니다.

#### A. keyword search
- BM25 또는 Postgres FTS
- 정확한 정책 용어, 수수료, 코드명에 강함

#### B. vector search
- 임베딩 기반
- 표현이 달라도 의미가 비슷하면 잘 찾음

### 7-3. Step 3: Merge

간단 버전:
- keyword score 정규화
- vector score 정규화
- weighted sum

예:
- `final_score = 0.45 * keyword + 0.55 * vector`

### 7-4. Step 4: Rerank

상위 20개 chunk를 다시 정렬합니다.

방법:
1. rule-based
2. LLM rerank
3. 전용 reranker 모델

초기에는 LLM rerank도 충분히 실용적입니다.

### 7-5. Step 5: Answer generation

LLM에 전달:
- 사용자 질문
- 대화 히스토리 요약
- 상위 3~5개 근거 chunk
- 출력 규칙

---

## 8. Python 구현 순서

아래 순서가 가장 안전합니다.

### 1단계: 현재 프로젝트 구조 확장

권장 폴더 구조:

```text
guidematch-chatbot/
├─ app/
│  ├─ main.py
│  ├─ api/
│  │  ├─ chat.py
│  │  ├─ admin.py
│  │  └─ ingest.py
│  ├─ core/
│  │  ├─ config.py
│  │  ├─ db.py
│  │  └─ logging.py
│  ├─ services/
│  │  ├─ query_normalizer.py
│  │  ├─ embedder.py
│  │  ├─ retriever.py
│  │  ├─ reranker.py
│  │  ├─ answer_generator.py
│  │  ├─ orchestrator.py
│  │  └─ evaluator.py
│  ├─ repositories/
│  │  ├─ knowledge_repo.py
│  │  ├─ faq_repo.py
│  │  ├─ log_repo.py
│  │  └─ feedback_repo.py
│  ├─ workers/
│  │  ├─ query_worker.py
│  │  ├─ retrieval_worker.py
│  │  ├─ rerank_worker.py
│  │  ├─ answer_worker.py
│  │  └─ eval_worker.py
│  ├─ prompts/
│  │  ├─ system_prompt.txt
│  │  ├─ answer_prompt.txt
│  │  └─ rerank_prompt.txt
│  └─ models/
│     ├─ schemas.py
│     └─ entities.py
├─ scripts/
│  ├─ ingest_documents.py
│  ├─ build_embeddings.py
│  ├─ backfill_faq.py
│  └─ run_eval.py
├─ data/
│  ├─ raw/
│  ├─ processed/
│  └─ eval/
├─ streamlit_app.py
├─ requirements.txt
└─ README.md
```

### 2단계: 문서 적재 스크립트 구현

`scripts/ingest_documents.py`
- Markdown / CSV / TXT 읽기
- 문서 메타데이터 생성
- chunk 분할
- DB 저장

### 3단계: 임베딩 생성

`scripts/build_embeddings.py`
- chunk를 배치로 읽음
- OpenAI embeddings 생성
- `knowledge_chunks.embedding` 저장

### 4단계: Retriever 작성

`services/retriever.py`
- keyword retrieve
- vector retrieve
- hybrid merge
- metadata filter

### 5단계: Reranker 작성

`services/reranker.py`
- top 20 입력
- relevance 높은 5개만 추림

### 6단계: Answer generator 작성

`services/answer_generator.py`
- 근거 chunk + system prompt + user query
- citations 포함 답변 생성
- 근거 없으면 fallback

### 7단계: Orchestrator 작성

`services/orchestrator.py`
- 워커 실행 순서 제어
- 각 워커의 입력/출력 표준화
- 실패 시 fallback 적용
- 최종 response schema 구성

### 8단계: API 연결

`POST /chat`
- 입력: session_id, message
- 출력: answer, citations, confidence, suggested_questions

### 9단계: 로그/평가 대시보드 추가

- 오답률
- fallback 비율
- top-k hit rate
- category별 실패율

---

## 9. 처리 흐름 예시

```text
POST /chat
  ↓
save user message
  ↓
orchestrator.start()
  ↓
query_worker.run()
  ↓
retrieval_worker.run()
  ↓
rerank_worker.run()
  ↓
answer_worker.run()
  ↓
eval_worker.run()
  ↓
save retrieval log
  ↓
return answer + citations + suggestions
```

---

## 10. 답변 생성 프롬프트 예시

### 10-1. 시스템 프롬프트

```text
너는 GuideMatch 고객지원 챗봇이다.

목표:
- 사용자의 질문에 정확하고 근거 기반으로 답변한다.
- 반드시 제공된 검색 문서(Context) 안에서만 답한다.
- Context에 없는 내용은 추측하지 않는다.
- 정책, 환불, 정산, 계정, 법적 이슈는 특히 보수적으로 답한다.
- 정보가 부족하면 "확인 가능한 정보가 부족합니다"라고 말하고, 필요한 경우 운영팀 문의를 안내한다.

답변 규칙:
1. 먼저 사용자의 질문 의도를 한 줄로 파악한다.
2. 가장 직접적인 답을 먼저 짧게 말한다.
3. 이어서 필요한 세부 조건을 정리한다.
4. 가능하면 출처 문서명 또는 관련 항목명을 함께 제시한다.
5. 서로 충돌하는 내용이 있으면 최신 updated_at 기준으로 우선한다.
6. 확실하지 않은 내용은 단정하지 않는다.
7. 절대 Context 밖의 일반 상식으로 운영 정책을 만들어내지 않는다.

출력 형식:
- answer: 사용자에게 보여줄 자연스러운 답변
- citations: 사용한 문서 제목/섹션
- confidence: high / medium / low
- suggested_questions: 관련 후속 질문 2개
```

### 10-2. 답변 프롬프트 템플릿

```text
[USER QUESTION]
{{user_question}}

[CHAT SUMMARY]
{{chat_summary}}

[CONTEXT]
{{retrieved_chunks}}

지시:
- 사용자의 질문에 대해 Context에 근거해 답하라.
- Context에 직접 근거가 없으면 모른다고 답하라.
- 정책/수수료/환불/정산 관련 내용은 과장하거나 추측하지 말라.
- 답변은 친절하지만 짧고 명확하게 작성하라.
- 마지막에 관련 후속 질문 2개를 제안하라.

반드시 아래 JSON 형식으로 출력:
{
  "answer": "...",
  "citations": [
    {"title": "...", "chunk_id": 123}
  ],
  "confidence": "high|medium|low",
  "suggested_questions": ["...", "..."]
}
```

### 10-3. Rerank 프롬프트 예시

```text
질문:
{{user_question}}

후보 문서 조각들:
{{candidate_chunks}}

작업:
- 사용자의 질문에 가장 직접적으로 답하는 순서대로 상위 5개만 골라라.
- 단순히 키워드가 겹치는 문서보다 실제 답을 포함한 문서를 우선하라.
- 환불/정책/정산 질문이면 규정성 문서를 우선하라.
- 결과는 JSON 배열로 chunk_id만 반환하라.
```

---

## 11. 추천 응답 포맷

실서비스에서는 아래와 같은 반환 형태를 추천합니다.

```json
{
  "answer": "예약 취소 후 환불 시점은 결제 수단과 취소 시점에 따라 달라질 수 있습니다. 현재 GuideMatch 정책상 승인된 취소 건은 영업일 기준 3~5일 내 환불 처리됩니다.",
  "citations": [
    {
      "title": "환불 정책",
      "section": "취소 후 환불 처리 기간",
      "source_url": "https://guidematch.com/policies/refund"
    }
  ],
  "confidence": "high",
  "suggested_questions": [
    "예약 당일 취소도 환불 가능한가요?",
    "카드 결제 환불은 실제 입금까지 얼마나 걸리나요?"
  ]
}
```

---

## 12. 정확도 개선용 운영 루프

이 부분이 성능을 계속 올리는 핵심입니다.

### 12-1. 사용자 피드백 버튼
답변 아래:
- 도움이 됐어요
- 틀렸어요
- 애매해요
- 최신 정보가 아니에요

### 12-2. 관리자 라벨링
틀린 답변이 들어오면 운영자가 아래 중 하나로 분류:
- retrieval_fail
- rerank_fail
- hallucination
- outdated_doc
- missing_doc
- prompt_fail

### 12-3. 매주 할 일
- 많이 틀린 질문 top 20 확인
- 신규 FAQ 또는 정책 문서 보강
- synonym 추가
- chunk 재분할
- prompt 보정

---

## 13. MVP 구현 우선순위

처음부터 다 하지 말고 아래 순서로 가는 것이 좋습니다.

### Phase 1 — 1차 개선
- Postgres + pgvector 도입
- `knowledge_documents`, `knowledge_chunks`, `faq_pairs` 생성
- FAQ CSV → chunk 적재
- embeddings 생성
- hybrid retrieve 구현
- citations 포함 답변 출력

### Phase 2 — 품질 개선
- synonym dictionary
- query rewrite
- reranker 추가
- confidence scoring
- fallback answer 정교화

### Phase 3 — 운영화
- admin 업로드 페이지
- 문서 버전 관리
- feedback dashboard
- eval dataset 자동화
- category별 성능 측정

---

## 14. Streamlit을 계속 써도 되나?

초기에는 가능합니다.  
하지만 운영형 챗봇이라면 장기적으로는 아래 구성이 더 좋습니다.

- 프론트: Next.js 위젯
- 백엔드: FastAPI
- 챗봇 API 분리

이유:
- iframe/임베드 유연성
- 인증 연동
- 로깅/모니터링 분리
- 응답 캐싱/timeout 관리 쉬움

정리하면:
- **지금 당장**: Streamlit 유지 가능
- **운영 전환 시**: Next.js + FastAPI 권장

---

## 15. 현실적인 최종 권장안

GuideMatch 상황에서는 아래가 가장 적절합니다.

### 바로 해야 할 것
1. `faq_data.csv`만 보지 말고 정책 원문/운영문서를 먼저 정리
2. Postgres + pgvector로 chunk 저장
3. OpenAI embeddings로 vector search 추가
4. keyword + vector hybrid retrieval
5. 답변은 반드시 근거 기반 + citations
6. `retrieval_logs`, `feedback_labels`로 오답 분석 루프 구축

### 나중에 해도 되는 것
- 파인튜닝
- 복잡한 에이전트 구조
- 멀티턴 고급 메모리
- 대규모 벡터 DB 분리

즉, 정확도를 올리는 핵심은  
**Q&A를 무작정 더 저장하는 것**이 아니라,  
**지식 문서화 + 하이브리드 검색 + 재정렬 + 근거 기반 답변 + 평가 루프**입니다.

---

## 16. 에이전트 구조: 오케스트레이터 1개 + 역할별 워커

### 16-1. 최종 권장 구조

GuideMatch에는 아래 구조를 권장합니다.

```text
[Orchestrator]
   ├─ Query Understanding Worker
   ├─ Retrieval Worker
   ├─ Rerank Worker
   ├─ Answer Worker
   └─ Eval/Logging Worker
```

이 구조의 핵심 원칙은 다음과 같습니다.

- 오케스트레이터는 **흐름 제어만 담당**
- 각 워커는 **하나의 역할만 담당**
- 워커끼리는 직접 호출하지 않고 **항상 오케스트레이터를 통해 연결**
- 최종 응답 포맷은 오케스트레이터가 통일

### 16-2. 왜 이 구조가 좋은가

단일 에이전트 하나에 모든 역할을 넣으면:
- 디버깅이 어려움
- 프롬프트가 비대해짐
- 검색 실패인지 생성 실패인지 분리하기 어려움

반대로 에이전트를 너무 많이 나누면:
- 호출 비용 증가
- 응답 지연 증가
- 상태 관리 복잡
- 워커 간 충돌 가능성 증가

따라서 GuideMatch에는 **오케스트레이터 1개 + 워커 4~5개**가 가장 균형이 좋습니다.

---

## 17. 각 워커의 책임 정의

### 17-1. Orchestrator

역할:
- 전체 실행 순서 관리
- 각 워커의 입출력 스키마 강제
- 실패 시 fallback 적용
- 최종 응답 조립
- 실행 로그 ID 연결

입력:
- session_id
- user_message
- optional chat_history_summary

출력:
- final answer
- citations
- confidence
- suggested questions
- debug metadata

오케스트레이터는 직접 답변을 길게 생성하지 않습니다.  
핵심은 **제어, 검증, 조립**입니다.

---

### 17-2. Query Understanding Worker

역할:
- 질문 의도 파악
- 정규화
- 동의어 확장
- query rewrite
- category / audience / region 추론
- 검색 필터 추천

예:
- “가이드 등록하려면 뭐가 필요해요?”
  - intent: onboarding
  - category: guide_registration
  - audience: guide

입력:
- raw user question
- optional recent turns

출력 예시:

```json
{
  "original_query": "가이드 등록하려면 뭐가 필요해요?",
  "normalized_query": "가이드 등록 필요 조건",
  "rewritten_query": "가이드 등록 자격 요건 및 제출 서류",
  "intent": "onboarding",
  "category": "guide_registration",
  "audience": "guide",
  "region": "all",
  "filters": {
    "doc_type": ["policy", "guide", "faq"],
    "audience": ["guide", "all"]
  }
}
```

---

### 17-3. Retrieval Worker

역할:
- keyword search
- vector search
- hybrid merge
- metadata filter 적용
- top-k 후보 반환

입력:
- normalized_query
- rewritten_query
- filters

출력 예시:

```json
{
  "retrieved": [
    {"chunk_id": 101, "keyword_score": 0.91, "vector_score": 0.83, "merged_score": 0.87},
    {"chunk_id": 205, "keyword_score": 0.71, "vector_score": 0.89, "merged_score": 0.81}
  ]
}
```

주의:
- 답변 문장 생성 금지
- 검색 결과와 점수만 반환

---

### 17-4. Rerank Worker

역할:
- Retrieval Worker가 준 상위 후보를 relevance 기준으로 재정렬
- 실제 답변 가능성이 높은 3~5개 선별

입력:
- user question
- retrieved candidate chunks

출력 예시:

```json
{
  "reranked_chunk_ids": [205, 101, 330, 118, 402]
}
```

주의:
- rerank 단계에서는 단순 키워드 일치보다 **실제 답이 들어 있는 chunk**를 우선

---

### 17-5. Answer Worker

역할:
- 상위 근거 chunk만 바탕으로 답변 생성
- citations 생성
- confidence 추정
- 후속 질문 추천
- 근거 없으면 fallback

입력:
- user question
- reranked top chunks
- system prompt
- answer prompt

출력 예시:

```json
{
  "answer": "가이드 등록을 위해서는 기본 프로필 작성과 신원 확인 서류 제출이 필요합니다. 추가로 지역별 운영 정책에 따라 승인 절차가 다를 수 있습니다.",
  "citations": [
    {"title": "가이드 등록 정책", "chunk_id": 205},
    {"title": "가이드 온보딩 가이드", "chunk_id": 101}
  ],
  "confidence": "high",
  "suggested_questions": [
    "승인까지 보통 얼마나 걸리나요?",
    "필요한 신분 확인 서류는 무엇인가요?"
  ],
  "fallback_used": false
}
```

주의:
- Context 밖 추론 금지
- 확실하지 않으면 confidence를 낮추고 fallback 사용

---

### 17-6. Eval/Logging Worker

역할:
- 전체 실행 기록 저장
- grounded 여부 표시
- fallback 여부 기록
- 나중에 관리자 피드백과 연결

입력:
- raw question
- normalized query
- retrieved ids
- reranked ids
- final answer
- confidence
- fallback_used

출력 예시:

```json
{
  "retrieval_log_id": 98765,
  "grounded": true
}
```

주의:
- 이 워커는 사용자에게 직접 보여줄 답변을 만들지 않음
- 운영 분석을 위한 기록 전담

---

## 18. 워커 실행 순서와 입출력 계약

### 18-1. 실행 순서

```text
1. Orchestrator receives user message
2. Query Understanding Worker runs
3. Retrieval Worker runs
4. Rerank Worker runs
5. Answer Worker runs
6. Eval/Logging Worker runs
7. Orchestrator returns final response
```

### 18-2. 공통 계약 원칙

모든 워커는 아래 원칙을 지켜야 합니다.

- 입력은 JSON 스키마로 고정
- 출력도 JSON 스키마로 고정
- 워커는 자기 역할 외 판단 최소화
- 에러는 예외 대신 structured error로 반환
- 오케스트레이터가 fallback 결정

예:

```json
{
  "ok": false,
  "error_code": "NO_RETRIEVAL_RESULT",
  "message": "No candidate chunks found."
}
```

---

## 19. 오케스트레이터 동작 규칙

오케스트레이터는 아래 규칙으로 동작합니다.

1. Query Worker 실패 시
   - 원문 질문 그대로 Retrieval Worker에 전달

2. Retrieval Worker 결과가 비어 있으면
   - fallback answer 경로로 이동

3. Rerank Worker 실패 시
   - retrieval top-k를 그대로 Answer Worker로 전달

4. Answer Worker confidence가 low이고 citation이 없으면
   - “확인 가능한 정보가 부족합니다” 템플릿 사용

5. Eval Worker 실패는 사용자 응답을 막지 않음
   - 로그 실패만 내부 경고 처리

즉, 오케스트레이터는 전체 시스템의 **안전장치** 역할을 합니다.

---

## 20. 구현 방식: 진짜 에이전트보다 먼저 모듈형 파이프라인으로

실무적으로는 처음부터 복잡한 에이전트 프레임워크를 붙이기보다 아래처럼 구현하는 것이 가장 안정적입니다.

### 초기 권장 방식
- Python 함수 기반 워커
- 서비스 레이어에서 오케스트레이션
- 각 워커는 독립 함수 또는 클래스

예:
- `query_worker.run()`
- `retrieval_worker.run()`
- `rerank_worker.run()`
- `answer_worker.run()`
- `eval_worker.run()`

즉, **에이전트처럼 역할은 분리하되, 구현은 단순한 모듈형 파이프라인**으로 시작하는 것이 좋습니다.

---

## 21. 추천 파일 구조 (오케스트레이터 중심)

```text
guidematch-chatbot/
├─ app/
│  ├─ main.py
│  ├─ api/
│  │  └─ chat.py
│  ├─ core/
│  │  ├─ config.py
│  │  ├─ db.py
│  │  └─ logger.py
│  ├─ services/
│  │  ├─ orchestrator.py
│  │  ├─ retriever.py
│  │  ├─ embedder.py
│  │  └─ prompt_loader.py
│  ├─ workers/
│  │  ├─ query_worker.py
│  │  ├─ retrieval_worker.py
│  │  ├─ rerank_worker.py
│  │  ├─ answer_worker.py
│  │  └─ eval_worker.py
│  ├─ repositories/
│  │  ├─ knowledge_repo.py
│  │  ├─ log_repo.py
│  │  └─ feedback_repo.py
│  ├─ prompts/
│  │  ├─ system_prompt.txt
│  │  ├─ answer_prompt.txt
│  │  └─ rerank_prompt.txt
│  └─ schemas/
│     ├─ query_schema.py
│     ├─ retrieval_schema.py
│     ├─ answer_schema.py
│     └─ response_schema.py
├─ scripts/
│  ├─ ingest_documents.py
│  ├─ build_embeddings.py
│  └─ run_eval.py
└─ README.md
```

---

## 22. 최종 결론

GuideMatch에는 아래 방식이 가장 적절합니다.

### 하지 말아야 할 것
- 하나의 거대한 에이전트에 모든 책임 몰아넣기
- 유행만 보고 에이전트를 10개 이상 쪼개기
- 워커끼리 서로 직접 호출하게 만들기

### 추천하는 것
- **오케스트레이터 1개**
- **워커 4~5개**
- **각 워커는 단일 책임**
- **입출력 JSON 스키마 고정**
- **오케스트레이터가 순서/실패/fallback 통제**

즉, GuideMatch에는  
**“복잡한 멀티에이전트 시스템”보다 “오케스트레이터 중심의 모듈형 워커 구조”**가 가장 깔끔하고 오류 없이 운영하기 좋습니다.

---

## 23. 바로 실행할 추천 순서

1. 이 문서를 기준으로 폴더 구조 정리
2. Postgres + pgvector 세팅
3. 문서 적재 스크립트 작성
4. Query / Retrieval / Answer Worker부터 구현
5. 이후 Rerank Worker 추가
6. 마지막으로 Eval/Logging Worker와 관리자 피드백 루프 연결

가장 처음 MVP는 아래 4개만 있어도 충분합니다.

- Orchestrator
- Query Worker
- Retrieval Worker
- Answer Worker

그 다음에:
- Rerank Worker
- Eval/Logging Worker

를 붙이면 됩니다.
