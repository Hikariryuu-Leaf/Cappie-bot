# Hướng Dẫn Setup GitHub Sync Đầy Đủ

## 🎯 **Mục Tiêu**

Đẩy dữ liệu bot lên GitHub để tránh mất dữ liệu khi deploy lại trên Render.

---

## 📋 **Bước 1: Tạo GitHub Repository**

### **1.1 Tạo Repository:**
```
1. Vào GitHub.com và đăng nhập
2. Click nút "+" > "New repository"
3. Repository name: my-discord-bot-backup
4. Description: Backup data for Discord bot
5. Chọn Public (hoặc Private nếu muốn)
6. KHÔNG check "Add a README file"
7. Click "Create repository"
```

### **1.2 Copy Repository URL:**
```
https://github.com/your-username/my-discord-bot-backup
```

---

## 🔑 **Bước 2: Tạo GitHub Token**

### **2.1 Tạo Personal Access Token:**
```
1. Vào GitHub Settings (icon gear)
2. Developer settings (cuối trang)
3. Personal access tokens > Tokens (classic)
4. Generate new token (classic)
5. Note: Discord Bot Backup
6. Expiration: 90 days (hoặc No expiration)
7. Select scopes: repo (full control of private repositories)
8. Click "Generate token"
9. COPY TOKEN NGAY LẬP TỨC (sẽ không hiện lại)
```

### **2.2 Token Format:**
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ⚙️ **Bước 3: Cấu Hình Environment Variables**

### **3.1 Trên Render:**
```
1. Vào Render Dashboard
2. Chọn service Discord bot
3. Environment > Environment Variables
4. Thêm các biến:

GITHUB_REPO=your-username/my-discord-bot-backup
GITHUB_TOKEN=ghp_your_token_here
```

### **3.2 Trên Local (tạo file .env):**
```
GITHUB_REPO=your-username/my-discord-bot-backup
GITHUB_TOKEN=ghp_your_token_here
TOKEN=your_discord_bot_token
OWNER_ID=your_discord_user_id
LOG_CHANNEL_ID=your_log_channel_id
EXCLUSIVE_ROLE_ID=your_exclusive_role_id
```

---

## 🧪 **Bước 4: Test GitHub Sync**

### **4.1 Chạy script test:**
```bash
node test-github-sync.js
```

### **4.2 Kết quả mong đợi:**
```
🔍 Test GitHub Sync

📡 Bước 1: Kiểm tra cấu hình GitHub...
✅ Cấu hình GitHub đã có
   Repository: your-username/my-discord-bot-backup
   Token: Đã cấu hình

📦 Bước 2: Tạo backup test...
✅ Backup tạo thành công: backup_2025-08-03T...
   Files: 3/3

🚀 Bước 3: Test sync lên GitHub...
✅ Sync thành công! Method: github
📁 Dữ liệu đã được sync lên GitHub
```

---

## 🔄 **Bước 5: Sử Dụng Trong Bot**

### **5.1 Lệnh Persistent:**
```
/persistent backup    # Tạo backup và sync lên GitHub
/persistent restore   # Khôi phục từ GitHub
/persistent list     # Xem danh sách backup
/persistent sync     # Sync ngay lập tức
```

### **5.2 Auto Sync:**
- Bot sẽ tự động sync mỗi 5 phút
- Sync khi bot shutdown
- Sync khi có dữ liệu mới

---

## 📊 **Bước 6: Kiểm Tra Kết Quả**

### **6.1 Trên GitHub:**
```
1. Vào repository: https://github.com/your-username/my-discord-bot-backup
2. Sẽ thấy các file:
   - data/backups/backup_xxx/
   - data/users.json
   - data/shop.json
   - data/emojis.json
```

### **6.2 Trên Render Logs:**
```
[PERSISTENT] Comprehensive backup created: backup_xxx (3/3 files)
[PERSISTENT] GitHub sync completed for backup: backup_xxx
[PERSISTENT] External sync completed successfully
```

---

## 🔧 **Troubleshooting**

### **Lỗi 1: "Repository not found"**
**Giải pháp:**
1. Kiểm tra repository có tồn tại không
2. Kiểm tra GITHUB_REPO có đúng format không
3. Kiểm tra token có quyền access repository không

### **Lỗi 2: "Authentication failed"**
**Giải pháp:**
1. Kiểm tra GITHUB_TOKEN có đúng không
2. Token có quyền "repo" không
3. Token có hết hạn không

### **Lỗi 3: "Push failed"**
**Giải pháp:**
1. Repository phải tồn tại trước
2. Token phải có quyền push
3. Kiểm tra network connection

---

## 📈 **Cấu Trúc Dữ Liệu Trên GitHub**

### **Repository Structure:**
```
my-discord-bot-backup/
├── data/
│   ├── users.json          # Dữ liệu người dùng
│   ├── shop.json           # Dữ liệu shop
│   ├── emojis.json         # Dữ liệu emoji
│   └── backups/
│       ├── backup_2025-08-03T.../
│       │   ├── users.json
│       │   ├── shop.json
│       │   ├── emojis.json
│       │   └── metadata.json
│       └── backup_2025-08-02T.../
│           ├── users.json
│           ├── shop.json
│           ├── emojis.json
│           └── metadata.json
```

### **Metadata Format:**
```json
{
  "id": "backup_2025-08-03T...",
  "createdAt": "2025-08-03T...",
  "files": ["✅ users.json", "✅ shop.json", "✅ emojis.json"],
  "successCount": 3,
  "totalFiles": 3,
  "version": "1.0.0"
}
```

---

## 🎯 **Lợi Ích**

### **✅ Bảo Vệ Dữ Liệu:**
- Dữ liệu không bị mất khi deploy
- Backup tự động mỗi 5 phút
- Khôi phục dễ dàng từ GitHub

### **✅ Tự Động:**
- Auto sync khi có thay đổi
- Emergency backup khi shutdown
- Không cần can thiệp thủ công

### **✅ An Toàn:**
- Dữ liệu được mã hóa trên GitHub
- Chỉ bạn có quyền truy cập
- Backup nhiều phiên bản

---

## 🚀 **Kết Luận**

1. **Tạo GitHub repository** trước
2. **Tạo GitHub token** với quyền repo
3. **Cấu hình environment variables**
4. **Test sync** bằng script
5. **Deploy bot** với cấu hình mới
6. **Sử dụng lệnh persistent** để quản lý

**Sau khi setup xong, dữ liệu sẽ được bảo vệ đầy đủ và không bao giờ bị mất nữa!** 