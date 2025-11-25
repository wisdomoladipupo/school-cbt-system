# 🔗 Backend API Integration Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│                      http://localhost:3000                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  React Components                                                │
│  ├── /auth/login          → authAPI.login()                     │
│  ├── /auth/register       → authAPI.register()                  │
│  ├── /dashboard/*         → getStoredUser()                     │
│  ├── /exam/take           → examsAPI.getById()                  │
│  │                        → questionsAPI.getForExam()           │
│  │                        → resultsAPI.submit()                 │
│  ├── /results             → resultsAPI.getMyResults()           │
│  │                        → examsAPI.list()                     │
│  └── Components           → usersAPI.create() (modal)           │
│                                                                   │
│  Local Storage                                                    │
│  ├── access_token                                                │
│  └── currentUser                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/JSON
                    (Authorization Bearer Token)
┌─────────────────────────────────────────────────────────────────┐
│                     API CLIENT (lib/api.ts)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  authAPI          usersAPI         examsAPI                     │
│  ├── login()      ├── create()     ├── create()                 │
│  └── register()   └── list()       ├── list()                   │
│                                    └── getById()                 │
│  questionsAPI     resultsAPI                                    │
│  ├── create()     ├── submit()                                  │
│  └── getForExam() ├── getMyResults()                            │
│                   └── getForExam()                              │
│                                                                   │
│  Utilities                                                        │
│  ├── getStoredToken()                                           │
│  ├── getStoredUser()                                            │
│  ├── setStoredAuth()                                            │
│  └── clearStoredAuth()                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/JSON
                    (with Authorization Header)
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│                      http://localhost:8000                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  /api/auth                /api/users                            │
│  ├── POST /register       ├── POST / (create)                   │
│  └── POST /login          └── GET / (list)                      │
│                                                                   │
│  /api/exams               /api/questions                        │
│  ├── POST /               ├── POST /                            │
│  ├── GET /                └── GET /exam/{id}                    │
│  └── GET /{id}                                                  │
│                                                                   │
│  /api/results                                                    │
│  ├── POST /submit                                               │
│  ├── GET /me                                                    │
│  └── GET /exam/{id}                                             │
│                                                                   │
│  ┌─────────────────────────────────────────────────┐            │
│  │         SQLite Database                         │            │
│  │  ├── users       (id, email, password, role)    │            │
│  │  ├── exams       (id, title, description, ...)  │            │
│  │  ├── questions   (id, exam_id, text, options)   │            │
│  │  └── results     (id, student_id, exam_id, ...) │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### 1️⃣ User Login Flow

```
User Input (email, password)
    ↓
LoginPage Component
    ↓
authAPI.login(credentials)
    ↓
HTTP POST /api/auth/login
    ↓
Backend validates credentials
    ↓
Returns: { access_token, token_type }
    ↓
setStoredAuth(token, user)  ← Stores in localStorage
    ↓
Router redirects to dashboard
    ↓
DashboardLayout uses getStoredUser()
    ↓
Displays user-specific content
```

### 2️⃣ Taking Exam Flow

```
Student clicks "Take Exam"
    ↓
TakeExamPage loaded with examId
    ↓
useEffect calls:
├── examsAPI.getById(examId)
└── questionsAPI.getForExam(examId)
    ↓
Questions displayed in QuestionCard
    ↓
Student answers questions
    ↓
handleSubmit() called
    ↓
resultsAPI.submit(answers, token)
    ↓
HTTP POST /api/results/submit
    ↓
Backend validates answers
    ↓
Calculates score
    ↓
Saves to database
    ↓
Returns: { id, score, max_score, ... }
    ↓
Shows results page
```

### 3️⃣ Viewing Results Flow

```
Student goes to /results
    ↓
ResultsPage useEffect calls:
├── resultsAPI.getMyResults(token)
└── examsAPI.list()
    ↓
HTTP GET /api/results/me + /api/exams
    ↓
Backend queries database
    ↓
Returns: Array of results + Array of exams
    ↓
Maps results to exam titles
    ↓
Displays formatted results with scores
```

## Authentication Flow

```
┌─────────────────────────────────────────┐
│    First Time Visit                     │
│    (No token in localStorage)           │
└─────────────────────────────────────────┘
              ↓
    Redirect to /auth/login
              ↓
┌─────────────────────────────────────────┐
│    User enters credentials              │
│    ✓ Valid → authAPI.login()            │
│    ✗ Invalid → Show error               │
└─────────────────────────────────────────┘
              ↓
    setStoredAuth(token, user)
    (stored in localStorage)
              ↓
    Redirect to dashboard based on role
              ↓
┌─────────────────────────────────────────┐
│    All future requests include token    │
│    Authorization: Bearer {token}        │
└─────────────────────────────────────────┘
              ↓
    When logout clicked:
    clearStoredAuth()
              ↓
    Redirect to /auth/login
```

## File Integration Map

```
FRONTEND PAGES
├── app/auth/login/page.tsx
│   └── Uses: authAPI.login, setStoredAuth
│
├── app/auth/register/page.tsx
│   └── Uses: authAPI.register, setStoredAuth
│
├── app/dashboard/layout.tsx
│   └── Uses: getStoredUser, checks auth
│
├── app/exam/take/page.tsx
│   └── Uses: examsAPI, questionsAPI, resultsAPI
│
└── app/results/page.tsx
    └── Uses: resultsAPI, examsAPI

COMPONENTS
├── components/ui/navbar.tsx
│   └── Uses: getStoredUser, clearStoredAuth
│
└── components/ui/AddUserModal.tsx
    └── Uses: usersAPI.create, getStoredToken

UTILITIES
└── lib/api.ts
    ├── authAPI (login, register)
    ├── usersAPI (create, list)
    ├── examsAPI (create, list, getById)
    ├── questionsAPI (create, getForExam)
    ├── resultsAPI (submit, getMyResults, getForExam)
    └── Session helpers (get/set/clear auth)
```

## API Response Types

### Successful Response
```json
{
  "data": {...},
  "status": 200
}
```

### Error Response
```json
{
  "detail": "Error message",
  "status": 400|401|403|404|500
}
```

### Authentication Response
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

## Request Headers

### Public Endpoints
```
GET /api/exams
Content-Type: application/json
```

### Protected Endpoints
```
POST /api/results/submit
Content-Type: application/json
Authorization: Bearer eyJhbGc...
```

## Environment Setup

```
.env.local
├── NEXT_PUBLIC_API_URL=http://localhost:8000
└── (Other env vars as needed)
```

## Deployment Mapping

```
┌─ Development ─────────────────┐
│ Frontend: localhost:3000      │
│ Backend: localhost:8000       │
│ Database: local SQLite        │
└───────────────────────────────┘
              ↓
┌─ Production ──────────────────┐
│ Frontend: example.com         │
│ Backend: api.example.com      │
│ Database: PostgreSQL/Cloud    │
│                               │
│ .env.local:                   │
│ NEXT_PUBLIC_API_URL=          │
│   https://api.example.com     │
└───────────────────────────────┘
```

## Error Handling Flow

```
API Call
    ↓
Is Response OK?
├─ YES → Parse JSON
│   ├─ Return data
│   └─ Update state
│
└─ NO → Throw error with detail
    ↓
    Catch block
    ├─ Extract error message
    ├─ Log to console
    ├─ Display to user
    └─ Update error state
```

---

**This architecture ensures seamless communication between your Next.js frontend and FastAPI backend!** 🚀
