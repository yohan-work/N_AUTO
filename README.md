# 프론트엔드 트렌드 노션 자동 업데이터

이 프로젝트는 프론트엔드 최신 기술 및 트렌드를 자동으로 수집하여 Notion 데이터베이스에 매일 업데이트하는 도구입니다.

## 기능

- GitHub 트렌딩 프론트엔드 레포지토리 수집
- NPM 인기 프론트엔드 패키지 수집
- Dev.to 프론트엔드 관련 최신 아티클 수집
- 매일 자정에 자동으로 Notion 데이터베이스 업데이트

## 설정 방법

### 1. Notion API 키 발급

1. [Notion Integrations](https://www.notion.so/my-integrations) 페이지에 접속
2. "새 통합 만들기" 클릭
3. 통합 이름과 로고 설정 후 생성
4. 생성된 API 키(Secret) 복사하여 보관

### 2. Notion 데이터베이스 설정

1. Notion에서 새 데이터베이스 생성
2. 다음 속성을 추가:
   - 제목 (Title)
   - 날짜 (Date)
   - 소스 (Select): GitHub, NPM, Dev.to 옵션 추가
   - URL (URL)
   - 설명 (Text)
3. 데이터베이스 우측 상단 "공유" 버튼 클릭
4. 생성한 통합(Integration)을 선택하여 권한 부여
5. 데이터베이스 ID 확인: URL에서 `https://www.notion.so/{workspace}/{database_id}?` 형식으로 확인

### 3. GitHub 설정

1. 이 저장소를 자신의 GitHub 계정에 포크 또는 클론
2. GitHub 저장소 설정에서 다음 비밀값(Secrets) 추가:
   - `NOTION_API_KEY`: Notion API 키
   - `NOTION_DATABASE_ID`: Notion 데이터베이스 ID

## 로컬에서 실행하기

```bash
# 의존성 설치
npm install

# .env 파일 생성
echo "NOTION_API_KEY=your_notion_api_key" > .env
echo "NOTION_DATABASE_ID=your_notion_database_id" >> .env

# 실행
npm start
```

## 자동화 일정

GitHub Actions를 통해 매일 자정(UTC 기준)에 자동으로 실행됩니다. 