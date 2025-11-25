# Backend API Integration - Quick Reference

## What's Been Done

### ✅ Completed Integration

1. **API Client Layer** (`lib/api.ts`)

   - Centralized API endpoints
   - TypeScript interfaces for all requests/responses
   - Built-in error handling
   - Session management utilities

2. **Authentication**

   - Login page → `authAPI.login()`
   - Register page → `authAPI.register()`
   - Navbar logout → `clearStoredAuth()`
   - Token storage in localStorage

3. **User Management**

   - AddUserModal → `usersAPI.create()`
   - Email & password required
   - Auto-generate registration numbers for students

4. **Exam Management**

   - Exam taking → `examsAPI.getById()` + `questionsAPI.getForExam()`
   - Result submission → `resultsAPI.submit()`
   - Timer and progress tracking

5. **Results**
   - Results page → `resultsAPI.getMyResults()`
   - Exam list → `examsAPI.list()`
   - Score display and history

## Quick Start

### 1. Set Environment Variable

```bash
# Create .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Start Backend

```bash
cd backend
python -m uvicorn app.main:app --reload
```

### 3. Start Frontend

```bash
npm run dev
```

### 4. Test Flow

1. Register → `/auth/register`
2. Login → `/auth/login`
3. Dashboard → Role-based redirect
4. Create/Take Exams → Backend API
5. View Results → Backend API

## API Calls Summary

| Page               | Function       | API Call                                           |
| ------------------ | -------------- | -------------------------------------------------- |
| Login              | handleLogin    | `authAPI.login()`                                  |
| Register           | handleRegister | `authAPI.register()`                               |
| Navbar             | handleLogout   | `clearStoredAuth()`                                |
| AddUserModal       | handleSave     | `usersAPI.create()`                                |
| Take Exam (Load)   | useEffect      | `examsAPI.getById()` + `questionsAPI.getForExam()` |
| Take Exam (Submit) | handleSubmit   | `resultsAPI.submit()`                              |
| Results            | useEffect      | `resultsAPI.getMyResults()` + `examsAPI.list()`    |

## Token Storage

```typescript
// Get token
const token = getStoredToken(); // → string or null

// Get user
const user = getStoredUser(); // → User object or null

// Store (on login/register)
setStoredAuth(token, user); // → stores in localStorage

// Clear (on logout)
clearStoredAuth(); // → removes from localStorage
```

## Common Patterns

### Protected API Call with Error Handling

```typescript
try {
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated");

  const result = await resultsAPI.submit(payload, token);
  // Handle success
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  setError(message);
}
```

### Fetch Data on Mount

```typescript
useEffect(() => {
  const load = async () => {
    try {
      const data = await examsAPI.list();
      setData(data);
    } catch (error) {
      console.error("Failed to load:", error);
    }
  };

  load();
}, []);
```

## Files Modified

- ✅ `lib/api.ts` - Created API client layer
- ✅ `app/auth/login/page.tsx` - Integrated login
- ✅ `app/auth/register/page.tsx` - Integrated registration
- ✅ `components/ui/AddUserModal.tsx` - Integrated user creation
- ✅ `app/exam/take/page.tsx` - Integrated exam taking
- ✅ `app/results/page.tsx` - Integrated results
- ✅ `components/ui/navbar.tsx` - Updated logout
- ✅ `app/dashboard/layout.tsx` - Updated session handling
- ✅ `.env.local.example` - Created environment template

## Still To Integrate (Optional)

- Exam creation page (`/app/exam/create/page.tsx`)
- Exam management page (`/app/exam/manage/page.tsx`)
- Student dashboard exam fetching (`/app/dashboard/student/page.tsx`)
- Admin dashboard statistics

## Troubleshooting

### "401 Unauthorized" on Protected Routes

- Token may have expired
- Try logging in again
- Check localStorage has `access_token`

### CORS Errors

- Backend CORS not configured properly
- Check backend allows your frontend URL
- Verify `NEXT_PUBLIC_API_URL` is correct

### "Cannot find module" Errors

- Run `npm install` if dependencies missing
- Check file paths are correct
- TypeScript errors usually resolve after saving

## Next Steps

1. Test the integrated flow end-to-end
2. Create exam creation page integration
3. Add exam management page integration
4. Implement real-time notifications
5. Add offline support with service workers
