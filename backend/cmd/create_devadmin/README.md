# DevAdmin User Environment Variables

The devadmin user is created **automatically** when the backend starts, if the required environment variables are set.

## Required Variables

```bash
DEVADMIN_EMAIL=your-email@example.com
DEVADMIN_PASSWORD=your-secure-password
```

## Optional Variables

```bash
DEVADMIN_USERNAME=your-username  # Defaults to email prefix if not set
```

## Automatic Creation (Recommended)

### Setup

Add these lines to `backend/config/.env`:

```bash
DEVADMIN_EMAIL=admin@example.com
DEVADMIN_PASSWORD=change_this_secure_password
DEVADMIN_USERNAME=admin
```

### Start the Backend

```bash
cd backend
go run cmd/api/main.go
```

The devadmin user will be created automatically on startup if it doesn't exist yet.

## Manual Creation (Alternative)

If you prefer to create the user before starting the backend:

```bash
cd backend
go run cmd/create_devadmin/create_devadmin.go
```

Or with environment variables:

```bash
cd backend
DEVADMIN_EMAIL=admin@example.com \
DEVADMIN_PASSWORD=change_this_secure_password \
DEVADMIN_USERNAME=admin \
go run cmd/create_devadmin/create_devadmin.go
```

## Security Notes

- **Never commit** your actual credentials to version control
- The `.env` file is already in `.gitignore` to prevent accidental commits
- Passwords are hashed with bcrypt before being stored in the database
- The user is only created once; subsequent startups will skip creation if the user exists
- After creating the devadmin user, you can optionally remove these variables from your `.env` file
