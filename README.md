# Meraki ERP - English Language Center Management System

Hệ thống quản lý trung tâm tiếng Anh với giao diện song ngữ Việt-Anh, sử dụng Next.js và Supabase.

## 🚀 Tính năng chính

- **Quản lý học viên**: Đăng ký, cập nhật thông tin học viên với thông tin phụ huynh
- **Giao diện song ngữ**: Hỗ trợ tiếng Việt và tiếng Anh
- **Database linh hoạt**: Sử dụng PostgreSQL với JSONB cho metadata
- **Responsive design**: Tối ưu cho desktop và mobile

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Form handling**: React Hook Form + Zod validation
- **UI Components**: Headless UI

## 📋 Yêu cầu hệ thống

- Node.js 18+ 
- npm hoặc yarn
- Tài khoản Supabase

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd MerakiERP
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Sao chép file `.env.example` thành `.env.local`:

```bash
cp .env.example .env.local
```

Cập nhật các biến môi trường trong `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-database-url
```

### 4. Thiết lập database

Chạy script SQL để tạo bảng:

```sql
-- Chạy nội dung file database/schema.sql trong Supabase SQL Editor
```

### 5. Chạy ứng dụng

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 📁 Cấu trúc thư mục

```
MerakiERP/
├── components/           # React components
│   └── StudentEnrollmentForm.tsx
├── database/            # Database schemas và scripts
│   └── schema.sql
├── lib/                 # Utilities và API functions
│   ├── supabase.ts     # Supabase client
│   └── api/            # API helper functions
│       └── students.ts
├── pages/              # Next.js pages
│   ├── _app.tsx
│   ├── index.tsx
│   └── api/           # API routes
├── styles/            # CSS styles
│   └── globals.css
└── public/           # Static files
```

## 🗄️ Database Schema

### Bảng chính:

- **students**: Thông tin học viên và phụ huynh
- **facilities**: Cơ sở vật chất
- **classes**: Lớp học
- **enrollments**: Đăng ký học
- **attendance**: Điểm danh
- **finances**: Tài chính

### JSONB Metadata:

Mỗi bảng có trường `data` kiểu JSONB để lưu thông tin linh hoạt:

```json
{
  "parent": {
    "name": "Nguyễn Văn A",
    "phone": "0123456789",
    "email": "parent@email.com"
  },
  "emergency_contact": {
    "name": "Người liên hệ khẩn cấp",
    "phone": "0987654321",
    "relationship": "Anh/chị"
  },
  "level": "beginner",
  "notes": "Ghi chú thêm"
}
```

## 🌐 API Endpoints

### Students API

- `GET /api/students` - Lấy danh sách học viên
- `POST /api/students` - Tạo học viên mới
- `GET /api/students/[id]` - Lấy thông tin học viên
- `PUT /api/students/[id]` - Cập nhật học viên
- `DELETE /api/students/[id]` - Xóa học viên

## 🎨 Giao diện

- **Trang chủ**: Form đăng ký học viên + thống kê
- **Chuyển đổi ngôn ngữ**: Nút chuyển đổi Việt/Anh
- **Responsive**: Tối ưu cho mọi thiết bị

## 🔧 Development

### Chạy development server:

```bash
npm run dev
```

### Build production:

```bash
npm run build
npm start
```

### Linting:

```bash
npm run lint
```

## 📝 TODO

- [ ] Quản lý lớp học
- [ ] Hệ thống điểm danh
- [ ] Báo cáo và thống kê
- [ ] Quản lý tài chính
- [ ] Hệ thống thông báo
- [ ] Export/Import dữ liệu

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- Email: support@merakierp.com
- Website: https://merakierp.com
