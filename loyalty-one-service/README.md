# Loyalty (One Service: Next.js UI + API)

Triển khai 1 service duy nhất trên Render. API nằm dưới `/api/*`, UI gọi same-origin, không cần CORS.

## Biến môi trường (Render → Environment)
- `DATABASE_URL` = Chuỗi Postgres (Neon/Supabase/Railway/RDS) có `sslmode=require`
- `JWT_SECRET` = Chuỗi ngẫu nhiên dài (>=32 ký tự)

## Deploy (Render Web Service)
- Runtime: Node
- Build: `npm install && npm run build`
- Start: `npm start`

## Đăng nhập seed
- admin / changeme (được tạo tự động nếu chưa có khi API chạy lần đầu)

## Endpoints
- POST `/api/auth/login` { username|phone, password }
- GET  `/api/customers?phone=...`
- POST `/api/customers` { phone, full_name? }
- POST `/api/orders` { phone, amount_vnd, redeem_points? }
- GET  `/api/users` (manager/admin)
- POST `/api/users` ... (manager tạo staff; admin tạo staff/manager)
- GET  `/api/reports/customers.csv` (manager/admin)
