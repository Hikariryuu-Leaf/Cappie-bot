# Hướng Dẫn Khôi Phục Dữ Liệu Từ GitHub

## 🎯 **Vấn Đề Hiện Tại**

Bạn đã sử dụng `/persistent restore` nhưng dữ liệu cũ vẫn không xuất hiện vì:

1. **Chưa cấu hình GitHub** - Bot không thể kết nối GitHub
2. **Restore chỉ từ local** - Không restore từ GitHub
3. **Thiếu environment variables** - GITHUB_REPO và GITHUB_TOKEN

---

## 🔧 **Bước 1: Cấu Hình GitHub**

### **1.1 Tạo GitHub Repository**
```
1. Vào GitHub.com
2. Tạo repository mới (ví dụ: my-discord-bot-backup)
3. Repository phải là Public hoặc Private với token
```

### **1.2 Tạo GitHub Token**
```
1. Vào GitHub Settings > Developer settings > Personal access tokens
2. Generate new token (classic)
3. Chọn quyền: repo (full control of private repositories)
4. Copy token và lưu lại
```

### **1.3 Cấu Hình Environment Variables**

#### **Trên Render:**
```
GITHUB_REPO=your-username/my-discord-bot-backup
GITHUB_TOKEN=ghp_your_token_here
```

#### **Trên Local (tạo file .env):**
```
GITHUB_REPO=your-username/my-discord-bot-backup
GITHUB_TOKEN=ghp_your_token_here
TOKEN=your_discord_bot_token
OWNER_ID=your_discord_user_id
LOG_CHANNEL_ID=your_log_channel_id
EXCLUSIVE_ROLE_ID=your_exclusive_role_id
```

---

## 🔍 **Bước 2: Kiểm Tra Dữ Liệu Hiện Tại**

### **Kiểm tra thư mục data:**
```bash
ls -la ./data/
```

### **Kiểm tra nội dung files:**
```bash
cat ./data/users.json
cat ./data/shop.json
cat ./data/emojis.json
```

---

## 🚀 **Bước 3: Khôi Phục Dữ Liệu**

### **3.1 Chạy Script Khôi Phục**
```bash
node test-github-restore.js
```

### **3.2 Hoặc Sử Dụng Lệnh Bot**
```
/persistent restore
```

---

## 📋 **Bước 4: Kiểm Tra Sau Khôi Phục**

### **4.1 Kiểm tra dữ liệu đã khôi phục:**
```bash
ls -la ./data/
cat ./data/users.json | head -20
```

### **4.2 Test lệnh bot:**
```
/profile
/cartridge check @yourself
```

---

## ⚠️ **Lưu Ý Quan Trọng**

### **1. GitHub Repository Structure:**
```
my-discord-bot-backup/
├── data-backup/
│   ├── backup_2025-08-03T03-24-28-836Z_84034586/
│   │   ├── users.json
│   │   ├── shop.json
│   │   ├── emojis.json
│   │   └── metadata.json
│   └── backup_2025-08-02T21-23-44-649Z_8a8d7c60/
│       ├── users.json
│       ├── shop.json
│       ├── emojis.json
│       └── metadata.json
```

### **2. Backup ID Format:**
```
backup_YYYY-MM-DDTHH-MM-SS-SSSZ_randomId
```

### **3. Files Cần Khôi Phục:**
- `users.json` - Dữ liệu người dùng
- `shop.json` - Dữ liệu shop
- `emojis.json` - Dữ liệu emoji

---

## 🔧 **Troubleshooting**

### **Lỗi 1: "GITHUB_REPO hoặc GITHUB_TOKEN chưa được cấu hình"**
**Giải pháp:**
1. Tạo file `.env` với nội dung:
```
GITHUB_REPO=your-username/your-repo-name
GITHUB_TOKEN=ghp_your_token_here
```

### **Lỗi 2: "Không thể kết nối GitHub"**
**Giải pháp:**
1. Kiểm tra token có đúng không
2. Kiểm tra repository có tồn tại không
3. Kiểm tra quyền của token

### **Lỗi 3: "Không tìm thấy backup nào"**
**Giải pháp:**
1. Kiểm tra repository có branch `data-backup` không
2. Kiểm tra có thư mục `data-backup` trong repository không
3. Tạo backup mới bằng `/persistent backup`

---

## 📊 **Kiểm Tra Kết Quả**

### **Sau khi khôi phục thành công:**
```
✅ Kết nối GitHub thành công!
✅ Tìm thấy X backup trên GitHub
✅ Khôi phục thành công! Đã khôi phục 3/3 files
📁 Dữ liệu đã được khôi phục vào thư mục ./data/
```

### **Kiểm tra dữ liệu:**
```bash
# Kiểm tra số lượng users
cat ./data/users.json | jq 'keys | length'

# Kiểm tra cartridge của user
cat ./data/users.json | jq '.["your-user-id"].cartridge'
```

---

## 🎯 **Kết Luận**

1. **Cấu hình GitHub** trước khi restore
2. **Chạy script test** để kiểm tra kết nối
3. **Khôi phục từ GitHub** thay vì local backup
4. **Kiểm tra dữ liệu** sau khi khôi phục

**Nếu vẫn không được, hãy sử dụng lệnh `/cartridge add` để cộng thủ công!** 