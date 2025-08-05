# Hướng Dẫn Lệnh Cartridge và Voice Tracking

## 🎯 **Lệnh Cartridge Mới**

### 📋 **Các Lệnh Có Sẵn:**

#### 1. **Tăng Cartridge**
```
/cartridge add @user amount
```
**Ví dụ:**
```
/cartridge add @username 100
```
- Tăng 100 cartridge cho user
- Chỉ Admin mới sử dụng được

#### 2. **Giảm Cartridge**
```
/cartridge remove @user amount
```
**Ví dụ:**
```
/cartridge remove @username 50
```
- Giảm 50 cartridge của user
- Không giảm xuống dưới 0

#### 3. **Đặt Cartridge**
```
/cartridge set @user amount
```
**Ví dụ:**
```
/cartridge set @username 1000
```
- Đặt cartridge về 1000
- Thay thế hoàn toàn số cartridge hiện tại

#### 4. **Kiểm Tra Cartridge**
```
/cartridge check @user
```
**Ví dụ:**
```
/cartridge check @username
```
- Xem cartridge hiện tại của user
- Hiển thị thông tin chi tiết

---

## 🎤 **Voice Tracking Cải Thiện**

### ⚡ **Cách Hoạt Động Mới:**

#### **Trước đây (cũ):**
- Cộng 1 cartridge mỗi 10 phút
- Chỉ cộng khi user đang trong voice
- Không tracking thời gian chính xác

#### **Bây giờ (mới):**
- **Cộng 1 cartridge mỗi 10 phút** (theo thời gian thực)
- **Tracking thời gian chính xác** khi join/leave voice
- **Cộng thêm cartridge** khi leave voice dựa trên thời gian thực

### 📊 **Ví Dụ Thực Tế:**

#### **Trường hợp 1: User ở voice 2 giờ 8 phút**
```
Join voice: 19:00:00
Leave voice: 21:08:00
Thời gian: 2 giờ 8 phút = 128 phút
Cartridge nhận được: 12 cartridge (128 ÷ 10 = 12.8, làm tròn xuống 12)
```

#### **Trường hợp 2: User ở voice 30 phút**
```
Join voice: 20:00:00
Leave voice: 20:30:00
Thời gian: 30 phút
Cartridge nhận được: 3 cartridge (30 ÷ 10 = 3)
```

---

## 🔧 **Cách Tính Cartridge Voice**

### **Công thức:**
```
Cartridge = Thời gian voice (phút) ÷ 10
```

### **Ví dụ:**
- **10 phút voice** = 10 ÷ 10 = **1 cartridge**
- **1 giờ voice** = 60 ÷ 10 = **6 cartridge**
- **2 giờ 8 phút** = 128 ÷ 10 = **12 cartridge**

---

## 📈 **So Sánh Hệ Thống**

| Tính năng | Hệ thống cũ | Hệ thống mới |
|-----------|-------------|--------------|
| **Tần suất cộng** | 10 phút/lần | 10 phút/lần |
| **Tracking thời gian** | ❌ Không chính xác | ✅ Chính xác |
| **Cộng khi leave** | ❌ Không có | ✅ Có |
| **Tốc độ** | Chậm | Nhanh và chính xác |

---

## 🎯 **Giải Quyết Vấn Đề Của Bạn**

### **Vấn đề:** "Ở voice 2 giờ 8 phút nhưng không được cộng cartridge"

### **Nguyên nhân có thể:**
1. **Bot restart** - Voice tracking bị reset
2. **User join trước khi bot start** - Không được track
3. **Network issues** - Bot không nhận được events

### **Giải pháp:**
1. **Kiểm tra logs** để xem voice tracking có hoạt động không
2. **Sử dụng lệnh cartridge** để cộng thủ công:
   ```
   /cartridge add @yourself 12
   ```
3. **Restart bot** nếu cần

---

## 📋 **Lệnh Hữu Ích**

### **Kiểm tra cartridge:**
```
/cartridge check @username
```

### **Cộng thủ công:**
```
/cartridge add @username 100
```

### **Kiểm tra voice time:**
```
/profile
```
(Sẽ hiển thị tổng thời gian voice)

---

## ⚠️ **Lưu Ý Quan Trọng**

1. **Voice tracking** chỉ hoạt động khi bot online
2. **Nếu bot restart** - Thời gian tracking bị reset
3. **User phải join voice sau khi bot start** để được track
4. **Có thể sử dụng lệnh cartridge** để cộng thủ công

---

## 🎯 **Kết Luận**

✅ **Đã cải thiện:** Voice tracking chính xác hơn  
✅ **Đã thêm:** Lệnh quản lý cartridge  
✅ **Đã cải thiện:** Tracking thời gian thực và cộng khi leave voice  

**Nếu vẫn không được cộng cartridge**, hãy sử dụng lệnh `/cartridge add` để cộng thủ công! 