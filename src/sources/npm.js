import axios from 'axios';

export async function getNpmTrends(maxItems = 10) {
  try {
    console.log('NPM 트렌딩 프론트엔드 패키지 가져오는 중...');
    
    // 프론트엔드 관련 키워드 목록 (확장)
    const frontendKeywords = [
      'react', 'vue', 'angular', 'svelte', 'frontend', 
      'ui', 'component', 'web', 'css', 'html', 'javascript',
      'typescript', 'nextjs', 'tailwind', 'styled-components',
      'jsx', 'webpack', 'vite'
    ];
    
    // NPM API에서 검색
    const results = [];
    
    // 검색 자격 옵션
    const searchConfigs = [
      { popularity: 1.0, quality: 0.5, maintenance: 0.5 }, // 인기도 우선
      { popularity: 0.5, quality: 1.0, maintenance: 0.5 }, // 품질 우선
      { popularity: 0.5, quality: 0.5, maintenance: 1.0 }  // 유지보수 우선
    ];
    
    // 각 키워드별로 인기 패키지 검색
    for (const keyword of frontendKeywords) {
      try {
        for (const config of searchConfigs) {
          // 다양한 기준으로 패키지 검색
          const response = await axios.get(
            `https://registry.npmjs.org/-/v1/search?text=${keyword}&size=5&popularity=${config.popularity}&quality=${config.quality}&maintenance=${config.maintenance}`
          );
          
          if (response.data && response.data.objects) {
            // 각 패키지 정보 추출하여 결과에 추가
            for (const pkg of response.data.objects) {
              // 이미 추가된 패키지는 건너뛰기
              if (results.some(item => item.title === pkg.package.name)) {
                continue;
              }
              
              // 패키지 정보와 점수 저장
              results.push({
                title: pkg.package.name,
                description: pkg.package.description || '설명 없음',
                url: `https://www.npmjs.com/package/${pkg.package.name}`,
                score: pkg.score.final,
                date: pkg.package.date || new Date().toISOString(),
                popularity: pkg.score.popularity,
                quality: pkg.score.quality,
                maintenance: pkg.score.maintenance
              });
              
              // 일정 개수 이상이면 조기 종료
              if (results.length >= maxItems * 3) break;
            }
          }
        }
      } catch (err) {
        console.error(`${keyword} 키워드 검색 중 오류:`, err.message);
      }
    }
    
    // 점수 기준 내림차순 정렬 (복합 점수 계산)
    const sortedResults = results.sort((a, b) => {
      // 가중치 적용 복합 점수
      const scoreA = a.score * 0.5 + a.popularity * 0.3 + a.date ? (new Date(a.date).getTime() / 1000000000) : 0;
      const scoreB = b.score * 0.5 + b.popularity * 0.3 + b.date ? (new Date(b.date).getTime() / 1000000000) : 0;
      
      return scoreB - scoreA;
    });
    
    // 상위 요청 개수만 반환
    const topResults = sortedResults.slice(0, maxItems);
    
    console.log(`NPM에서 ${topResults.length}개의 프론트엔드 관련 패키지를 찾았습니다.`);
    return topResults;
  } catch (error) {
    console.error('NPM 트렌딩 데이터 가져오기 오류:', error);
    return [];
  }
} 