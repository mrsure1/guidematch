-- bookings 테이블에 여행자용 숨김 컬럼 추가
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS is_hidden_by_traveler BOOLEAN DEFAULT false;

-- 기존 정책 유지 (RLS가 활성화되어 있으므로 필요 시 정책 업데이트)
-- 현재는 Public 접근이 허용되어 있으므로 별도 정책 추가는 불필요할 수 있으나 명시적으로 확인 권장
