# Bảo Vệ Dữ Liệu Trên Render - Hướng Dẫn Chi Tiết

## Vấn Đề Với Render

Render sử dụng **ephemeral storage**, có nghĩa là:
- Dữ liệu sẽ bị mất khi bot restart
- Dữ liệu sẽ bị mất khi deploy lại
- Dữ liệu sẽ bị mất khi service bị tắt

## Giải Pháp Đã Triển Khai

### 🛡️ **Persistent Storage System**
- Tự động backup mỗi 5 phút
- Sync lên external storage (GitHub)
- Emergency backup khi shutdown
- Khôi phục tự động khi restart

### 📋 **Commands Mới**
```
/persistent backup    # Tạo backup toàn diện
/persistent restore   # Khôi phục từ backup
/persistent list      # Xem danh sách backup
/persistent sync      # Sync ngay lập tức
```

## Cấu Hình Render

### 1. **Environment Variables**
Thêm các biến môi trường sau trong Render Dashboard:

```
TOKEN=your_discord_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id

# GitHub backup (optional)
GITHUB_REPO=your_username/your_repo
GITHUB_TOKEN=your_github_token

# Cloud storage (optional)
CLOUD_CREDENTIALS=your_cloud_credentials
```

### 2. **Build Command**
```bash
npm install
```

### 3. **Start Command**
```bash
node index.js
```

## Quy Trình Bảo Vệ Dữ Liệu

### 🔄 **Trước Khi Deploy**
1. **Tạo backup thủ công**:
   ```
   /persistent backup
   ```

2. **Kiểm tra backup**:
   ```
   /persistent list
   ```

3. **Deploy code mới**

### 🔄 **Sau Khi Deploy**
1. **Kiểm tra dữ liệu**:
   ```
   /profile
   /diemdanh
   ```

2. **Nếu dữ liệu bị mất, khôi phục**:
   ```
   /persistent restore
   ```

3. **Tạo backup mới**:
   ```
   /persistent backup
   ```

## Cấu Hình GitHub Backup

### 1. **Tạo GitHub Token**
1. Vào [GitHub Settings](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Chọn scopes: `repo`, `workflow`
4. Copy token

### 2. **Cấu Hình Repository**
1. Tạo repository mới trên GitHub
2. Clone về local:
   ```bash
   git clone https://github.com/your_username/your_repo.git
   cd your_repo
   ```

3. Tạo branch cho data backup:
   ```bash
   git checkout -b data-backup
   git push origin data-backup
   ```

### 3. **Thêm Environment Variables**
Trong Render Dashboard, thêm:
```
GITHUB_REPO=your_username/your_repo
GITHUB_TOKEN=your_github_token
```

## Monitoring và Troubleshooting

### 📊 **Kiểm Tra Logs**
Tìm kiếm các log sau trong Render:
```
[PERSISTENT] Comprehensive backup created
[PERSISTENT] External sync completed successfully
[PERSISTENT] Emergency backup completed
```

### ❌ **Lỗi Thường Gặp**

#### Lỗi "GitHub sync failed"
**Nguyên nhân**: Token không đúng hoặc repository không tồn tại
**Giải pháp**:
1. Kiểm tra GitHub token
2. Kiểm tra repository URL
3. Đảm bảo token có quyền write

#### Lỗi "No backups available for restore"
**Nguyên nhân**: Chưa có backup nào được tạo
**Giải pháp**:
1. Tạo backup thủ công: `/persistent backup`
2. Kiểm tra logs để đảm bảo backup thành công

#### Lỗi "Backup creation failed"
**Nguyên nhân**: Không có quyền ghi file
**Giải pháp**:
1. Kiểm tra quyền thư mục
2. Restart service
3. Kiểm tra dung lượng ổ đĩa

## Best Practices

### 🛡️ **Trước Mỗi Deploy**
1. **Tạo backup thủ công**:
   ```
   /persistent backup
   ```

2. **Kiểm tra backup thành công**:
   ```
   /persistent list
   ```

3. **Deploy code**

4. **Kiểm tra dữ liệu sau deploy**

### 📋 **Monitoring Hàng Ngày**
1. **Kiểm tra logs Render** mỗi ngày
2. **Test commands** để đảm bảo hoạt động
3. **Monitor backup frequency**

### 🔄 **Maintenance Hàng Tuần**
1. **Review backup logs**
2. **Clean up old backups** nếu cần
3. **Update dependencies**

## Emergency Procedures

### 🚨 **Khi Dữ Liệu Bị Mất**
1. **Khôi phục từ backup**:
   ```
   /persistent restore
   ```

2. **Kiểm tra dữ liệu**:
   ```
   /profile
   ```

3. **Tạo backup mới**:
   ```
   /persistent backup
   ```

### 🚨 **Khi Bot Không Start**
1. **Kiểm tra logs Render**
2. **Restart service**
3. **Kiểm tra environment variables**

### 🚨 **Khi Backup Không Hoạt Động**
1. **Kiểm tra GitHub token**
2. **Kiểm tra repository permissions**
3. **Test sync manually**: `/persistent sync`

## Advanced Configuration

### 🔧 **Tùy Chỉnh Backup Frequency**
Trong `utils/persistentStorage.js`:
```javascript
autoSyncInterval: 5 * 60 * 1000, // 5 minutes
```

### 🔧 **Tùy Chỉnh Cloud Storage**
Thêm cloud storage provider:
```javascript
cloud: {
  enabled: true,
  provider: 'gdrive', // or 'dropbox', 'onedrive'
  credentials: process.env.CLOUD_CREDENTIALS
}
```

### 🔧 **Tùy Chỉnh Backup Retention**
Trong `utils/backupManager.js`:
```javascript
maxAutoBackups: 20, // Keep 20 auto backups
maxManualBackups: 50, // Keep 50 manual backups
```

## Kết Luận

✅ **Đã triển khai**: Persistent storage system
✅ **Đã bảo vệ**: Dữ liệu khỏi mất mát trên Render
✅ **Đã chuẩn bị**: Emergency procedures và monitoring

**Lưu ý quan trọng**: Luôn tạo backup thủ công trước khi deploy và monitor logs để đảm bảo hệ thống hoạt động ổn định.

## Liên Hệ Hỗ Trợ

Nếu gặp vấn đề với persistent storage:
1. Kiểm tra logs Render
2. Test commands manually
3. Verify GitHub configuration
4. Contact admin for additional support 