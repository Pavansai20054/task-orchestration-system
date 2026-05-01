# Password Policy

All passwords in the Task Orchestration System must meet the following security requirements:

## Requirements

✅ **Minimum Length:** 8 characters  
✅ **Uppercase Letter:** At least 1 (A-Z)  
✅ **Lowercase Letter:** At least 1 (a-z)  
✅ **Digit:** At least 1 (0-9)  
✅ **Special Character:** At least 1 (!@#$%^&*)  

## Examples

### Valid Passwords ✅
- `SecurePass123!`
- `MyPassword@456`
- `Test#Password99`
- `Welcome2024!Workspace`

### Invalid Passwords ❌
- `password123` – Missing uppercase and special character
- `PASSWORD!` – Missing lowercase and digit
- `Pass@123` – Only 8 characters (edge case), missing uppercase alternative
- `pass!123` – Missing uppercase letter
- `PASS!123` – Missing lowercase letter
- `Passord!` – Missing digit

## Validation Flow

1. **Register (`POST /auth/register`)** – Password is validated at registration
2. **Update Profile (`PUT /users/me`)** – Password is validated if provided
3. **Login (`POST /auth/login`)** – No validation (authentication only)

## Error Responses

When a password fails validation, the API returns `400 Bad Request` with a specific error message:

```json
{
  "detail": "Password must contain at least one uppercase letter (A-Z)"
}
```

## Enforcement Points

- Backend: `app/utils/validators.py:validate_password()`
- Auth service: `app/services/auth_service.py`
- User service: `app/services/user_service.py`

## Notes

- Passwords are hashed with bcrypt before storage (never stored in plaintext)
- Validation is case-sensitive
- Special characters limited to: `!@#$%^&*`
- No spaces allowed in passwords
