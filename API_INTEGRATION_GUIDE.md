# API Integration Guide - School CBT System

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the root directory of your Next.js project:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Backend API URL (adjust for your environment)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Backend Requirements

Ensure your FastAPI backend is running:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The backend should be accessible at `http://localhost:8000`.

### 3. API Endpoints Integrated

#### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

#### Users (`/api/users`)

- `POST /api/users` - Create user (admin only)
- `GET /api/users` - List all users (admin only)

#### Exams (`/api/exams`)

- `POST /api/exams` - Create exam (teacher only)
- `GET /api/exams` - List all published exams
- `GET /api/exams/{id}` - Get specific exam

#### Questions (`/api/questions`)

- `POST /api/questions` - Add question to exam (teacher only)
- `GET /api/questions/exam/{exam_id}` - Get questions for exam

#### Results (`/api/results`)

- `POST /api/results/submit` - Submit exam results
- `GET /api/results/me` - Get student's results
- `GET /api/results/exam/{exam_id}` - Get results for exam (teacher only)

## Frontend Components Integrated

### Authentication Pages

- **Login** (`/app/auth/login/page.tsx`)

  - Uses `authAPI.login()`
  - Stores token and user in localStorage
  - Redirects based on user role

- **Register** (`/app/auth/register/page.tsx`)
  - Uses `authAPI.register()`
  - Auto-generates registration number for students
  - Stores credentials and redirects to appropriate dashboard

### Admin Features

- **Add User Modal** (`/components/ui/AddUserModal.tsx`)
  - Uses `usersAPI.create()`
  - Creates users with email and password
  - Auto-generates registration numbers for students

### Exam Taking

- **Take Exam** (`/app/exam/take/page.tsx`)
  - Fetches exam and questions using `examsAPI.getById()` and `questionsAPI.getForExam()`
  - Submits answers using `resultsAPI.submit()`
  - Includes timer and progress tracking

### Results

- **Results Page** (`/app/results/page.tsx`)
  - Fetches student's results using `resultsAPI.getMyResults()`
  - Fetches exams using `examsAPI.list()`
  - Displays scores and submission timestamps

## API Client Architecture

### Location: `/lib/api.ts`

The API client is organized into logical groups:

```typescript
// Auth API
authAPI.register(payload): Promise<TokenResponse>
authAPI.login(credentials): Promise<TokenResponse>

// Users API
usersAPI.create(payload, token): Promise<User>
usersAPI.list(token): Promise<User[]>

// Exams API
examsAPI.create(payload, token): Promise<Exam>
examsAPI.list(): Promise<Exam[]>
examsAPI.getById(examId): Promise<Exam>

// Questions API
questionsAPI.create(payload, token): Promise<Question>
questionsAPI.getForExam(examId): Promise<Question[]>

// Results API
resultsAPI.submit(payload, token): Promise<Result>
resultsAPI.getMyResults(token): Promise<Result[]>
resultsAPI.getForExam(examId, token): Promise<Result[]>

// Utility Functions
getStoredToken(): string | null
getStoredUser(): User | null
setStoredAuth(token, user): void
clearStoredAuth(): void
```

## Authentication Flow

1. **User Registration/Login**

   - User submits credentials
   - API returns JWT token
   - Token stored in `localStorage` as `access_token`
   - User object stored in `localStorage` as `currentUser`

2. **Authenticated Requests**

   - All protected endpoints include Authorization header
   - Format: `Authorization: Bearer {token}`
   - Example:
     ```typescript
     const token = getStoredToken();
     const result = await resultsAPI.submit(payload, token);
     ```

3. **Session Management**
   - Session helpers in `/lib/api.ts`:
     - `getStoredToken()` - Retrieve JWT token
     - `getStoredUser()` - Retrieve current user object
     - `setStoredAuth()` - Store both token and user
     - `clearStoredAuth()` - Clear session on logout

## Error Handling

All API calls include error handling:

```typescript
try {
  const result = await authAPI.login(credentials);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("Login failed:", message);
  setError(message);
}
```

Errors are thrown with descriptive messages from the API response.

## CORS Configuration

Ensure your FastAPI backend has CORS enabled to allow requests from your frontend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing

### Test Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@school.local", "password": "adminpass"}'
```

### Test Create User

```bash
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your_token}" \
  -d '{"full_name": "John Doe", "email": "john@example.com", "password": "pass123", "role": "student"}'
```

### Test List Exams

```bash
curl http://localhost:8000/api/exams
```

## Troubleshooting

### "Not authenticated" Error

- Check if token is stored correctly in localStorage
- Verify token hasn't expired
- Try logging in again

### CORS Errors

- Ensure backend has CORS middleware configured
- Verify `NEXT_PUBLIC_API_URL` matches backend URL
- Check browser console for specific error details

### 404 Exam Not Found

- Verify exam exists in database
- Ensure exam is published if required
- Check exam ID parameter

### Backend Connection Refused

- Ensure FastAPI backend is running
- Verify backend port is correct (default: 8000)
- Check `NEXT_PUBLIC_API_URL` environment variable
