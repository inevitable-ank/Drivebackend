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

### Deploying to Render

[Render](https://render.com) is a cloud platform that makes it easy to deploy and scale your applications. Follow these steps to deploy TwoSpoon Backend on Render:

#### Prerequisites

1. **GitHub Account**: Push your code to a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com) (free tier available)
3. **AWS Account** (for S3 storage): Create an AWS account and S3 bucket

#### Step 1: Prepare Your Repository

1. Ensure all your code is committed and pushed to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. The repository should include:
   - `render.yaml` (already created)
   - `.nvmrc` (already created)
   - All source files
   - `package.json` with correct scripts

#### Step 2: Create PostgreSQL Database on Render

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `twospoon-db` (or your preferred name)
   - **Database**: `twospoon_drive`
   - **User**: `twospoon_user` (or auto-generated)
   - **Region**: Choose closest to your users
   - **Plan**: Starter (free) or higher
4. Click **"Create Database"**
5. **Important**: Copy the **Internal Database URL** - you'll need this later

#### Step 3: Set Up AWS S3 (Required for Production)

⚠️ **Important**: Render's filesystem is ephemeral. You **MUST** use S3 for file storage in production.

1. **Create S3 Bucket**:
   - Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
   - Click **"Create bucket"**
   - Choose a unique bucket name (e.g., `twospoon-files-production`)
   - Select a region
   - Uncheck "Block all public access" (or configure CORS properly)
   - Click **"Create bucket"**

2. **Create IAM User for S3 Access**:
   - Go to [IAM Console](https://console.aws.amazon.com/iam/)
   - Click **"Users"** → **"Create user"**
   - Username: `twospoon-s3-user`
   - Check **"Provide user access to the AWS Management Console"** (optional)
   - Click **"Next"**

3. **Attach S3 Policy**:
   - Click **"Attach policies directly"**
   - Search and select **"AmazonS3FullAccess"** (or create a custom policy with only your bucket)
   - Click **"Next"** → **"Create user"**

4. **Create Access Keys**:
   - Click on the created user
   - Go to **"Security credentials"** tab
   - Click **"Create access key"**
   - Select **"Application running outside AWS"**
   - Click **"Next"** → **"Create access key"**
   - **IMPORTANT**: Copy both **Access Key ID** and **Secret Access Key** (you won't see the secret again!)

#### Step 4: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **"APIs & Services"** → **"Credentials"**
4. Edit your OAuth 2.0 Client ID
5. Add authorized redirect URI:
   - `https://your-app-name.onrender.com/api/auth/google/callback`
   - Replace `your-app-name` with your Render service name
6. Save changes

#### Step 5: Deploy Web Service on Render

**Option A: Using render.yaml (Recommended)**

1. In Render Dashboard, click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Render will automatically detect `render.yaml`
4. Review the configuration and click **"Apply"**

**Option B: Manual Setup**

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `twospoon-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Same as your database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (or `./` if needed)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Click **"Advanced"** and set:
   - **Health Check Path**: `/health`

#### Step 6: Configure Environment Variables

In your Render Web Service dashboard, go to **"Environment"** tab and add:

**Required Variables:**

```env
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend-domain.com

# Database (from Step 2)
DATABASE_URL=<Internal Database URL from Render PostgreSQL>

# Security Secrets (generate strong random strings)
SESSION_SECRET=<generate-a-strong-random-string>
JWT_SECRET=<generate-a-different-strong-random-string>
JWT_EXPIRES_IN=7d

# Google OAuth (from Step 4)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://your-app-name.onrender.com/api/auth/google/callback

# AWS S3 (from Step 3) - REQUIRED for production
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=<your-aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>
AWS_REGION=<your-s3-bucket-region>
AWS_S3_BUCKET_NAME=<your-s3-bucket-name>

# Optional
MAX_FILE_SIZE=104857600
```

**Generate Strong Secrets:**

You can generate secure secrets using:
```bash
# On Linux/Mac
openssl rand -base64 32

# Or use an online generator like: https://randomkeygen.com/
```

**Important Notes:**
- Replace `<your-app-name>` with your actual Render service name
- Replace `<your-frontend-domain.com>` with your frontend URL
- The `PORT` variable is optional - Render sets it automatically, but you can set it to `10000` explicitly
- Use the **Internal Database URL** (not External) for better performance

#### Step 7: Deploy and Verify

1. Click **"Save Changes"** in the Environment tab
2. Render will automatically start building and deploying
3. Monitor the build logs for any errors
4. Once deployed, test the health endpoint:
   ```bash
   curl https://your-app-name.onrender.com/health
   ```

#### Step 8: Connect Database to Web Service

1. In your PostgreSQL database dashboard on Render
2. Go to **"Connections"** tab
3. Your web service should automatically connect if using `render.yaml`
4. If not, manually add the web service to allowed connections

#### Render-Specific Considerations

- **Ephemeral Filesystem**: Local file storage (`./uploads`) will be lost on each deploy. Always use S3 in production.
- **Auto-Deploy**: Render automatically deploys on every push to your main branch (configurable)
- **Free Tier Limits**: 
  - Services spin down after 15 minutes of inactivity
  - First request after spin-down may take 30-60 seconds
  - Consider upgrading to paid plan for always-on service
- **Database**: Free tier PostgreSQL has connection limits. Upgrade if you expect high traffic.
- **Environment Variables**: Changes require a new deployment. Plan accordingly.

#### Troubleshooting Render Deployment

**Build Fails:**
- Check build logs in Render dashboard
- Ensure `package.json` has correct `build` and `start` scripts
- Verify Node.js version in `.nvmrc` matches Render's supported versions

**Database Connection Fails:**
- Verify `DATABASE_URL` is set correctly
- Use Internal Database URL (not External)
- Check database is in same region as web service
- Ensure database is not paused (free tier pauses after inactivity)

**File Upload Fails:**
- Verify `STORAGE_TYPE=s3` is set
- Check all AWS credentials are correct
- Verify S3 bucket exists and IAM user has permissions
- Check S3 bucket CORS configuration if accessing from frontend

**Google OAuth Redirect Error:**
- Verify `GOOGLE_CALLBACK_URL` matches exactly in Google Console
- Ensure callback URL uses `https://` (not `http://`)
- Check that your Render service URL is correct

**Service Keeps Restarting:**
- Check application logs for errors
- Verify all required environment variables are set
- Check database connection is working
- Review error logs in Render dashboard

### Other Deployment Options

#### Environment Setup

1. Set `NODE_ENV=production` in your `.env` file
2. Use strong, unique secrets for `SESSION_SECRET` and `JWT_SECRET`
3. Update `FRONTEND_URL` to your production frontend URL
4. Configure your production database URL
5. Set up AWS S3 for file storage (recommended)

#### Build for Production

```bash
npm run build
```

#### Process Management

Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start dist/server.js --name twospoon-backend
pm2 save
pm2 startup
```

#### Docker (Optional)

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

