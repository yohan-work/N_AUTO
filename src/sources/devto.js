import axios from 'axios';

export async function getDevToArticles(maxItems = 10, maxDaysAgo = 7) {
  try {
    console.log('Dev.to 프론트엔드 관련 아티클 가져오는 중...');
    
    // 프론트엔드 관련 태그 목록 (확장)
    const frontendTags = [
      'javascript', 'react', 'vue', 'typescript', 'frontend', 
      'webdev', 'css', 'html', 'angular', 'svelte',
      'nextjs', 'tailwind', 'webpack', 'vite', 'styledcomponents',
      'redux', 'graphql', 'api', 'pwa'
    ];
    
    const articles = [];
    
    // 데이터 수집 상태 (추적용)
    const collectionStats = {
      totalAttempted: 0,
      totalCollected: 0,
      perTag: {}
    };
    
    // 각 태그별로 최신 아티클 검색
    for (const tag of frontendTags) {
      try {
        collectionStats.perTag[tag] = { attempted: 0, collected: 0 };
        
        // 다양한 정렬 방식으로 조회
        for (const stateParam of ['rising', 'fresh', 'relevant']) {
          // published_at으로 정렬하여 최신 글 먼저 가져오기
          const response = await axios.get(`https://dev.to/api/articles?tag=${tag}&top=10&state=${stateParam}`);
          
          if (response.data && Array.isArray(response.data)) {
            // 인기 있는 아티클 처리
            const filteredArticles = response.data.slice(0, 10);
            collectionStats.totalAttempted += filteredArticles.length;
            collectionStats.perTag[tag].attempted += filteredArticles.length;
            
            for (const article of filteredArticles) {
              // 게시 날짜 파싱 및 너무 오래된 글 건너뛰기
              const publishedDate = new Date(article.published_at || new Date());
              const now = new Date();
              const diffDays = Math.floor((now - publishedDate) / (1000 * 60 * 60 * 24));
              
              if (diffDays > maxDaysAgo) {
                continue; // 설정한 기간보다 오래된 글은 건너뛰기
              }
              
              // 이미 추가된 아티클은 건너뛰기 (URL 기준)
              if (articles.some(a => a.url === (article.url || `https://dev.to${article.path}`))) {
                continue;
              }
              
              // 이미 추가된 비슷한 제목의 아티클은 건너뛰기
              const similarTitleExists = articles.some(a => {
                // 제목이 80% 이상 유사하면 중복으로 간주
                const shorterTitle = a.title.length < article.title.length ? a.title : article.title;
                const longerTitle = a.title.length >= article.title.length ? a.title : article.title;
                return longerTitle.toLowerCase().includes(shorterTitle.toLowerCase().substring(0, Math.floor(shorterTitle.length * 0.8)));
              });
              
              if (similarTitleExists) {
                continue;
              }
              
              articles.push({
                title: article.title,
                description: article.description || `${tag} 관련 아티클`,
                url: article.url || `https://dev.to${article.path}`,
                publishedAt: publishedDate,
                reactions: article.public_reactions_count || 0,
                tags: article.tag_list || [tag],
                readingTime: article.reading_time_minutes || 5
              });
              
              collectionStats.totalCollected++;
              collectionStats.perTag[tag].collected++;
              
              // 충분한 데이터를 모았으면 조기 종료
              if (articles.length >= maxItems * 3) {
                break;
              }
            }
          }
          
          // 충분한 데이터를 모았으면 조기 종료
          if (articles.length >= maxItems * 3) {
            break;
          }
        }
      } catch (err) {
        console.error(`${tag} 태그 아티클 검색 중 오류:`, err.message);
      }
    }
    
    // 정렬 기준 계산 함수
    const calculateScore = (article) => {
      const now = new Date();
      const publishedDate = article.publishedAt;
      const diffDays = Math.floor((now - publishedDate) / (1000 * 60 * 60 * 24));
      
      // 점수 계산: 최신성 + 인기도 (반응 수)
      const freshnessScore = Math.max(0, 1 - (diffDays / maxDaysAgo));
      const popularityScore = Math.min(1, article.reactions / 50); // 50이상이면 최대 점수
      
      // 가중치 적용 (최신성 60%, 인기도 40%)
      return freshnessScore * 0.6 + popularityScore * 0.4;
    };
    
    // 복합 점수로 정렬
    const sortedArticles = articles.sort((a, b) => {
      return calculateScore(b) - calculateScore(a);
    });
    
    // 상위 요청 개수만 반환
    const topArticles = sortedArticles.slice(0, maxItems);
    
    console.log(`Dev.to에서 ${topArticles.length}개의 프론트엔드 관련 아티클을 찾았습니다. (후보: ${articles.length}개)`);
    return topArticles;
  } catch (error) {
    console.error('Dev.to 아티클 데이터 가져오기 오류:', error);
    return [];
  }
} 