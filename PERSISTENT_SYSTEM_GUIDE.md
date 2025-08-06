# Hệ Thống Persistent Storage - Hướng Dẫn Sử Dụng

## 🎯 Tổng Quan

Hệ thống Persistent Storage mới được tối ưu hóa để:
- **Chỉ backup User Data** (users.json) - không còn backup emoji và shop data
- **Sử dụng manual backup** thay vì GitHub sync phức tạp
- **Auto-backup mỗi 10 phút** để bảo vệ dữ liệu
- **Validate và clean data** trước khi backup/restore

## 📁 Cấu Trúc Thư Mục

```
📂 data/
├── 📄 users.json          # Dữ liệu user hiện tại
├── 📄 shop.json           # Dữ liệu shop (không backup)
└── 📄 emojis.json         # Dữ liệu emoji (không backup)

📂 data/backups/           # Local backups tự động
├── 📁 backup_2025-08-06T15-50-56-663Z_219bcc94/
│   ├── 📄 users.json
│   └── 📄 metadata.json
└── ...

📂 manual_backups/         # Manual backups của bạn
├── 📁 test_backup/
│   └── 📄 users.json
└── ...
```

## 🛠️ Các Lệnh Sử Dụng

### 1. Tạo Backup Ngay Lập Tức
```
/persistent backup
```
- Tạo backup User Data ngay lập tức
- Validate và clean data trước khi backup
- Hiển thị số lượng users được backup

### 2. Xem Danh Sách Backup
```
/persistent list
```
- Hiển thị cả local backups và manual backups
- Sắp xếp theo thời gian (mới nhất trước)
- Hiển thị số lượng users trong mỗi backup

### 3. Khôi Phục Từ Local Backup
```
/persistent restore [backup_name]
```
- Khôi phục từ local backup (tự động tạo)
- Nếu không chỉ định tên, sẽ dùng backup mới nhất
- Tự động tạo backup hiện tại trước khi restore

### 4. Khôi Phục Từ Manual Backup
```
/persistent manual-restore <backup_name>
```
- Khôi phục từ manual backup bạn tạo
- Yêu cầu chỉ định tên backup chính xác
- Tự động tạo backup hiện tại trước khi restore

### 5. Kiểm Tra Trạng Thái Hệ Thống
```
/persistent status
```
- Hiển thị trạng thái auto-backup
- Số lượng local và manual backups
- Thời gian backup cuối cùng
- Backup mới nhất

## ⚙️ Cấu Hình Hệ Thống

### Auto-Backup Settings
```javascript
const PERSISTENT_CONFIG = {
  autoBackupInterval: 10 * 60 * 1000, // 10 phút
  maxLocalBackups: 20,                // Giữ 20 backup gần nhất
  backupTimeout: 15000                // 15 giây timeout
};
```

### Data Validation
Hệ thống tự động validate và clean data:
- Đảm bảo tất cả fields có kiểu dữ liệu đúng
- Reset giá trị âm về 0
- Thêm fields mặc định nếu thiếu

## 🔄 Quy Trình Backup/Restore

### Backup Process
1. **Validate Data**: Kiểm tra và clean user data
2. **Create Backup**: Tạo thư mục backup với ID duy nhất
3. **Save Data**: Lưu users.json đã được validate
4. **Create Metadata**: Tạo file metadata với thông tin backup
5. **Cleanup**: Xóa backup cũ nếu vượt quá giới hạn

### Restore Process
1. **Create Safety Backup**: Tạo backup hiện tại trước khi restore
2. **Validate Source**: Kiểm tra và validate data từ backup
3. **Restore Data**: Ghi đè users.json hiện tại
4. **Confirm Success**: Báo cáo số lượng users đã restore

## 📊 Monitoring và Logging

### Console Logs
```
[PERSISTENT] User data validated and backed up: 15 users
[PERSISTENT] User data backup created: backup_2025-08-06T15-50-56-663Z_219bcc94 (1/1 files)
[PERSISTENT] Restore completed: 15 users restored
```

### Error Handling
- Timeout protection cho tất cả operations
- Graceful error handling với user feedback
- Automatic cleanup khi có lỗi

## 🚀 Khởi Tạo Hệ Thống

### Lần Đầu Sử Dụng
1. Bot sẽ tự động tạo thư mục cần thiết
2. Tạo backup đầu tiên khi khởi động
3. Bắt đầu auto-backup mỗi 10 phút

### Manual Backup Setup
1. Tạo thư mục trong `./manual_backups/`
2. Copy file `users.json` vào thư mục đó
3. Sử dụng `/persistent manual-restore <tên_thư_mục>`

## 🔧 Troubleshooting

### Backup Không Thành Công
- Kiểm tra quyền ghi file
- Kiểm tra dung lượng ổ đĩa
- Xem logs để tìm lỗi cụ thể

### Restore Không Hoạt Động
- Kiểm tra tên backup có chính xác không
- Đảm bảo file users.json tồn tại trong backup
- Kiểm tra format JSON có hợp lệ không

### Auto-Backup Không Chạy
- Kiểm tra persistentStorage đã được khởi tạo chưa
- Kiểm tra `startAutoBackup()` đã được gọi chưa
- Xem logs startup để tìm lỗi

## 📈 Performance

### Tối Ưu Hóa
- Chỉ backup User Data (giảm dung lượng)
- Validate data trước khi backup (tránh corruption)
- Auto-cleanup backup cũ (tiết kiệm dung lượng)
- Timeout protection (tránh treo bot)

### Monitoring
- Theo dõi số lượng users trong mỗi backup
- Kiểm tra thời gian backup cuối cùng
- Monitor dung lượng thư mục backup

## 🔒 Bảo Mật

### Data Protection
- Tự động tạo backup trước khi restore
- Validate data để tránh corruption
- Không lưu sensitive data trong logs

### Access Control
- Chỉ admin mới có thể sử dụng persistent commands
- Không expose backup data qua public endpoints

## 📝 Best Practices

### Backup Strategy
- Tạo manual backup trước khi thay đổi lớn
- Sử dụng auto-backup làm safety net
- Kiểm tra backup định kỳ với `/persistent status`

### Restore Strategy
- Luôn test restore trên môi trường dev trước
- Kiểm tra số lượng users sau khi restore
- Monitor bot hoạt động sau restore

### Maintenance
- Kiểm tra dung lượng thư mục backup định kỳ
- Xóa manual backup cũ không cần thiết
- Monitor logs để phát hiện lỗi sớm

---

**Hệ thống Persistent Storage mới đã sẵn sàng sử dụng!** 🎉 