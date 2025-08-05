# Discord Bot - Voice & Cartridge System

Một bot Discord với hệ thống theo dõi voice, cartridge và shop đổi quà.

## Tính năng

### 🎙️ Voice Tracking
- Theo dõi thời gian voice của người dùng theo thời gian thực
- Tự động cộng cartridge dựa trên thời gian voice thực tế (1 cartridge/10 phút)
- Không có trùng lặp - chỉ cộng cartridge khi user rời voice
- Hiển thị top 10 người dùng voice nhiều nhất

### 🎁 Cartridge System
- Hệ thống cartridge tích lũy
- Điểm danh hàng ngày nhận cartridge (1-100, hoặc 1-200 nếu có Nitro)
- Shop đổi quà với cartridge

### 📊 Profile System
- Xem hồ sơ cá nhân với thống kê
- Hiển thị hạng cartridge và voice
- Tích hợp shop trong profile

### 🛍️ Shop System
- Admin có thể thêm/sửa phần quà
- Hệ thống đổi quà tự động
- Thông báo cho admin khi có người đổi quà

## Lệnh có sẵn

- `/profile` - Xem hồ sơ cá nhân
- `/diemdanh` - Điểm danh hàng ngày nhận cartridge
- `/topcartridge` - Top 10 người có nhiều cartridge nhất
- `/topvoice` - Top 10 người voice nhiều nhất
- `/setshop` - Admin: Thêm/sửa phần quà trong shop
- `/setemoji` - Admin: Đổi emoji mặc định
- `/voicecheck` - Admin: Kiểm tra trạng thái voice tracking và cartridge

## Cài đặt

1. Clone repository
2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` với các biến môi trường:
```env
TOKEN=your_discord_bot_token
CLIENT_ID=your_bot_client_id
OWNER_ID=your_discord_user_id
LOG_CHANNEL_ID=channel_id_for_logs
EXCLUSIVE_ROLE_ID=role_id_for_exclusive_rewards
PORT=3000
# 🛡️ Persistent Storage (Optional but recommended)
GITHUB_REPO=your-username/my-discord-bot-backup
GITHUB_TOKEN=ghp_your_github_token_here
```

4. Deploy slash commands:
```bash
npm run deploy
```

5. Chạy bot:
```bash
npm start
```

## Cấu trúc thư mục

```
my-discord-bot/
├── commands/          # Slash commands
├── components/        # Button handlers
├── events/           # Event handlers
├── jobs/             # Background jobs
├── utils/            # Utility functions
├── data/             # Data files
├── config.js         # Configuration
├── index.js          # Main bot file
└── deploy-commands.js
```

## Tính năng nâng cao

- **Voice Tracking**: Tự động theo dõi thời gian voice và cộng cartridge
- **Nitro Bonus**: Người dùng có Nitro nhận nhiều cartridge hơn
- **Shop System**: Hệ thống đổi quà với cartridge
- **Role Management**: Tự động thêm role khi đổi quà
- **Logging**: Ghi log các hoạt động đổi quà
- **Web Service**: Giữ bot hoạt động trên hosting
- **🛡️ Persistent Storage**: Bảo vệ dữ liệu khi deploy với GitHub backup
- **🔄 Auto-Sync**: Đồng bộ dữ liệu tự động mỗi 5 phút
- **📊 Backup Management**: Quản lý backup với khôi phục từ GitHub

## Lưu ý

- Bot cần quyền `GuildVoiceStates` để theo dõi voice
- Cần tạo role và channel log trước khi sử dụng
- Đảm bảo bot có quyền quản lý role để thêm role cho người dùng
- **🛡️ Persistent Storage**: Để bảo vệ dữ liệu khi deploy, hãy cấu hình GitHub backup theo hướng dẫn trong `PERSISTENT_SETUP_GUIDE.md` 