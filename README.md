# AI Voice Keyboard App

A Next.js application with PostgreSQL database integration, featuring both frontend and backend API routes.

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (local or remote)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update it with your database credentials:

```bash
cp env.example .env
```

Edit `.env` and update the following:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

Or use individual database settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
```

#### Generate NextAuth Secret

You need to generate a secure secret for NextAuth.js. Use one of these methods:

**Method 1: Using OpenSSL (Recommended)**
```bash
openssl rand -base64 32
```

**Method 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Method 3: Using PowerShell (Windows)**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Copy the generated secret and add it to your `.env` file:

```env
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000
```

**Important:** 
- Use a different secret for production
- Never commit your `.env` file to version control
- Keep your secret secure and don't share it publicly

### 3. Create PostgreSQL Database

Make sure PostgreSQL is running and create a database:

```sql
CREATE DATABASE your_database_name;
```

### 4. Run Database Migrations

Run the migrations to set up the database schema:

```bash
npm run migrate
```

This will create all necessary tables (users, transcriptions, dictionary) and indexes.

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── api/              # API routes (backend)
│   │   ├── health/       # Health check endpoint
│   │   └── example/      # Example API endpoint
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── database/
│   └── migrations/       # SQL migration files
│       └── 001_initial_schema.sql
├── lib/
│   ├── db.ts             # PostgreSQL connection utility
│   └── migrations.ts     # Migration utilities
├── scripts/
│   └── migrate.ts        # Migration runner script
├── __tests__/            # Test files
│   └── database/         # Database tests
├── env.example           # Environment variables template
└── package.json          # Dependencies
```

## API Endpoints

### Health Check
- **GET** `/api/health` - Check database connection status

### Example Endpoint
- **GET** `/api/example` - Example GET endpoint with database query
- **POST** `/api/example` - Example POST endpoint

## Database Connection

The database connection is managed through `lib/db.ts` using connection pooling. The connection pool is automatically created on first use and reused across requests.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run migrate` - Run database migrations

## Notes

- The database connection uses connection pooling for better performance
- Environment variables are loaded automatically by Next.js
- API routes are located in the `app/api` directory (App Router)

