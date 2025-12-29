# 🥄 TwoSpoon Backend

A robust, scalable file storage and sharing backend API built with Node.js, Express, and TypeScript. TwoSpoon provides secure file management, user authentication, and collaborative file sharing capabilities.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Storage Options](#-storage-options)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- **🔐 Authentication & Authorization**
  - Email/password authentication
  - Google OAuth 2.0 integration
  - JWT-based session management
  - Secure password hashing with bcrypt

- **📁 File Management**
  - Upload files (supports large files up to 100MB by default)
  - Create and organize folders
  - Rename files and folders
  - Delete files and folders
  - Search files by name
  - Download files

- **🔗 File Sharing**
  - Share files with specific users
  - Generate shareable links with tokens
  - Set permissions (read, write, view)
  - Password-protected share links
  - Expiration dates for share links

- **☁️ Storage Options**
  - Local file storage
  - AWS S3 integration for cloud storage

- **🛡️ Security**
  - Helmet.js for security headers
  - CORS configuration
  - Input validation
  - Error handling middleware
  - Request logging with Morgan

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL
- **Authentication**: Passport.js, JWT, Google OAuth 2.0
- **File Upload**: Multer
- **Storage**: Local filesystem / AWS S3
- **Security**: Helmet, bcryptjs
- **Logging**: Custom logger with Morgan

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher) or **yarn**
- **PostgreSQL** (v12.x or higher)
- **Git**

### Optional (for cloud storage):
- **AWS Account** with S3 bucket configured

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Twospoonbackend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory (see [Environment Variables](#-environment-variables) section for details):

```bash
cp .env.example .env  # If you have an example file
# Or create .env manually
```

### 4. Set Up Database

Make sure PostgreSQL is running and create a database:

```sql
CREATE DATABASE twospoon_drive;
```

The application will automatically create the required tables on first run.

### 5. Build the Project

```bash
npm run build
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

#### Required Variables

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/twospoon_drive

# Session & Security
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Google OAuth (Required for Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

#### Optional Variables

```env
# Storage Configuration
STORAGE_TYPE=local  # Options: 'local' or 's3'
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600  # 100MB in bytes

# AWS S3 (Required if STORAGE_TYPE=s3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the consent screen
6. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)
7. Copy the Client ID and Client Secret to your `.env` file

## 🗄️ Database Setup

The application uses PostgreSQL and automatically creates the following tables on first run:

- **users**: User accounts and authentication information
- **files**: File metadata and storage information
- **file_shares**: User-to-user file sharing permissions
- **share_links**: Public shareable links with tokens

The database schema is automatically initialized when the application starts. No manual migration is required.

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

This will start the server with hot-reload using `nodemon` and `ts-node`.

### Production Mode

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

### Verify Installation

Check if the server is running:

```bash
curl http://localhost:5000/health
```

You should receive a response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register a new user | No |
| POST | `/api/auth/login` | Login with email/password | No |
| GET | `/api/auth/me` | Get current user info | Yes |
| POST | `/api/auth/logout` | Logout current user | Yes |
| GET | `/api/auth/google` | Initiate Google OAuth | No |
| GET | `/api/auth/google/callback` | Google OAuth callback | No |

### Files

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/files/upload` | Upload a file | Yes |
| POST | `/api/files/folder` | Create a folder | Yes |
| GET | `/api/files` | Get user's files | Yes |
| GET | `/api/files/search` | Search files | Yes |
| GET | `/api/files/:id` | Get file by ID | Yes |
| GET | `/api/files/:id/download` | Download a file | Yes |
| PATCH | `/api/files/:id/rename` | Rename a file/folder | Yes |
| DELETE | `/api/files/:id` | Delete a file/folder | Yes |

### Sharing

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/files/:id/share` | Share file with user | Yes |
| GET | `/api/files/:id/share` | Get share information | Yes |
| POST | `/api/files/:id/share-link` | Create shareable link | Yes |
| DELETE | `/api/files/:id/share/:userId` | Revoke user access | Yes |
| DELETE | `/api/files/:id/share-link` | Remove share link | Yes |
| GET | `/api/files/shared` | Get shared files | Yes |
| GET | `/api/files/shared/:token` | Get file by share token | No |
| GET | `/api/files/shared/:token/download` | Download shared file | No |

### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Server health check | No |

## 📁 Project Structure

```
Twospoonbackend/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── config/
│   │   ├── aws.ts            # AWS S3 configuration
│   │   ├── database.ts       # PostgreSQL connection
│   │   ├── env.ts            # Environment variables
│   │   └── passport.ts       # Passport.js configuration
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── file.controller.ts
│   │   └── share.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── upload.middleware.ts
│   ├── models/
│   │   ├── file.model.ts
│   │   ├── share.model.ts
│   │   └── user.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── file.routes.ts
│   │   └── share.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── file.service.ts
│   │   ├── share.service.ts
│   │   └── storage.service.ts
│   └── utils/
│       ├── constants.ts
│       ├── helpers.ts
│       └── logger.ts
├── uploads/                   # Local file storage directory
├── dist/                      # Compiled JavaScript (generated)
├── node_modules/              # Dependencies
├── package.json
├── tsconfig.json
└── README.md
```

## 💾 Storage Options

### Local Storage (Default)

Files are stored in the `./uploads` directory (or the path specified in `UPLOAD_DIR`).

**Pros:**
- Simple setup
- No additional services required
- Good for development

**Cons:**
- Limited scalability
- Requires manual backup
- Not suitable for production at scale

### AWS S3 Storage

For production deployments, configure AWS S3:

1. Create an S3 bucket in AWS
2. Create an IAM user with S3 access permissions
3. Set the following environment variables:
   ```env
   STORAGE_TYPE=s3
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your-bucket-name
   ```

**Pros:**
- Scalable and reliable
- Built-in redundancy
- CDN integration possible
- Production-ready

## 🚢 Deployment

### Environment Setup

1. Set `NODE_ENV=production` in your `.env` file
2. Use strong, unique secrets for `SESSION_SECRET` and `JWT_SECRET`
3. Update `FRONTEND_URL` to your production frontend URL
4. Configure your production database URL
5. Set up AWS S3 for file storage (recommended)

### Build for Production

```bash
npm run build
```

### Process Management

Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start dist/server.js --name twospoon-backend
pm2 save
pm2 startup
```

### Docker (Optional)

You can containerize the application:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

## 🔧 Troubleshooting

### Database Connection Issues

**Problem**: `Database connection failed`

**Solutions**:
- Verify PostgreSQL is running: `pg_isready`
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Ensure database exists
- Check firewall settings

### Google OAuth Not Working

**Problem**: Redirect URI mismatch

**Solutions**:
- Verify `GOOGLE_CALLBACK_URL` matches exactly in Google Console
- Check that the callback URL includes the correct protocol (http/https)
- Ensure Google OAuth consent screen is configured

### File Upload Fails

**Problem**: `File too large` or upload errors

**Solutions**:
- Check `MAX_FILE_SIZE` in `.env` (default: 100MB)
- Verify disk space for local storage
- Check S3 bucket permissions if using S3
- Ensure `uploads` directory exists and is writable

### Port Already in Use

**Problem**: `EADDRINUSE: address already in use`

**Solutions**:
- Change `PORT` in `.env` file
- Kill the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # Linux/Mac
  lsof -ti:5000 | xargs kill
  ```

### TypeScript Compilation Errors

**Problem**: Build fails with TypeScript errors

**Solutions**:
- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` configuration
- Verify Node.js version compatibility

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Made with ❤️ for secure file sharing**

