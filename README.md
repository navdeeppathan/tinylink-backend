# TinyLink Backend API

RESTful API for TinyLink URL shortener service built with Node.js, Express, and PostgreSQL.

## Quick Start

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev

# Start production server
npm start
```

## Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- PostgreSQL >= 12.0 (or Neon account)

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** 4.x - Web framework
- **PostgreSQL** - Relational database
- **pg** - PostgreSQL client for Node.js
- **dotenv** - Environment configuration
- **cors** - Cross-origin resource sharing
- **nodemon** - Development auto-reload

## Project Structure

```
backend/
├── src/
│   ├── index.js              # Main server file
│   ├── db.js                 # Database connection & initialization
│   ├── routes/
│   │   └── links.js          # Link CRUD routes
│   └── middleware/
│       └── validation.js     # URL & code validation
├── package.json
├── .env
├── .env.example
└── README.md
```

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=5000
BASE_URL=http://localhost:3000
NODE_ENV=development
```

### .env.example Template

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database

# Server Configuration
PORT=5000

# Frontend URL (for CORS)
BASE_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

## Installation

### Step 1: Navigate to Backend Directory

```bash
cd tinylink/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Database

#### Option A: Using Neon (Recommended)

1. Go to [neon.tech](https://neon.tech)
2. Create a free account
3. Create a new project
4. Copy the connection string
5. Paste it in your `.env` file as `DATABASE_URL`

#### Option B: Local PostgreSQL

```bash
# Install PostgreSQL locally
# Create database
createdb tinylink

# Connection string
DATABASE_URL=postgresql://username:password@localhost:5432/tinylink
```

### Step 4: Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

### Step 5: Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## 🗄️ Database Schema

### Links Table

```sql
CREATE TABLE links (
  id SERIAL PRIMARY KEY,
  code VARCHAR(8) UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  last_clicked TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_code ON links(code);
```

### Column Descriptions

| Column         | Type       | Description                           |
| -------------- | ---------- | ------------------------------------- |
| `id`           | SERIAL     | Primary key (auto-increment)          |
| `code`         | VARCHAR(8) | Short code (6-8 alphanumeric, unique) |
| `target_url`   | TEXT       | Original long URL                     |
| `total_clicks` | INTEGER    | Click counter (default: 0)            |
| `last_clicked` | TIMESTAMP  | Last click timestamp (nullable)       |
| `created_at`   | TIMESTAMP  | Creation timestamp (auto)             |

### Database Initialization

The database table is automatically created on server startup via `db.js`:

```javascript
const initDB = async () => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      code VARCHAR(8) UNIQUE NOT NULL,
      target_url TEXT NOT NULL,
      total_clicks INTEGER DEFAULT 0,
      last_clicked TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_code ON links(code);
  `);
};
```

## API Endpoints

### Base URL

```
Development: http://localhost:5000
Production: https://your-app.render.com
```

---

### 1. Health Check

Check if the API is running.

```http
GET /healthz
```

**Response (200 OK):**

```json
{
  "ok": true,
  "version": "1.0",
  "uptime": 3600,
  "timestamp": "2024-11-25T10:30:00.000Z"
}
```

**Example:**

```bash
curl http://localhost:5000/healthz
```

---

### 2. Create Link

Create a new short link with optional custom code.

```http
POST /api/links
Content-Type: application/json
```

**Request Body:**

```json
{
  "target_url": "https://example.com/very-long-url",
  "custom_code": "mycode" // Optional (6-8 alphanumeric chars)
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "code": "mycode",
  "target_url": "https://example.com/very-long-url",
  "total_clicks": 0,
  "last_clicked": null,
  "created_at": "2024-11-25T10:30:00.000Z"
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid URL
{
  "error": "Invalid URL"
}

// 400 Bad Request - Invalid code format
{
  "error": "Code must be 6-8 alphanumeric characters"
}

// 409 Conflict - Duplicate code
{
  "error": "Code already exists"
}
```

**Examples:**

```bash
# Auto-generated code
curl -X POST http://localhost:5000/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://google.com"}'

# Custom code
curl -X POST http://localhost:5000/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://github.com","custom_code":"github"}'
```

---

### 3. Get All Links

Retrieve all shortened links.

```http
GET /api/links
```

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "code": "abc123",
    "target_url": "https://example.com",
    "total_clicks": 5,
    "last_clicked": "2024-11-25T10:35:00.000Z",
    "created_at": "2024-11-25T10:30:00.000Z"
  },
  {
    "id": 2,
    "code": "github",
    "target_url": "https://github.com",
    "total_clicks": 0,
    "last_clicked": null,
    "created_at": "2024-11-25T10:31:00.000Z"
  }
]
```

**Example:**

```bash
curl http://localhost:5000/api/links
```

---

### 4. Get Link Stats

Get statistics for a specific short link.

```http
GET /api/links/:code
```

**Parameters:**

- `code` (string) - The short code

**Response (200 OK):**

```json
{
  "id": 1,
  "code": "github",
  "target_url": "https://github.com",
  "total_clicks": 3,
  "last_clicked": "2024-11-25T10:40:00.000Z",
  "created_at": "2024-11-25T10:31:00.000Z"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Link not found"
}
```

**Example:**

```bash
curl http://localhost:5000/api/links/github
```

---

### 5. Delete Link

Delete a short link permanently.

```http
DELETE /api/links/:code
```

**Parameters:**

- `code` (string) - The short code to delete

**Response (200 OK):**

```json
{
  "message": "Link deleted",
  "code": "github"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Link not found"
}
```

**Example:**

```bash
curl -X DELETE http://localhost:5000/api/links/github
```

---

### 6. Redirect

Redirect to the original URL and increment click counter.

```http
GET /:code
```

**Parameters:**

- `code` (string) - The short code

**Response (302 Found):**

- Redirects to the target URL
- Increments `total_clicks` by 1
- Updates `last_clicked` timestamp

**Error Response (404 Not Found):**

```
Link not found
```

**Example:**

```bash
# This will redirect to the target URL
curl -L http://localhost:5000/github

# To see the 302 status without following redirect
curl -I http://localhost:5000/github
```

---

## Validation Rules

### URL Validation

- Must be a valid URL format
- Validated using JavaScript's built-in `URL` constructor
- Examples:
  - `https://example.com`
  - `http://example.com/path`
  - `not-a-url`
  - `example.com` (missing protocol)

### Short Code Validation

- **Length:** 6-8 characters
- **Characters:** Alphanumeric only (A-Z, a-z, 0-9)
- **Pattern:** `/^[A-Za-z0-9]{6,8}$/`
- **Uniqueness:** Must be unique across all links
- Examples:
  - `github` (6 chars)
  - `MyCode1` (7 chars)
  - `ABC12345` (8 chars)
  - `code` (too short)
  - `verylongcode` (too long)
  - `my-code` (contains hyphen)
  - `my_code` (contains underscore)

### Auto-Generated Codes

If no custom code is provided:

- Generates random 6-character alphanumeric code
- Checks database for uniqueness
- Retries up to 10 times if collision occurs
- Uses character set: `A-Z`, `a-z`, `0-9` (62 possibilities)
- Collision probability: ~1 in 56 billion for 6 chars

## 🧩 Code Architecture

### Main Server (index.js)

```javascript
// Core responsibilities:
// - Express app initialization
// - Middleware configuration (CORS, JSON parsing)
// - Route mounting
// - Database initialization
// - Server startup

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/links", linksRouter);
app.get("/:code", redirectHandler);
```

### Database Module (db.js)

```javascript
// Core responsibilities:
// - PostgreSQL connection pooling
// - Database initialization (create tables/indexes)
// - SSL configuration for production

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});
```

### Link Routes (routes/links.js)

```javascript
// Core responsibilities:
// - CRUD operations for links
// - Input validation
// - Error handling (400, 404, 409, 500)
// - Database transactions

router.post("/", createLink);
router.get("/", getAllLinks);
router.get("/:code", getLinkStats);
router.delete("/:code", deleteLink);
```

### Validation Middleware (middleware/validation.js)

```javascript
// Core responsibilities:
// - URL format validation
// - Code pattern validation
// - Random code generation

validateURL(url); // Returns boolean
validateCode(code); // Returns boolean
generateCode(); // Returns 6-char string
```

## Testing

### Manual Testing with cURL

```bash
# 1. Health check
curl http://localhost:5000/healthz

# 2. Create link (auto code)
curl -X POST http://localhost:5000/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://google.com"}'

# 3. Create link (custom code)
curl -X POST http://localhost:5000/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://github.com","custom_code":"github"}'

# 4. Get all links
curl http://localhost:5000/api/links

# 5. Get single link
curl http://localhost:5000/api/links/github

# 6. Test redirect (follow redirects)
curl -L http://localhost:5000/github

# 7. Test redirect (see 302 status)
curl -I http://localhost:5000/github

# 8. Delete link
curl -X DELETE http://localhost:5000/api/links/github

# 9. Verify deletion (should return 404)
curl http://localhost:5000/github
```

### Testing with Postman

Import the Postman collection (see project root README) for comprehensive API testing.

### Automated Testing Checklist

- [ ] Health endpoint returns 200
- [ ] Can create link with auto-generated code
- [ ] Can create link with custom code
- [ ] Duplicate code returns 409
- [ ] Invalid URL returns 400
- [ ] Invalid code format returns 400
- [ ] Can retrieve all links
- [ ] Can retrieve single link
- [ ] Non-existent link returns 404
- [ ] Redirect returns 302
- [ ] Redirect increments click count
- [ ] Can delete link
- [ ] Deleted link returns 404

## Deployment

### Deploy to Render

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

#### Step 3: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your repository
3. Configure settings:
   - **Name:** `tinylink-backend`
   - **Environment:** `Node`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

#### Step 4: Add Environment Variables

In Render dashboard, add:

| Key            | Value                       |
| -------------- | --------------------------- |
| `DATABASE_URL` | Your Neon connection string |
| `PORT`         | `5000`                      |
| `NODE_ENV`     | `production`                |
| `BASE_URL`     | Your frontend URL           |

#### Step 5: Deploy

Click "Create Web Service" and wait for deployment.

Your API will be available at: `https://your-app.render.com`

### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set DATABASE_URL=your_connection_string

# Deploy
railway up
```

### Verifying Deployment

```bash
# Test health endpoint
curl https://your-app.render.com/healthz

# Should return: {"ok":true,"version":"1.0",...}
```

## Security Best Practices

### Implemented

- **Parameterized Queries** - Prevents SQL injection
- **Input Validation** - All inputs validated before processing
- **CORS Configuration** - Controls cross-origin access
- **HTTPS in Production** - SSL/TLS encryption
- **Environment Variables** - Sensitive data in .env
- **Database Constraints** - UNIQUE constraint on codes
- **Error Handling** - Proper error codes and messages

### Recommended for Production

- [ ] **Rate Limiting** - Prevent abuse (express-rate-limit)
- [ ] **Authentication** - User login/tokens (JWT)
- [ ] **API Keys** - For programmatic access
- [ ] **Request Logging** - Morgan or Winston
- [ ] **Input Sanitization** - Additional XSS protection
- [ ] **Helmet.js** - Security headers
- [ ] **HTTPS Enforcement** - Redirect HTTP to HTTPS

### Example Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);
```

## Database Indexing

### Existing Indexes

```sql
CREATE INDEX idx_code ON links(code);
```

**Purpose:** Fast lookups during redirects (most frequent operation)

### Additional Indexes for Scale

```sql
-- For filtering by creation date
CREATE INDEX idx_created_at ON links(created_at DESC);

-- For sorting by clicks
CREATE INDEX idx_total_clicks ON links(total_clicks DESC);

-- Composite index for user-specific queries (if adding auth)
CREATE INDEX idx_user_created ON links(user_id, created_at DESC);
```

## Troubleshooting

### Issue: Database connection fails

**Error:** `Connection refused` or `ECONNREFUSED`

**Solution:**

- Check `DATABASE_URL` in `.env`
- Verify database is running
- Check firewall settings
- For Neon: Ensure SSL is configured correctly

```javascript
ssl: process.env.NODE_ENV === "production"
  ? { rejectUnauthorized: false }
  : false;
```

### Issue: Port already in use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**

```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev
```

### Issue: CORS errors in browser

**Error:** `Access to fetch blocked by CORS policy`

**Solution:**

```javascript
// Enable CORS for all origins (development)
app.use(cors());

// Enable CORS for specific origin (production)
app.use(
  cors({
    origin: "https://your-frontend.vercel.app",
  })
);
```

### Issue: Environment variables not loading

**Solution:**

- Ensure `.env` file exists in backend directory
- Check variable names (case-sensitive)
- Restart server after changing `.env`
- For production: Set in hosting platform dashboard

### Issue: Redirect route catches API routes

**Solution:** Ensure redirect route is defined last and exclude certain paths:

```javascript
app.get("/:code", async (req, res) => {
  const { code } = req.params;

  // Skip if it's an API route
  if (code === "api" || code === "healthz" || code === "code") {
    return res.status(404).send("Not found");
  }

  // Continue with redirect logic...
});
```

## Performance Optimization

### Connection Pooling

Already implemented via `pg.Pool`:

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Query Optimization

```javascript
//  Good: Single atomic query
const result = await pool.query(
  "UPDATE links SET total_clicks = total_clicks + 1, last_clicked = CURRENT_TIMESTAMP WHERE code = $1 RETURNING target_url",
  [code]
);

//  Bad: Multiple queries (race conditions)
const link = await pool.query("SELECT * FROM links WHERE code = $1", [code]);
await pool.query("UPDATE links SET total_clicks = $1 WHERE code = $2", [
  link.total_clicks + 1,
  code,
]);
```

### Caching Strategy (Future Enhancement)

```javascript
// Add Redis for frequently accessed links
const redis = require("redis");
const client = redis.createClient();

// Check cache before database
const cachedUrl = await client.get(code);
if (cachedUrl) {
  return res.redirect(302, cachedUrl);
}

// Fallback to database and cache result
const result = await pool.query(
  "SELECT target_url FROM links WHERE code = $1",
  [code]
);
await client.setex(code, 3600, result.rows[0].target_url); // Cache for 1 hour
```

## Related Documentation

- [Frontend Documentation](../frontend/README.md)
- [Project Documentation](../README.md)
- [API Testing Guide](../README.md#api-documentation)

## License

MIT License - see root README.md

## Support

For issues or questions:

- Check troubleshooting section above
- Review main project README
- Create an issue on GitHub
- Contact: infonavdeep07@gmail.com

---

**Built with using Node.js, Express, and PostgreSQL**
