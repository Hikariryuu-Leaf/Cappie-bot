# Backup Command Guide

## Tổng quan
Lệnh `/backup` cho phép bạn tạo, quản lý và khôi phục dữ liệu bot một cách an toàn trước khi cập nhật hoặc reset bot.

## Các tính năng

### 1. Tạo Backup (`/backup create`)
- **Mô tả**: Tạo một bản sao lưu của tất cả dữ liệu bot
- **Cách sử dụng**: `/backup create [tên_backup]`
- **Tham số**:
  - `name` (tùy chọn): Tên backup. Nếu không cung cấp, sẽ tự động tạo tên theo thời gian
- **Dữ liệu được backup**:
  - `users.json` - Dữ liệu người dùng
  - `shop.json` - Dữ liệu shop
  - `emojis.json` - Dữ liệu emoji

### 2. Xem danh sách Backup (`/backup list`)
- **Mô tả**: Hiển thị tất cả các backup có sẵn
- **Cách sử dụng**: `/backup list`
- **Thông tin hiển thị**:
  - Tên backup
  - Thời gian tạo
  - Người tạo backup

### 3. Khôi phục Backup (`/backup restore`)
- **Mô tả**: Khôi phục dữ liệu từ một backup
- **Cách sử dụng**: `/backup restore [tên_backup]`
- **Tham số**:
  - `name` (bắt buộc): Tên backup cần khôi phục
- **⚠️ Cảnh báo**: Dữ liệu hiện tại sẽ bị ghi đè!

### 4. Xóa Backup (`/backup delete`)
- **Mô tả**: Xóa một backup không cần thiết
- **Cách sử dụng**: `/backup delete [tên_backup]`
- **Tham số**:
  - `name` (bắt buộc): Tên backup cần xóa

## Quyền sử dụng
- Chỉ **Administrator** mới có thể sử dụng lệnh này
- Backup được lưu trong thư mục `./backups/`

## Cấu trúc thư mục Backup
```
backups/
├── backup_2024-01-15T10-30-00/
│   ├── users.json
│   ├── shop.json
│   ├── emojis.json
│   └── metadata.json
└── backup_2024-01-16T14-20-00/
    ├── users.json
    ├── shop.json
    ├── emojis.json
    └── metadata.json
```

## Quy trình sử dụng

### Trước khi cập nhật bot:
1. Chạy `/backup create update_backup` để tạo backup
2. Thực hiện cập nhật bot
3. Nếu có vấn đề, chạy `/backup restore update_backup` để khôi phục

### Trước khi reset bot:
1. Chạy `/backup create before_reset` để tạo backup
2. Reset bot
3. Chạy `/backup restore before_reset` để khôi phục dữ liệu

## Lưu ý quan trọng
- Backup được tạo tự động với timestamp nếu không cung cấp tên
- Metadata chứa thông tin về thời gian tạo và người tạo backup
- Restore sẽ ghi đè hoàn toàn dữ liệu hiện tại
- Luôn kiểm tra danh sách backup trước khi restore

## Xử lý lỗi
- Nếu không thể tạo backup: Kiểm tra quyền ghi file
- Nếu không thể restore: Kiểm tra backup có tồn tại không
- Nếu backup bị hỏng: Xóa và tạo lại backup mới 