# Quick Start Guide - Running the School CBT System

## Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- npm or yarn
- SQLite (included with Python)

## Project Structure

```
school-cbt-sys/
├── app/                    # Next.js frontend (React)
├── backend/                # FastAPI backend (Python)
├── components/             # React components
├── lib/                    # Utilities & API client
├── public/                 # Static files
├── package.json            # Frontend dependencies
└── ...config files
```

## Step-by-Step Setup

### 1️⃣ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Initialize database
python app/init_db.py

# Start the server
python -m uvicorn app.main:app --reload

# Server runs at: http://localhost:8000
# API docs available at: http://localhost:8000/docs
```

### 2️⃣ Frontend Setup

```bash
# From project root (open new terminal)

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Start development server
npm run dev

# Frontend runs at: http://localhost:3000
```

### 3️⃣ Default Admin Account

After backend initialization:

- **Email:** admin@school.local
- **Password:** adminpass
- **Role:** admin

## First Time Usage Flow

### 1. Login as Admin

```
URL: http://localhost:3000/auth/login
Email: admin@school.local
Password: adminpass
```

### 2. Create Teacher (from Admin Dashboard)

- Go to "Manage Users"
- Click "Add User"
- Select Role: Teacher
- Fill in details

### 3. Create Student (as Teacher)

- Login as teacher
- Dashboard → "Add Student"
- Fill in student details

### 4. Create Exam (as Teacher)

- Dashboard → "Create Exam"
- Add questions with options
- Publish exam

### 5. Take Exam (as Student)

- Student dashboard shows assigned exams
- Click to take exam
- Answer questions
- Submit results

### 6. View Results

- Student: Dashboard → Results
- Teacher: Dashboard → view student results

## Available Roles

| Role        | Access                                       |
| ----------- | -------------------------------------------- |
| **Admin**   | Everything: users, exams, results, analytics |
| **Teacher** | Create exams, view results, manage students  |
| **Student** | Take exams, view personal results            |

## Troubleshooting

### Backend won't start

```bash
# Check Python is installed
python --version

# Clear pycache and try again
find . -type d -name __pycache__ -exec rm -r {} +
python -m uvicorn app.main:app --reload
```

### Frontend won't start

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Cannot connect to backend

1. Verify backend is running: `http://localhost:8000`
2. Check `.env.local` has correct API URL
3. Check browser console for CORS errors
4. Restart both servers

### Port already in use

```bash
# Backend (use different port)
python -m uvicorn app.main:app --reload --port 8001

# Then update .env.local: NEXT_PUBLIC_API_URL=http://localhost:8001

# Frontend (use different port)
npm run dev -- -p 3001
```

## Database

- **Type:** SQLite
- **Location:** `backend/school_cbt.db`
- **Reset:** Delete the file and restart backend (recreates empty DB)

## Testing API Endpoints

### Using curl

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@school.local", "password": "adminpass"}'

# Response will include access_token

# List exams (public)
curl http://localhost:8000/api/exams

# Get specific exam
curl http://localhost:8000/api/exams/1
```

### Using Swagger UI

Visit: `http://localhost:8000/docs`

Interactive API documentation with test buttons.

## Available npm Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Available Python Scripts

```bash
# In backend directory
python app/init_db.py      # Initialize database
python app/query_db.py     # Query database
python -m uvicorn app.main:app --reload  # Start server
```

## Common Tasks

### Create a new exam

1. Login as teacher
2. Dashboard → "Create Exam"
3. Add questions with correct answers
4. Set duration
5. Publish

### View student results

1. Login as teacher or admin
2. Go to Results section
3. Filter by exam or student

### Reset everything

1. Stop both servers
2. Delete `backend/school_cbt.db`
3. Start backend (recreates DB)
4. Login with default admin account

### Export data

```bash
# Backup database
cp backend/school_cbt.db backup_$(date +%Y%m%d).db

# Query specific data
python backend/query_db.py
```

## Performance Tips

- **Backend:** Use production server (`gunicorn`) for deployment
- **Frontend:** Build optimized bundle: `npm run build && npm run start`
- **Database:** Add indexes for frequently queried fields
- **Caching:** Consider Redis for session/result caching

## Production Deployment

### Frontend (Vercel/Netlify)

```bash
npm run build
```

Deploy the `.next` folder or connect GitHub repo

### Backend (Heroku/Railway/Render)

1. Set environment variables in platform
2. Point to production database
3. Use production ASGI server (gunicorn)
4. Update `NEXT_PUBLIC_API_URL` to production backend URL

## Security Checklist

- [ ] Change default admin password
- [ ] Set `SECRET_KEY` in backend config
- [ ] Enable HTTPS in production
- [ ] Set `NEXT_PUBLIC_API_URL` to production backend
- [ ] Configure CORS properly for production domain
- [ ] Use environment variables for sensitive data
- [ ] Keep dependencies updated

## Support

For issues or questions:

1. Check error messages in browser console
2. Check server terminal logs
3. Read the `API_INTEGRATION_GUIDE.md`
4. Check `INTEGRATION_SUMMARY.md` for quick ref

---

**Happy Testing! 🎉**
