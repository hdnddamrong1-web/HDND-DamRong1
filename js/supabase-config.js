/* =========================================================
   Cấu hình kết nối Supabase
   - SUPABASE_URL: địa chỉ project Supabase (KHÔNG bao gồm /rest/v1/)
   - SUPABASE_ANON_KEY: khoá công khai (anon/public) - an toàn để lộ ra
     trình duyệt vì mọi quyền truy cập thật đã được kiểm soát bởi
     Row Level Security (RLS) đặt trong database Supabase.
   TUYỆT ĐỐI KHÔNG đặt "service_role" key ở đây.
========================================================= */
const SUPABASE_URL = 'https://ghmtmkjhuelcdwdiycmn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXRta2podWVsY2R3ZGl5Y21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NjYxMzIsImV4cCI6MjEwMzU0MjEzMn0.vl3pIgdDTWqFLGn8R6PjoJ8yz1cr41mOyhyf67LrKoQ';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
