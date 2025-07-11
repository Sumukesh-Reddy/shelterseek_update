require('dotenv').config({ path: './.env' });
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { GridFSBucket } = require('mongodb');
const mkdirp = require('mkdirp');
const { signUp, fetchUserByEmailPassword, getUsers } = require('./controller/usercontroller');
const hostController = require('./controller/hostController');
const adminController = require('./controller/adminController');
const { Traveler, Host } = require('./model/usermodel');
const Booking = require('./model/booking').Booking;
const { ObjectId } = mongoose.Types;

const app = express();
const port = process.env.PORT || 3000;

// Setup uploads directory
const uploadsDir = path.join(__dirname, 'public/uploads');
try {
  mkdirp.sync(uploadsDir);
  fs.chmodSync(uploadsDir, 0o775);
} catch (err) {
  console.error('Error setting up uploads directory:', err.message);
  process.exit(1);
}

const upload = multer({ 
  dest: uploadsDir,
  storage: multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  })
});

// Database Connections
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/loginDataBase';
const HOST_ADMIN_URI = process.env.HOST_ADMIN_URI || 'mongodb://localhost:27017/Host_Admin';
const ADMIN_TRAVELER_URI = process.env.ADMIN_TRAVELER_URI || 'mongodb://localhost:27017/Admin_Traveler';
const PAYMENT_DB_URI = process.env.PAYMENT_DB_URI || 'mongodb://localhost:27017/payment';

if (!process.env.MONGODB_URI || !process.env.HOST_ADMIN_URI || !process.env.ADMIN_TRAVELER_URI || !process.env.PAYMENT_DB_URI) {
  console.warn('Warning: One or more MongoDB URIs not defined in .env file. Using defaults.');
}

// loginDataBase connection
mongoose.connect(MONGODB_URI, {
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
}).then(() => console.log('Connected to loginDataBase'))
  .catch(err => console.error('loginDataBase connection error:', err.message));

// LoginData model
const loginDataSchema = new mongoose.Schema({
  name: String,
  email: String,
  accountType: String,
  createdAt: { type: Date, default: Date.now }
});
const LoginData = mongoose.model('LoginData', loginDataSchema, 'LoginData');

// Host_Admin connection
const hostAdminConnection = mongoose.createConnection(HOST_ADMIN_URI, {
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
});
hostAdminConnection.on('connected', () => console.log('Connected to Host_Admin'));
hostAdminConnection.on('error', err => console.error('Host_Admin connection error:', err));
hostAdminConnection.on('disconnected', () => console.log('Disconnected from Host_Admin'));

// GridFS for Host_Admin
let gfsBucket;
hostAdminConnection.once('open', () => {
  gfsBucket = new GridFSBucket(hostAdminConnection.db, { bucketName: 'images' });
  console.log('GridFSBucket initialized for Host_Admin');
});

// Admin_Traveler connection
const travelerConnection = mongoose.createConnection(ADMIN_TRAVELER_URI, {
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
});
travelerConnection.on('connected', () => console.log('Connected to Admin_Traveler'));
travelerConnection.on('error', err => console.error('Admin_Traveler connection error:', err));
travelerConnection.on('disconnected', () => console.log('Disconnected from Admin_Traveler'));

// Room schema
const roomSchema = new mongoose.Schema({
  name: String,
  email: String,
  title: String,
  description: String,
  price: Number,
  location: String,
  coordinates: Object,
  propertyType: String,
  capacity: Number,
  roomType: String,
  bedrooms: Number,
  beds: Number,
  roomSize: String,
  roomLocation: String,
  transportDistance: String,
  hostGender: String,
  foodFacility: String,
  amenities: [String],
  discount: Number,
  maxdays: Number,
  images: [String],
  createdAt: Date,
  status: String,
  transferredAt: Date
}, { collection: 'RoomDataTraveler' });
const Room = travelerConnection.model('Room', roomSchema);

// No unique index creation needed since _id is inherently unique
Room.init().then(() => {
  console.log('No additional unique index created for _id as it is inherently unique');
});

// Payment connection
const paymentConnection = mongoose.createConnection(PAYMENT_DB_URI, {
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
});
paymentConnection.on('connected', () => console.log('Connected to payment'));
paymentConnection.on('error', err => console.error('payment connection error:', err));
paymentConnection.on('disconnected', () => console.log('Disconnected from payment'));

// Middleware
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://unpkg.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "'unsafe-inline'"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://unpkg.com",
        "https://cdnjs.cloudflare.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://*.tile.openstreetmap.org",
        "https://cdn.jsdelivr.net",
        "https://res.cloudinary.com",
        "https://unpkg.com",
        `http://localhost:${port}`,
        `http://localhost:${port}/public/uploads/`,
        `http://localhost:${port}/images/`
      ],
      connectSrc: ["'self'"],
      scriptSrcAttr: ["'none'"]
    }
  })
);

app.use(cors({ origin: true, credentials: true }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

const limiter = rateLimit({
  max: 500,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// RoomData middleware
app.use(async (req, res, next) => {
  try {
    const RoomData = hostAdminConnection.collection('RoomData');
    const allRooms = await RoomData.find({}, { projection: { likes: 0, booking: 0, reviews: 0, contact: 0, hostId: 0 } }).limit(10).toArray();
    const pendingRooms = await RoomData.find({ status: 'pending' }, { projection: { likes: 0, booking: 0, reviews: 0, contact: 0, hostId: 0 } }).limit(5).toArray();
    
    // Validate and clean image URLs
    const validateImageUrl = async (image) => {
      if (!image) return null;
      if (ObjectId.isValid(image.$oid || image)) {
        const imageId = image.$oid || image;
        const exists = await gfsBucket.find({ _id: new ObjectId(imageId) }).toArray();
        return exists.length > 0 ? `/api/images/${imageId}` : null;
      } else if (image.startsWith('public/uploads/')) {
        const filePath = path.join(__dirname, image);
        return fs.existsSync(filePath) ? `/public/${image}` : null;
      }
      return null;
    };

    const cleanedAllRooms = await Promise.all(allRooms.map(async room => ({
      ...room,
      images: (await Promise.all((room.images || []).map(validateImageUrl))).filter(url => url) || ['/images/placeholder.png']
    })));
    const cleanedPendingRooms = await Promise.all(pendingRooms.map(async room => ({
      ...room,
      images: (await Promise.all((room.images || []).map(validateImageUrl))).filter(url => url) || ['/images/placeholder.png']
    })));

    req.roomData = { allRooms: cleanedAllRooms, pendingRooms: cleanedPendingRooms };
    next();
  } catch (error) {
    console.error('RoomData Middleware Error:', error.message);
    req.roomData = { allRooms: [], pendingRooms: [] };
    next();
  }
});

// Routes
const renderPage = (pageName) => (req, res) => res.render(pageName);

app.get('/', renderPage('home'));
app.get('/about', renderPage('about'));
app.get('/city_houses', renderPage('city_houses'));
app.get('/history', renderPage('history'));
app.get('/messages', renderPage('messages'));
app.get('/message', renderPage('message'));
app.get('/payment', renderPage('payment'));
app.get('/room_layout', renderPage('room_layout'));
app.get('/wishlist', renderPage('wishlist'));
app.get('/loginweb', renderPage('loginweb'));
app.get('/profile', renderPage('profile'));
app.get('/privacypolicy', renderPage('privacypolicy'));
app.get('/host_index', renderPage('host_index'));
app.get('/dashboard', renderPage('dashboard'));
app.get('/ex', renderPage('ex'));
app.get('/hostProfile', renderPage('hostProfile'));

// Admin routes
app.get('/admin_index', async (req, res) => {
  try {
    const RoomData = hostAdminConnection.collection('RoomData');
    const Bookings = paymentConnection.collection('bookings');
    const newCustomers = await LoginData.find({ accountType: 'traveller' }).sort({ createdAt: -1 }).limit(5).lean();
    const recentActivities = await RoomData.find({}).sort({ updatedAt: -1 }).limit(5).toArray();
    const bookings = await Bookings.find({}).sort({ checkIn: -1 }).limit(50).toArray();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)); startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999);

    const totalRevenue = (await Bookings.aggregate([{ $match: { amount: { $exists: true } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).toArray())[0]?.total / 100 || 0;
    const thisMonthRevenue = (await Bookings.aggregate([{ $match: { checkIn: { $gte: startOfMonth, $lte: endOfMonth }, amount: { $exists: true } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).toArray())[0]?.total / 100 || 0;
    const thisWeekRevenue = (await Bookings.aggregate([{ $match: { checkIn: { $gte: startOfWeek, $lte: endOfWeek }, amount: { $exists: true } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).toArray())[0]?.total / 100 || 0;

    const totalBookings = await Bookings.countDocuments({});
    const thisMonthBookings = await Bookings.countDocuments({ checkIn: { $gte: startOfMonth, $lte: endOfMonth } });
    const thisWeekBookings = await Bookings.countDocuments({ checkIn: { $gte: startOfWeek, $lte: endOfWeek } });

    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const previousMonthBookings = await Bookings.countDocuments({ checkIn: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } });
    let trendPercentage = previousMonthBookings > 0 ? ((thisMonthBookings - previousMonthBookings) / previousMonthBookings * 100).toFixed(2) : thisMonthBookings > 0 ? 100 : 0;
    const trendDirection = trendPercentage >= 0 ? 'up' : 'down'; trendPercentage = Math.abs(trendPercentage);

    res.render('admin_index', {
      newCustomers: newCustomers.map(c => ({ name: c.name || 'Unknown', email: c.email || 'No email', initials: c.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'NA' })),
      recentActivities: recentActivities.map(r => ({ name: r.name || 'Unknown', initials: r.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'NA', action: r.status === 'pending' ? 'requested for room' : r.status === 'Approved' ? 'confirmed booking' : r.status === 'Rejected' ? 'cancelled booking' : 'updated their request', updatedAt: r.updatedAt || new Date() })),
      bookings: bookings.map(b => ({ id: b.roomId || 'N/A', guestName: b.userName || 'Unknown', checkIn: b.checkIn?.toISOString().split('T')[0] || 'N/A', checkOut: b.checkOut?.toISOString().split('T')[0] || 'N/A', amount: b.amount?.toFixed(2) || '0.00', email: b.mainUserEmail || 'N/A' })),
      totalRevenue: totalRevenue.toFixed(2), thisMonthRevenue: thisMonthRevenue.toFixed(2), thisWeekRevenue: thisWeekRevenue.toFixed(2),
      totalBookings, thisMonthBookings, thisWeekBookings, trendPercentage, trendDirection
    });
  } catch (error) {
    console.error('Error rendering admin_index:', error.message);
    res.render('admin_index', { newCustomers: [], recentActivities: [], bookings: [], totalRevenue: '0.00', thisMonthRevenue: '0.00', thisWeekRevenue: '0.00', totalBookings: 0, thisMonthBookings: 0, thisWeekBookings: 0, trendPercentage: 0, trendDirection: 'neutral' });
  }
});
app.get('/admin_logout', renderPage('admin_logout'));
app.get('/admin_notes', renderPage('admin_notes'));
app.get('/help_index', renderPage('help_index'));
app.get('/admin_notifications', async (req, res) => {
  try {
    const activeTab = req.query.tab || 'host';
    const users = await LoginData.find({ accountType: activeTab === 'host' ? 'host' : 'traveller' }).lean();
    res.render('admin_notifications', { activeTab, users: users || [] });
  } catch (error) {
    console.error('Error in admin_notifications:', error);
    res.render('admin_notifications', { activeTab: 'host', users: [], error: error.message });
  }
});
app.get('/admin_revenue', renderPage('admin_revenue'));
app.get('/admin_account', renderPage('admin_account'));
app.get('/admin_host-requests', async (req, res) => {
  const rooms = req.roomData.allRooms.map(room => ({
    _id: room._id?.toString(),
    name: room.name || 'Unknown',
    email: room.email || 'No email',
    title: room.title || 'No title',
    description: room.description || 'No description',
    price: room.price?.toString() || 'N/A',
    location: room.locationName || room.location || 'N/A',
    coordinates: JSON.stringify(room.coordinates) || 'N/A',
    propertyType: room.propertyType || 'N/A',
    capacity: room.capacity?.toString() || 'N/A',
    roomType: room.roomType || 'N/A',
    bedrooms: room.bedrooms?.toString() || 'N/A',
    beds: room.beds?.toString() || 'N/A',
    roomSize: room.roomSize || 'N/A',
    roomLocation: room.roomLocation || 'N/A',
    transportDistance: room.transportDistance || 'N/A',
    hostGender: room.hostGender || 'N/A',
    foodFacility: room.foodFacility || 'N/A',
    amenities: room.amenities?.join(', ') || 'N/A',
    discount: room.discount?.toString() || 'N/A',
    maxdays: (room.maxdays || room.maxDays)?.toString() || 'N/A',
    images: room.images || ['/images/placeholder.png'],
    createdAt: room.createdAt || 'N/A',
    status: room.status || 'pending'
  }));
  res.render('admin_host-requests', { hostRequests: rooms || [] });
});

// API Routes
app.post('/api/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No image uploaded' });
    }
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'images' });
    const uploadStream = bucket.openUploadStream(req.file.originalname, { contentType: req.file.mimetype });
    fs.createReadStream(req.file.path).pipe(uploadStream)
      .on('error', (error) => {
        console.error('Error streaming image to GridFS:', error.message);
        throw error;
      })
      .on('finish', () => {
        fs.unlinkSync(req.file.path);
        res.json({ status: 'success', data: { id: uploadStream.id.toString(), filename: req.file.originalname } });
      });
  } catch (error) {
    console.error('Error uploading image:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to upload image' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, userEmail, userName, mainUserEmail, hostMail, cost } = req.body;
    if (!roomId || !checkIn || !checkOut || !userEmail || !userName || !mainUserEmail || !hostMail || !cost) {
      return res.status(400).json({ status: 'fail', message: 'All fields are required' });
    }
    const booking = new Booking({ roomId, checkIn: new Date(checkIn), checkOut: new Date(checkOut), userEmail, userName, mainUserEmail, hostMail, amount: parseFloat(cost), paymentDate: new Date() });
    await booking.save();
    res.status(201).json({ status: 'success', data: booking });
  } catch (error) {
    console.error('Error creating booking:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to create booking' });
  }
});

app.post('/api/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword, accountType } = req.body;
    if (!email || !currentPassword || !newPassword || !accountType) return res.status(400).json({ status: 'fail', message: 'All fields are required' });
    const Model = accountType === 'traveller' ? Traveler : Host;
    const user = await Model.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(currentPassword))) return res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
    user.password = newPassword;
    await user.save();
    res.status(200).json({ status: 'success', message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

app.patch('/api/update-profile-photo', async (req, res) => {
  try {
    const { email, accountType, profilePhoto } = req.body;
    if (!email || !accountType || !profilePhoto) {
      return res.status(400).json({ status: "fail", message: "Email, accountType, and profilePhoto are required" });
    }
    const Model = accountType === 'traveller' ? Traveler : Host;
    const user = await Model.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }
    if (user.profilePhoto && mongoose.Types.ObjectId.isValid(user.profilePhoto)) {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'images' });
      try {
        await bucket.delete(new mongoose.Types.ObjectId(user.profilePhoto));
        console.log(`Deleted old profile photo ID: ${user.profilePhoto}`);
      } catch (err) {
        console.warn('Failed to delete old profile photo:', err.message);
      }
    }
    user.profilePhoto = profilePhoto;
    await user.save();
    res.status(200).json({ status: "success", data: { user: { name: user.name, email: user.email, accountType: user.accountType, profilePhoto: user.profilePhoto ? `/api/images/${user.profilePhoto}` : null } } });
  } catch (error) {
    console.error('Error updating profile photo:', error.message);
    res.status(500).json({ status: "error", message: "Failed to update profile photo", error: error.message });
  }
});

app.get('/api/bookings/host/:hostEmail', async (req, res) => {
  try {
    const bookings = await Booking.find({ hostMail: req.params.hostEmail }).lean();
    res.json({ status: 'success', data: { bookings } });
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch bookings' });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await paymentConnection.collection('bookings').find({}).sort({ checkIn: -1 }).limit(50).toArray();
    res.json({ data: bookings.map(b => ({ id: b.roomId || 'N/A', guestName: b.userName || 'Unknown', checkIn: b.checkIn?.toISOString().split('T')[0] || 'N/A', checkOut: b.checkOut?.toISOString().split('T')[0] || 'N/A', amount: (b.amount / 100)?.toFixed(2) || '0.00', email: b.mainUserEmail || 'N/A' })) });
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post('/api/listings', upload.array('media'), hostController.createListing);
app.get('/api/listings', hostController.getListings);
app.patch('/api/listings/:listingId/status', hostController.updateListingStatus);
app.get('/api/listings/:id', hostController.getListingById);
app.put('/api/listings/:id', upload.array('media'), hostController.updateListing);
app.delete('/api/listings/:id', hostController.deleteListing);

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'Approved' }).lean();
    const validateImageUrl = async (image) => {
      if (!image) return null;
      if (ObjectId.isValid(image.$oid || image)) {
        const imageId = image.$oid || image;
        const exists = await gfsBucket.find({ _id: new ObjectId(imageId) }).toArray();
        return exists.length > 0 ? `/api/images/${imageId}` : null;
      } else if (image.startsWith('public/uploads/')) {
        const filePath = path.join(__dirname, image);
        return fs.existsSync(filePath) ? `/public/${image}` : null;
      }
      return null;
    };

    const cleanedRooms = await Promise.all(rooms.map(async room => ({
      ...room,
      images: (await Promise.all((room.images || []).map(validateImageUrl))).filter(url => url) || ['/images/placeholder.png'],
      hostImage: room.hostImage && ObjectId.isValid(room.hostImage) ? `/api/images/${room.hostImage}` : room.hostImage || '/images/sai.png'
    })));

    res.json({ status: 'success', data: cleanedRooms });
  } catch (error) {
    console.error('Error fetching rooms:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch rooms' });
  }
});

app.get('/api/health', (req, res) => {
  const imageChecks = {
    defaultProperty: fs.existsSync(path.join(__dirname, 'public/images/photo1.png')),
    logo: fs.existsSync(path.join(__dirname, 'public/images/logo.png')),
    defaultUser: fs.existsSync(path.join(__dirname, 'public/images/sai.png')),
    placeholder: fs.existsSync(path.join(__dirname, 'public/images/placeholder.png'))
  };
  res.json({ status: 'healthy', images: imageChecks, database: { main: mongoose.connection.readyState === 1, traveler: travelerConnection.readyState === 1 } });
});

app.get('/api/host-requests', async (req, res) => {
  try {
    const validateImageUrl = async (image) => {
      if (!image) return null;
      if (ObjectId.isValid(image.$oid || image)) {
        const imageId = image.$oid || image;
        const exists = await gfsBucket.find({ _id: new ObjectId(imageId) }).toArray();
        return exists.length > 0 ? `/api/images/${imageId}` : null;
      } else if (image.startsWith('public/uploads/')) {
        const filePath = path.join(__dirname, image);
        return fs.existsSync(filePath) ? `/public/${image}` : null;
      }
      return null;
    };

    const rooms = req.roomData.allRooms.map(room => ({
      _id: room._id?.toString(),
      name: room.name || 'Unknown',
      email: room.email || 'No email',
      title: room.title || 'No title',
      description: room.description || 'No description',
      price: room.price?.toString() || 'N/A',
      location: room.locationName || room.location || 'N/A',
      coordinates: JSON.stringify(room.coordinates) || 'N/A',
      propertyType: room.propertyType || 'N/A',
      capacity: room.capacity?.toString() || 'N/A',
      roomType: room.roomType || 'N/A',
      bedrooms: room.bedrooms?.toString() || 'N/A',
      beds: room.beds?.toString() || 'N/A',
      roomSize: room.roomSize || 'N/A',
      roomLocation: room.roomLocation || 'N/A',
      transportDistance: room.transportDistance || 'N/A',
      hostGender: room.hostGender || 'N/A',
      foodFacility: room.foodFacility || 'N/A',
      amenities: room.amenities?.join(', ') || 'N/A',
      discount: room.discount?.toString() || 'N/A',
      maxdays: (room.maxdays || room.maxDays)?.toString() || 'N/A',
      images: room.images || ['/images/placeholder.png'],
      createdAt: room.createdAt || 'N/A',
      status: room.status || 'pending'
    }));
    res.json({ data: rooms });
  } catch (error) {
    console.error('Error fetching host requests:', error.message);
    res.status(500).json({ error: 'Failed to fetch host requests' });
  }
});

app.get('/api/new-customers', async (req, res) => {
  try {
    const newCustomers = await LoginData.find({ accountType: 'traveller' }).sort({ createdAt: -1 }).limit(5).lean();
    res.json({ data: newCustomers.map(c => ({ name: c.name || 'Unknown', email: c.email || 'No email', initials: c.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'NA', createdAt: c.createdAt?.toISOString() || 'N/A' })) });
  } catch (error) {
    console.error('Error fetching new customers:', error.message);
    res.status(500).json({ error: 'Failed to fetch new customers' });
  }
});

app.get('/api/recent-activities', async (req, res) => {
  try {
    const recentActivities = await hostAdminConnection.collection('RoomData').find({}).sort({ updatedAt: -1 }).limit(5).toArray();
    res.json({ data: recentActivities.map(r => ({ name: r.name || 'Unknown', email: r.email || 'No email', initials: r.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'NA', action: r.status === 'pending' ? 'requested for room' : r.status === 'Approved' ? 'confirmed booking' : r.status === 'Rejected' ? 'cancelled booking' : 'updated their request', updatedAt: r.updatedAt || new Date() })) });
  } catch (error) {
    console.error('Error fetching recent activities:', error.message);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

app.get('/api/host-requests/images', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing required field: id' });
    const room = await hostAdminConnection.collection('RoomData').findOne({ _id: new ObjectId(id) }, { projection: { images: 1 } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    const validateImageUrl = async (image) => {
      if (!image) return null;
      if (ObjectId.isValid(image.$oid || image)) {
        const imageId = image.$oid || image;
        const exists = await gfsBucket.find({ _id: new ObjectId(imageId) }).toArray();
        return exists.length > 0 ? `/api/images/${imageId}` : null;
      } else if (image.startsWith('public/uploads/')) {
        const filePath = path.join(__dirname, image);
        return fs.existsSync(filePath) ? `/public/${image}` : null;
      }
      return null;
    };

    const imageUrls = (await Promise.all((room.images || []).map(validateImageUrl))).filter(url => url) || ['/images/placeholder.png'];
    if (!imageUrls.length) {
      console.warn(`No valid images found for room ID ${id}`);
      return res.json({ images: ['/images/placeholder.png'] });
    }
    res.json({ images: imageUrls });
  } catch (error) {
    console.error(`Error fetching images for room ID ${req.query.id}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

app.get('/api/images/:id', async (req, res) => {
  try {
    const imageId = new ObjectId(req.params.id);
    const image = await gfsBucket.find({ _id: imageId }).toArray();
    if (!image || image.length === 0) {
      console.warn(`Image not found for ID: ${req.params.id}`);
      return res.status(404).send('Image not found');
    }
    res.set('Content-Type', image[0].contentType);
    const readStream = gfsBucket.openDownloadStream(imageId);
    readStream.on('error', (error) => {
      console.error(`Error streaming image ID ${req.params.id}:`, error.message);
      res.status(500).send('Server error');
    });
    readStream.pipe(res);
  } catch (error) {
    console.error(`Error fetching image ID ${req.params.id}:`, error.message);
    res.status(500).send('Server error');
  }
});

app.get('/public/:path(*)', (req, res) => {
  const filePath = path.join(__dirname, 'public', req.params.path);
  res.sendFile(filePath, (err) => { if (err) res.status(404).json({ error: 'File not found' }); });
});

app.post('/api/host-requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const RoomData = hostAdminConnection.collection('RoomData');
    const RoomDataTraveler = travelerConnection.collection('RoomDataTraveler');
    const room = await RoomData.findOne({ _id: new ObjectId(id) });
    if (!room) return res.status(404).json({ error: 'No document found' });

    // Update status in RoomData
    const result = await RoomData.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0 || result.modifiedCount === 0) {
      return res.status(400).json({ error: 'No changes made' });
    }

    // Validate image URLs
    const validateImageUrl = async (image) => {
      if (!image) return null;
      if (ObjectId.isValid(image.$oid || image)) {
        const imageId = image.$oid || image;
        const exists = await gfsBucket.find({ _id: new ObjectId(imageId) }).toArray();
        return exists.length > 0 ? imageId : null;
      } else if (image.startsWith('public/uploads/')) {
        const filePath = path.join(__dirname, image);
        return fs.existsSync(filePath) ? image : null;
      }
      return null;
    };
    const cleanedImages = (await Promise.all((room.images || []).map(validateImageUrl))).filter(img => img);

    if (status === 'Approved') {
      // Use upsert to update or insert into RoomDataTraveler, matching by _id
      await RoomDataTraveler.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...room,
            images: cleanedImages.length > 0 ? cleanedImages : ['/images/placeholder.png'],
            status: 'Approved',
            transferredAt: new Date(),
          },
        },
        { upsert: true }
      );
    } else if (status === 'Rejected') {
      // Delete from RoomDataTraveler regardless of previous status
      await RoomDataTraveler.deleteOne({ _id: new ObjectId(id) });
    }

    // Fetch updated rooms for response
    const updatedRooms = await RoomData.find({}, { projection: { likes: 0, booking: 0, reviews: 0, contact: 0, hostId: 0 } }).limit(10).toArray();
    const cleanedUpdatedRooms = await Promise.all(updatedRooms.map(async (room) => ({
      ...room,
      images: (await Promise.all((room.images || []).map(async (image) => {
        if (!image) return null;
        if (ObjectId.isValid(image.$oid || image)) {
          const imageId = image.$oid || image;
          const exists = await gfsBucket.find({ _id: new ObjectId(imageId) }).toArray();
          return exists.length > 0 ? `/api/images/${imageId}` : null;
        } else if (image.startsWith('public/uploads/')) {
          const filePath = path.join(__dirname, image);
          return fs.existsSync(filePath) ? `/public/${image}` : null;
        }
        return null;
      }))).filter(url => url) || ['/images/placeholder.png'],
    })));

    res.json({
      message: 'Status updated',
      status,
      rooms: cleanedUpdatedRooms.map((room) => ({
        _id: room._id?.toString(),
        name: room.name || 'Unknown',
        email: room.email || 'No email',
        title: room.title || 'No title',
        description: room.description || 'No description',
        price: room.price?.toString() || 'N/A',
        location: room.locationName || room.location || 'N/A',
        coordinates: JSON.stringify(room.coordinates) || 'N/A',
        propertyType: room.propertyType || 'N/A',
        capacity: room.capacity?.toString() || 'N/A',
        roomType: room.roomType || 'N/A',
        bedrooms: room.bedrooms?.toString() || 'N/A',
        beds: room.beds?.toString() || 'N/A',
        roomSize: room.roomSize || 'N/A',
        roomLocation: room.roomLocation || 'N/A',
        transportDistance: room.transportDistance || 'N/A',
        hostGender: room.hostGender || 'N/A',
        foodFacility: room.foodFacility || 'N/A',
        amenities: room.amenities?.join(', ') || 'N/A',
        discount: room.discount?.toString() || 'N/A',
        maxdays: (room.maxdays || room.maxDays)?.toString() || 'N/A',
        images: room.images || ['/images/placeholder.png'],
        createdAt: room.createdAt || 'N/A',
        status: room.status || 'pending',
      })),
    });
  } catch (error) {
    console.error('Update Error:', error.message);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.post('/api/transfer-host-request', async (req, res) => {
  try {
    const hostData = req.body;
    if (!hostData.email || !hostData.name) return res.status(400).json({ error: 'Missing required fields: email and name' });
    const validateImageUrl = async (image) => {
      if (!image) return null;
      if (ObjectId.isValid(image.$oid || image)) {
        const imageId = image.$oid || image;
        const exists = await gfsBucket.find({ _id: new ObjectId(imageId) }).toArray();
        return exists.length > 0 ? imageId : null;
      } else if (image.startsWith('public/uploads/')) {
        const filePath = path.join(__dirname, image);
        return fs.existsSync(filePath) ? image : null;
      }
      return null;
    };
    const cleanedImages = (await Promise.all((hostData.images || []).map(validateImageUrl))).filter(img => img);
    const travelerHostData = {
      name: hostData.name,
      email: hostData.email.trim().toLowerCase(),
      title: hostData.title,
      description: hostData.description,
      price: parseFloat(hostData.price) || 0,
      location: hostData.location,
      coordinates: JSON.parse(hostData.coordinates || '{}'),
      propertyType: hostData.propertyType,
      capacity: parseInt(hostData.capacity) || 0,
      roomType: hostData.roomType,
      bedrooms: parseInt(hostData.bedrooms) || 0,
      beds: parseInt(hostData.beds) || 0,
      roomSize: hostData.roomSize,
      roomLocation: hostData.roomLocation,
      transportDistance: hostData.transportDistance,
      hostGender: hostData.hostGender,
      foodFacility: hostData.foodFacility,
      amenities: hostData.amenities?.split(', ') || [],
      discount: parseFloat(hostData.discount) || 0,
      maxdays: parseInt(hostData.maxdays) || 0,
      images: cleanedImages.length > 0 ? cleanedImages : ['/images/placeholder.png'],
      createdAt: hostData.createdAt ? new Date(hostData.createdAt) : new Date(),
      status: 'Approved',
      transferredAt: new Date()
    };
    const result = await travelerConnection.collection('RoomDataTraveler').insertOne(travelerHostData);
    res.json({ message: 'Host request transferred successfully', id: result.insertedId });
  } catch (error) {
    console.error('Transfer Error:', error.message);
    res.status(500).json({ error: 'Failed to transfer host request' });
  }
});

app.delete('/api/remove-host-request', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing required field: id' });
    const result = await travelerConnection.collection('RoomDataTraveler').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'No document found to delete' });
    res.json({ message: 'Host request removed successfully' });
  } catch (error) {
    console.error('Remove Error:', error.message);
    res.status(500).json({ error: 'Failed to remove host request' });
  }
});

app.get('/users', getUsers);
app.get('/hosts/:id', adminController.viewHostDetails);
app.get('/users/:id', adminController.viewTravelerDetails);

app.post('/loginweb', upload.single('profilePhoto'), async (req, res, next) => {
  try {
    if (req.body.type === 'signIn') {
      req.body.accountType = req.body.accountType || req.body.selectedType;
      await fetchUserByEmailPassword(req, res);
    } else if (req.body.type === 'signUp') {
      await signUp(req, res);
    } else {
      res.status(400).json({ status: "fail", message: "Please specify request type (signIn, signUp)" });
    }
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(err);
  }
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({ status: err.status, message: err.message });
  }
  res.status(err.statusCode).render('error', { message: err.message || 'Something went wrong!' });
});

app.all('*', (req, res) => {
  res.status(404).render('error', { message: `Can't find ${req.originalUrl} on this server!` });
});

// Start Server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => console.log('Process terminated'));
});

module.exports = app;