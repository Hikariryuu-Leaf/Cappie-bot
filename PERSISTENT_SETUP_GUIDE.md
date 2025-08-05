# 🛡️ Hướng Dẫn Cấu Hình Persistent Storage

## 🎯 **Mục Đích**

Hệ thống Persistent Storage giúp bảo vệ dữ liệu người dùng khi deploy bot trên các platform như Render, Railway, Heroku bằng cách:

- **Tự động backup** dữ liệu lên GitHub
- **Khôi phục dữ liệu** khi bot restart
- **Đồng bộ real-time** giữa local và cloud storage

---

## 🔧 **Bước 1: Tạo GitHub Repository**

### **1.1 Tạo Repository Mới**
```
1. Vào GitHub.com và đăng nhập
2. Click "New repository"
3. Đặt tên: my-discord-bot-backup
4. Chọn Public hoặc Private
5. Không cần tạo README, .gitignore, license
6. Click "Create repository"
```

### **1.2 Ghi Nhớ Repository URL**
```
https://github.com/your-username/my-discord-bot-backup
```

---

## 🔑 **Bước 2: Tạo GitHub Personal Access Token**

### **2.1 Tạo Token**
```
1. Vào GitHub Settings > Developer settings
2. Click "Personal access tokens" > "Tokens (classic)"
3. Click "Generate new token" > "Generate new token (classic)"
4. Đặt tên: Discord Bot Backup
5. Chọn quyền: repo (full control of private repositories)
6. Click "Generate token"
7. Copy token và lưu lại (sẽ không hiển thị lại)
```

### **2.2 Token Format**
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ⚙️ **Bước 3: Cấu Hình Environment Variables**

### **3.1 Trên Render (Recommended)**
```
1. Vào dashboard Render
2. Chọn service bot của bạn
3. Vào tab "Environment"
4. Thêm các biến:

GITHUB_REPO=your-username/my-discord-bot-backup
GITHUB_TOKEN=ghp_your_token_here
TOKEN=your_discord_bot_token
OWNER_ID=your_discord_user_id
LOG_CHANNEL_ID=your_log_channel_id
EXCLUSIVE_ROLE_ID=your_exclusive_role_id
```

### **3.2 Trên Local (.env file)**
```env
GITHUB_REPO=your-username/my-discord-bot-backup
GITHUB_TOKEN=ghp_your_token_here
TOKEN=your_discord_bot_token
OWNER_ID=your_discord_user_id
LOG_CHANNEL_ID=your_log_channel_id
EXCLUSIVE_ROLE_ID=your_exclusive_role_id
```

---

## 🚀 **Bước 4: Test Cấu Hình**

### **4.1 Deploy Commands**
```bash
npm run deploy
```

### **4.2 Test Persistent Storage**
```
/persistent status
```

**Kết quả mong đợi:**
```
✅ Kết nối: Thành công
💾 Phương thức: GitHub
🔗 Repository: https://github.com/your-username/my-discord-bot-backup
```

---

## 📊 **Bước 5: Tạo Backup Đầu Tiên**

### **5.1 Tạo Backup**
```
/persistent backup
```

### **5.2 Kiểm Tra Kết Quả**
```
✅ Backup Thành Công
📁 Backup ID: backup_2025-08-03T...
📊 Files: 3/3 files
🔄 Sync Status: ✅ Thành công
🌐 Sync Method: GitHub
```

---

## 🔄 **Bước 6: Test Khôi Phục**

### **6.1 Xem Danh Sách Backup**
```
/persistent list
```

### **6.2 Test Khôi Phục**
```
/persistent restore
```

**Kết quả mong đợi:**
```
✅ Khôi Phục Thành Công
📁 Backup ID: Mới nhất
📊 Files Restored: 3/3 files
🌐 Restore Method: GitHub
```

---

## ⚠️ **Troubleshooting**

### **Lỗi 1: "GitHub repository or token not configured"**
**Giải pháp:**
1. Kiểm tra GITHUB_REPO và GITHUB_TOKEN trong environment variables
2. Đảm bảo format đúng: `username/repository-name`
3. Token phải bắt đầu bằng `ghp_`

### **Lỗi 2: "Repository not found or access denied"**
**Giải pháp:**
1. Kiểm tra repository có tồn tại không
2. Kiểm tra token có quyền truy cập repository không
3. Nếu repository private, đảm bảo token có quyền `repo`

### **Lỗi 3: "GitHub validation failed"**
**Giải pháp:**
1. Kiểm tra kết nối internet
2. Kiểm tra token có hợp lệ không
3. Thử tạo token mới

### **Lỗi 4: "No backups available for restore"**
**Giải pháp:**
1. Tạo backup đầu tiên bằng `/persistent backup`
2. Kiểm tra GitHub repository có branch `data-backup` không
3. Kiểm tra có thư mục `data-backup` trong repository không

---

## 📋 **Các Lệnh Có Sẵn**

| Lệnh | Mô Tả |
|------|-------|
| `/persistent status` | Kiểm tra trạng thái kết nối |
| `/persistent backup` | Tạo backup và sync lên GitHub |
| `/persistent restore` | Khôi phục từ backup mới nhất |
| `/persistent restore backup_id` | Khôi phục từ backup cụ thể |
| `/persistent list` | Xem danh sách backup |
| `/persistent sync` | Đồng bộ ngay lập tức |

---

## 🔒 **Bảo Mật**

### **1. Token Security**
- Không chia sẻ token với ai
- Sử dụng token với quyền tối thiểu cần thiết
- Rotate token định kỳ

### **2. Repository Security**
- Có thể sử dụng private repository
- Chỉ owner có quyền truy cập
- Backup được mã hóa

### **3. Data Protection**
- Dữ liệu được backup tự động mỗi 5 phút
- Emergency backup khi shutdown
- Multiple backup versions

---

## 📈 **Monitoring**

### **Auto-Sync Logs**
```
[PERSISTENT] Starting external sync...
[PERSISTENT] GitHub sync completed successfully
[PERSISTENT] Auto-sync completed
```

### **Backup Logs**
```
[BACKUP] Creating automatic backup...
[BACKUP] Backup completed: backup_2025-08-03T...
[PERSISTENT] GitHub sync completed for backup: backup_2025-08-03T...
```

---

## 🎯 **Kết Luận**

Sau khi cấu hình xong:

1. ✅ **Dữ liệu được bảo vệ** khi deploy
2. ✅ **Auto-backup** mỗi 5 phút
3. ✅ **Khôi phục tự động** khi restart
4. ✅ **Monitoring** trạng thái kết nối
5. ✅ **Emergency backup** khi shutdown

**Bot của bạn giờ đây đã được bảo vệ hoàn toàn! 🛡️** 