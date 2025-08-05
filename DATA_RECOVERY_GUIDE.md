# Hướng Dẫn Khôi Phục Dữ Liệu Bot Discord

## Tình Trạng Hiện Tại

Bot của bạn đã bị mất dữ liệu người dùng do:
- Backup trước khi reset không được ghi lại đúng cách
- Hệ thống backup tự động chưa được khởi tạo
- Dữ liệu trên Render có thể bị reset khi restart

## Giải Pháp Đã Thực Hiện

### ✅ 1. Khôi Phục Dữ Liệu Cơ Bản
- Đã chạy script `utils/recovery.js` để tìm và khôi phục dữ liệu
- Tạo cấu trúc dữ liệu mẫu để bot hoạt động bình thường
- Thiết lập hệ thống backup mới

### ✅ 2. Hệ Thống Backup Nâng Cao
- **Backup tự động**: Mỗi 5 phút trong `./data/backups/`
- **Backup thủ công**: Lệnh `/backup create` trong `./manual_backups/`
- **Khôi phục**: Lệnh `/backup restore` hoặc script tự động
- **Dọn dẹp**: Tự động xóa backup cũ (giữ 20 backup tự động, 50 backup thủ công)

### ✅ 3. Cải Thiện Bảo Mật Dữ Liệu
- Atomic writes để tránh corruption
- Validation dữ liệu trước khi lưu
- Graceful shutdown để lưu dữ liệu khi tắt bot
- In-memory cache để tăng hiệu suất

## Cách Sử Dụng Hệ Thống Backup

### 🔄 Backup Tự Động
```javascript
// Tự động chạy mỗi 5 phút
// Lưu trong: ./data/backups/auto_backup_[timestamp]/
```

### 📋 Backup Thủ Công
```bash
# Tạo backup
/backup create [tên_backup]

# Xem danh sách backup
/backup list

# Khôi phục từ backup
/backup restore [tên_backup]

# Xóa backup
/backup delete [tên_backup]
```

### 🛠️ Script Khôi Phục
```bash
# Chạy script khôi phục
node utils/recovery.js

# Test hệ thống backup
node test-backup.js
```

## Cấu Trúc Thư Mục Backup

```
data/
├── users.json          # Dữ liệu người dùng chính
├── shop.json          # Dữ liệu shop
├── emojis.json        # Cấu hình emoji
├── backups/           # Backup tự động
│   ├── auto_backup_[timestamp]/
│   │   ├── users.json
│   │   ├── shop.json
│   │   ├── emojis.json
│   │   └── metadata.json
│   └── ...
└── temp/              # File tạm thời

manual_backups/        # Backup thủ công
├── manual_backup_[timestamp]/
│   ├── users.json
│   ├── shop.json
│   ├── emojis.json
│   └── metadata.json
└── ...
```

## Khôi Phục Dữ Liệu Từ Render

### 🔍 Kiểm Tra Logs Render
1. Vào dashboard Render
2. Chọn service bot của bạn
3. Vào tab "Logs"
4. Tìm kiếm các log liên quan đến backup hoặc data

### 📥 Tải Backup Từ Render
```bash
# Nếu có access SSH
ssh render@your-app-name.onrender.com
cd /opt/render/project/src
ls -la data/backups/
ls -la manual_backups/
```

### 🔄 Khôi Phục Từ File Backup
```bash
# Copy file backup về local
scp render@your-app-name.onrender.com:/opt/render/project/src/data/backups/latest_backup/* ./data/

# Hoặc restore từ manual backup
scp render@your-app-name.onrender.com:/opt/render/project/src/manual_backups/backup_name/* ./data/
```

## Ngăn Chặn Mất Dữ Liệu Trong Tương Lai

### 🛡️ Trước Khi Reset Bot
1. **Tạo backup thủ công**:
   ```
   /backup create before_reset
   ```

2. **Kiểm tra backup**:
   ```
   /backup list
   ```

3. **Reset bot**:
   - Restart trên Render
   - Hoặc deploy code mới

4. **Khôi phục dữ liệu**:
   ```
   /backup restore before_reset
   ```

### 🔧 Cấu Hình Render
1. **Persistent Storage**: Đảm bảo Render có persistent storage
2. **Environment Variables**: Kiểm tra các biến môi trường
3. **Build Commands**: Đảm bảo không xóa dữ liệu khi build

### 📊 Monitoring
- Kiểm tra logs thường xuyên
- Monitor dung lượng ổ đĩa
- Theo dõi số lượng backup

## Troubleshooting

### ❌ Lỗi "Backup không tồn tại"
```bash
# Kiểm tra thư mục backup
ls -la data/backups/
ls -la manual_backups/

# Tạo backup mới
/backup create emergency_backup
```

### ❌ Lỗi "Dữ liệu bị corrupt"
```bash
# Chạy script khôi phục
node utils/recovery.js

# Kiểm tra file JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('./data/users.json')))"
```

### ❌ Lỗi "Không thể tạo backup"
```bash
# Kiểm tra quyền ghi file
ls -la data/
chmod 755 data/
chmod 755 manual_backups/

# Kiểm tra dung lượng ổ đĩa
df -h
```

### ❌ Lỗi "Bot không start"
```bash
# Kiểm tra logs
tail -f logs/bot.log

# Restart với debug
NODE_ENV=development node index.js
```

## Lệnh Hữu Ích

### 🔍 Kiểm Tra Dữ Liệu
```bash
# Xem số lượng user
node -e "const data = JSON.parse(require('fs').readFileSync('./data/users.json')); console.log('Users:', Object.keys(data).length)"

# Xem cấu trúc dữ liệu
node -e "const data = JSON.parse(require('fs').readFileSync('./data/users.json')); console.log(JSON.stringify(data, null, 2))"
```

### 🧹 Dọn Dẹp Backup Cũ
```bash
# Xóa backup tự động cũ (giữ 20 backup mới nhất)
# Tự động chạy bởi hệ thống

# Xóa backup thủ công cũ (giữ 50 backup mới nhất)
# Tự động chạy bởi hệ thống
```

### 📈 Thống Kê Backup
```bash
# Đếm số backup
find data/backups -name "auto_backup_*" | wc -l
find manual_backups -name "manual_backup_*" | wc -l

# Xem dung lượng backup
du -sh data/backups/
du -sh manual_backups/
```

## Kết Luận

✅ **Đã khôi phục**: Hệ thống backup và dữ liệu cơ bản
✅ **Đã cải thiện**: Hệ thống backup tự động và thủ công
✅ **Đã bảo vệ**: Dữ liệu khỏi mất mát trong tương lai

**Lưu ý quan trọng**: Luôn tạo backup thủ công trước khi thực hiện các thay đổi lớn như reset bot, update code, hoặc restart service trên Render.

## Liên Hệ Hỗ Trợ

Nếu gặp vấn đề với việc khôi phục dữ liệu:
1. Kiểm tra logs Render
2. Chạy script recovery
3. Tạo backup thủ công
4. Liên hệ admin để hỗ trợ thêm 