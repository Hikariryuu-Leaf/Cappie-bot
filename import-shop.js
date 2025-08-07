const fs = require('fs');
const path = require('path');
const { saveShop } = require('./utils/database');

async function importShop() {
  const filePath = path.join(__dirname, 'data', 'shop.json');
  if (!fs.existsSync(filePath)) {
    console.error('❌ Không tìm thấy file data/shop.json');
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('❌ Lỗi đọc file shop.json:', e.message);
    process.exit(1);
  }
  // Chuyển đổi sang mảng { name, price }
  const items = Object.entries(data).map(([name, price], idx) => ({
    itemId: `item${idx+1}`,
    name,
    price
  }));
  if (items.length === 0) {
    console.error('❌ File shop.json không có item nào!');
    process.exit(1);
  }
  try {
    await saveShop(items);
    console.log(`✅ Đã import ${items.length} item vào shop (MongoDB)`);
  } catch (e) {
    console.error('❌ Lỗi khi lưu vào database:', e.message);
    process.exit(1);
  }
  process.exit(0);
}

importShop();