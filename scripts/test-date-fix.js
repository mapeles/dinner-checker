// 날짜 함수 테스트
// 현재 시간에서 올바른 날짜를 반환하는지 확인

console.log('=== 날짜 함수 테스트 ===\n');

const now = new Date();
console.log('현재 시간:', now.toString());
console.log('');

// 기존 방식 (UTC 기준 - 문제 있음)
const oldGetTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// 수정된 방식 (로컬 시간대 기준 - 올바름)
const newGetTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

console.log('기존 방식 (UTC 기준):');
console.log('  반환값:', oldGetTodayDate());
console.log('  문제점: 한국 시간 자정 이후 UTC는 전날을 가리킴\n');

console.log('수정된 방식 (로컬 시간대 기준):');
console.log('  반환값:', newGetTodayDate());
console.log('  해결됨: 현재 로컬 날짜를 정확히 반환\n');

// 시간대별 차이 확인
const koreaTime = now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
const utcTime = now.toISOString();

console.log('시간대 정보:');
console.log('  한국 시간:', koreaTime);
console.log('  UTC 시간:', utcTime);
console.log('  시간차:', Math.abs(now.getTimezoneOffset() / 60), '시간\n');

// 문제가 발생하는 시간대
console.log('문제 발생 시간대:');
console.log('  한국 시간 00:00 ~ 08:59 사이에는');
console.log('  UTC 날짜가 전날을 가리킵니다.\n');

// 결과 비교
if (oldGetTodayDate() === newGetTodayDate()) {
  console.log('✅ 현재는 두 방식이 같은 날짜를 반환합니다.');
  console.log('   (한국 시간 09:00 이후)');
} else {
  console.log('❌ 두 방식이 다른 날짜를 반환합니다!');
  console.log('   기존:', oldGetTodayDate());
  console.log('   수정:', newGetTodayDate());
  console.log('   → 수정된 방식을 사용해야 합니다.');
}
