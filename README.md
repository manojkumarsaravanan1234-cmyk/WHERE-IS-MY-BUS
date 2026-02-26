# 🚌 WhereIsMyBus - Real-Time Bus Tracking Application

A full-stack MERN application for real-time bus tracking using crowdsourced GPS data.

## 🛠️ Technology Stack

### Frontend
- **React.js** (Vite)
- **Tailwind CSS** - Modern styling
- **React-Leaflet & Leaflet** - Interactive maps (OpenStreetMap)
- **Socket.io-client** - Real-time communication

### Backend
- **Node.js & Express.js** - Server framework
- **MongoDB & Mongoose** - Database with GeoJSON support
- **Socket.io** - WebSocket server for live updates

## 📁 Project Structure

```
WhereIsMyBus/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API & Socket services
│   │   ├── utils/         # Helper functions
│   │   └── App.jsx        # Main app component
│   ├── public/
│   └── package.json
│
├── server/                # Node.js Backend
│   ├── config/           # Configuration files
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── controllers/      # Business logic
│   ├── middleware/       # Custom middleware
│   ├── sockets/          # Socket.io handlers
│   ├── utils/            # Helper functions
│   └── server.js         # Entry point
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd "c:/Users/MANOJ KUMAR S/Downloads/Where is My Bus"
```

2. **Install Server Dependencies**
```bash
cd server
npm install
```

3. **Install Client Dependencies**
```bash
cd ../client
npm install
```

4. **Configure Environment Variables**

Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/whereismybus
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

5. **Start the Application**

Terminal 1 - Start MongoDB (if local):
```bash
mongod
```

Terminal 2 - Start Backend:
```bash
cd server
npm run dev
```

Terminal 3 - Start Frontend:
```bash
cd client
npm run dev
```

6. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📱 Features

### 👨‍💼 Admin Module
- ✅ Add bus routes with multiple stops
- ✅ Define source, destination, and waypoints with coordinates
- ✅ Assign bus numbers to routes

### 🚗 Driver/Contributor Mode
- ✅ Select bus number
- ✅ Start journey tracking
- ✅ Auto-send GPS location every 5 seconds
- ✅ Real-time position updates via Socket.io

### 👤 User Mode
- ✅ Search buses by source and destination
- ✅ View live bus positions on interactive map
- ✅ Smooth bus marker animations
- ✅ ETA calculation to next stop
- ✅ Real-time updates without page refresh

## 🗺️ API Endpoints

### Routes
- `GET /api/routes` - Get all routes or search by source/destination
- `POST /api/routes` - Create a new route (Admin)
- `GET /api/routes/:id` - Get route details

### Buses
- `GET /api/buses` - Get all active buses
- `GET /api/buses/:busNumber` - Get specific bus details
- `POST /api/buses` - Register a new bus
- `PUT /api/buses/:busNumber/location` - Update bus location (fallback)

### Socket.io Events

**Emitted by Client:**
- `driver:startJourney` - Driver starts tracking
- `driver:updateLocation` - Send GPS updates
- `driver:stopJourney` - Driver ends tracking
- `user:trackRoute` - User wants to track a route

**Emitted by Server:**
- `bus:locationUpdate` - Broadcast bus position to all users
- `bus:joined` - Bus started journey
- `bus:left` - Bus ended journey

## 🧑‍💻 Development

### Useful Commands

**Backend:**
```bash
npm run dev      # Start with nodemon
npm start        # Production start
```

**Frontend:**
```bash
npm run dev      # Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## 🎓 For College Students

This project is perfect for:
- **Final Year Projects**
- **Hackathons**
- **Learning MERN Stack**
- **Understanding Real-time Applications**
- **Portfolio Projects**

### Learning Path:
1. Start with MongoDB basics and Mongoose schemas
2. Build REST APIs with Express.js
3. Learn Socket.io for real-time features
4. Master React hooks (useState, useEffect, useRef)
5. Integrate maps with React-Leaflet
6. Implement geospatial queries in MongoDB

## 📦 Database Schema

### Route Schema
```javascript
{
  routeName: String,
  routeNumber: String,
  source: { name: String, coordinates: [lng, lat] },
  destination: { name: String, coordinates: [lng, lat] },
  stops: [{ name: String, coordinates: [lng, lat], order: Number }]
}
```

### Bus Schema
```javascript
{
  busNumber: String,
  routeId: ObjectId,
  currentLocation: { type: 'Point', coordinates: [lng, lat] },
  speed: Number,
  heading: Number,
  isActive: Boolean,
  lastUpdated: Date
}
```

## 🔒 Best Practices Implemented

- ✅ Functional components with React Hooks
- ✅ MongoDB 2dsphere index for geospatial queries
- ✅ Mobile-responsive UI with Tailwind
- ✅ Error handling and validation
- ✅ Environment variables for configuration
- ✅ Clean code with comments
- ✅ Modular architecture

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check MONGODB_URI in .env

**Socket.io Connection Failed:**
- Verify backend is running on correct port
- Check CORS configuration

**Map Not Loading:**
- Ensure internet connection (OSM tiles)
- Check browser console for errors

## 📄 License

This project is open-source and available for educational purposes.

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- React-Leaflet community
- Socket.io documentation

---

**Built with ❤️ for college students and learners**
