# Backup Command Guide

## Tổng quan
Lệnh `/backup` cho phép bạn tạo, quản lý và khôi phục dữ liệu bot một cách an toàn trước khi cập nhật hoặc reset bot. **Lưu ý:** Lệnh này tạo backup thủ công riêng biệt với hệ thống backup tự động của bot.

## Các tính năng

### 1. Tạo Backup (`/backup create`)
- **Mô tả**: Tạo một bản sao lưu thủ công của tất cả dữ liệu bot
- **Cách sử dụng**: `/backup create [tên_backup]`
- **Tham số**:
  - `name` (tùy chọn): Tên backup. Nếu không cung cấp, sẽ tự động tạo tên theo thời gian
- **Dữ liệu được backup**:
  - `users.json` - Dữ liệu người dùng
  - `shop.json` - Dữ liệu shop
  - `emojis.json` - Dữ liệu emoji

### 2. Xem danh sách Backup (`/backup list`)
- **Mô tả**: Hiển thị tất cả các backup thủ công có sẵn
- **Cách sử dụng**: `/backup list`
- **Thông tin hiển thị**:
  - Tên backup
  - Thời gian tạo
  - Người tạo backup
  - Số file đã backup thành công

### 3. Khôi phục Backup (`/backup restore`)
- **Mô tả**: Khôi phục dữ liệu từ một backup thủ công
- **Cách sử dụng**: `/backup restore [tên_backup]`
- **Tham số**:
  - `name` (bắt buộc): Tên backup cần khôi phục
- **⚠️ Cảnh báo**: Dữ liệu hiện tại sẽ bị ghi đè!

### 4. Xóa Backup (`/backup delete`)
- **Mô tả**: Xóa một backup thủ công không cần thiết
- **Cách sử dụng**: `/backup delete [tên_backup]`
- **Tham số**:
  - `name` (bắt buộc): Tên backup cần xóa

## Quyền sử dụng
- Chỉ **Administrator** mới có thể sử dụng lệnh này
- Backup thủ công được lưu trong thư mục `./manual_backups/`
- **Tách biệt** với hệ thống backup tự động của bot

## Cấu trúc thư mục Backup
```
manual_backups/
├── manual_backup_2024-01-15T10-30-00/
│   ├── users.json
│   ├── shop.json
│   ├── emojis.json
│   └── metadata.json
└── manual_backup_2024-01-16T14-20-00/
    ├── users.json
    ├── shop.json
    ├── emojis.json
    └── metadata.json
```

## Quy trình sử dụng

### Trước khi cập nhật bot:
1. Chạy `/backup create update_backup` để tạo backup thủ công
2. Thực hiện cập nhật bot
3. Nếu có vấn đề, chạy `/backup restore update_backup` để khôi phục

### Trước khi reset bot:
1. Chạy `/backup create before_reset` để tạo backup thủ công
2. Reset bot
3. Chạy `/backup restore before_reset` để khôi phục dữ liệu

## Lưu ý quan trọng

### 🔄 Hệ thống Backup Tự Động vs Thủ Công
- **Backup tự động**: Được tạo tự động bởi bot mỗi 5 phút trong `./data/backups/`
- **Backup thủ công**: Được tạo bằng lệnh `/backup` trong `./manual_backups/`
- Hai hệ thống hoạt động độc lập, không xung đột với nhau

### 📊 Thông tin chi tiết
- Backup thủ công hiển thị chi tiết từng file được backup/restore
- Metadata chứa thông tin về thời gian tạo, người tạo, và loại backup
- Restore sẽ ghi đè hoàn toàn dữ liệu hiện tại
- Luôn kiểm tra danh sách backup trước khi restore

### 🛡️ Bảo mật
- Backup thủ công được tạo với tên `manual_backup_` để phân biệt
- Mỗi backup có metadata riêng với thông tin chi tiết
- Error handling chi tiết cho từng file

## Xử lý lỗi
- **Không thể tạo backup**: Kiểm tra quyền ghi file và dung lượng ổ đĩa
- **Không thể restore**: Kiểm tra backup có tồn tại và file có bị hỏng không
- **Backup bị hỏng**: Xóa và tạo lại backup mới
- **Timeout interaction**: Lệnh đã được cải thiện để tránh timeout

## Troubleshooting

### Lỗi "Unknown interaction (likely timed out)"
- ✅ Đã được sửa bằng cách defer interaction ngay lập tức
- ✅ Sử dụng `safeReply` thay vì `safeEditReply`

### Dữ liệu không được lưu
- ✅ Kiểm tra file tồn tại trước khi backup/restore
- ✅ Hiển thị chi tiết từng file thành công/thất bại
- ✅ Error handling chi tiết với thông báo lỗi cụ thể

### Xung đột với backup tự động
- ✅ Sử dụng thư mục riêng `./manual_backups/`
- ✅ Tên backup có prefix `manual_backup_`
- ✅ Metadata riêng biệt với `backupType: 'manual'` 