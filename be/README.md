# Web Chat Backend

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the `be` directory with the following variables:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/web-chat
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 2. MongoDB Setup
Make sure MongoDB is running on your system. If you don't have MongoDB installed:
- Install MongoDB locally, or
- Use MongoDB Atlas (cloud service) and replace the MONGO_URI with your Atlas connection string

### 3. File Storage
The application now uses local file storage instead of Cloudinary:
- Images are saved in the `uploads/` directory
- Profile pictures are saved in `uploads/avatars/`
- Message images are saved in `uploads/images/`
- Files are served statically at `/uploads/` endpoint

### 4. Installation and Running
```bash
npm install
npm run dev
```

The server will start on port 5000 (or the port specified in your .env file).

### 5. API Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `PUT /api/auth/update-profile` - Update profile picture
- `GET /api/auth/check-auth` - Check authentication status
- `GET /api/messages/users` - Get users for sidebar
- `GET /api/messages/:id` - Get messages with a user
- `POST /api/messages/:id` - Send a message to a user
