const { mongoose, connectMongo } = require('./mongo');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  cartridge: { type: Number, default: 0 },
  voiceTime: { type: Number, default: 0 },
  totalVoice: { type: Number, default: 0 },
  lastClaim: { type: Number, default: 0 },
  // Thêm các trường khác nếu cần
}, { minimize: false });

const shopSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  name: String,
  price: Number,
  // Thêm các trường khác nếu cần
}, { minimize: false });

const emojiSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  emoji: String,
}, { minimize: false });

const User = mongoose.model('User', userSchema);
const Shop = mongoose.model('Shop', shopSchema);
const Emoji = mongoose.model('Emoji', emojiSchema);

async function loadUser(userId) {
  await connectMongo();
  let user = await User.findOne({ userId });
  if (!user) {
    user = new User({ userId });
    await user.save();
  }
  return user;
}

async function saveUser(userData) {
  await connectMongo();
  await User.updateOne({ userId: userData.userId }, userData, { upsert: true });
}

async function loadAllUsers() {
  await connectMongo();
  return User.find({});
}

async function loadShop() {
  await connectMongo();
  return Shop.find({});
}

async function saveShop(items) {
  await connectMongo();
  await Shop.deleteMany({});
  await Shop.insertMany(items);
}

async function loadEmojis() {
  await connectMongo();
  return Emoji.find({});
}

async function saveEmojis(emojis) {
  await connectMongo();
  await Emoji.deleteMany({});
  await Emoji.insertMany(emojis);
}

module.exports = {
  loadUser,
  saveUser,
  loadAllUsers,
  loadShop,
  saveShop,
  loadEmojis,
  saveEmojis,
  User,
  Shop,
  Emoji
};
