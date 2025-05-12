import axios from 'axios';

export async function getNpmTrends() {
  try {
    console.log('NPM 트렌딩 프론트엔드 패키지 가져오는 중...');
    
    // 프론트엔드 관련 키워드 목록
    const frontendKeywords = [
      'react', 'vue', 'angular', 'svelte', 'frontend', 
      'ui', 'component', 'web', 'css', 'html', 'javascript'
    ];
    
    // NPM API에서 검색
    const results = [];
    
    // 각 키워드별로 인기 패키지 검색
    for (const keyword of frontendKeywords) {
      try {
        const response = await axios.get(`https://registry.npmjs.org/-/v1/search?text=${keyword}&size=3&popularity=1.0`);
        
        if (response.data && response.data.objects) {
          // 각 패키지 정보 추출하여 결과에 추가
          for (const pkg of response.data.objects) {
            // 이미 추가된 패키지는 건너뛰기
            if (results.some(item => item.title === pkg.package.name)) {
              continue;
            }
            
            results.push({
              title: pkg.package.name,
              description: pkg.package.description || '설명 없음',
              url: `https://www.npmjs.com/package/${pkg.package.name}`
            });
          }
        }
      } catch (err) {
        console.error(`${keyword} 키워드 검색 중 오류:`, err.message);
      }
    }
    
    // 중복 제거하고 인기도 순으로 정렬
    const uniqueResults = results.slice(0, 10);
    
    console.log(`NPM에서 ${uniqueResults.length}개의 프론트엔드 관련 패키지를 찾았습니다.`);
    return uniqueResults;
  } catch (error) {
    console.error('NPM 트렌딩 데이터 가져오기 오류:', error);
    return [];
  }
} 