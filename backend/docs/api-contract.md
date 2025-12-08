# API Contract (MVP)

## Auth
POST /auth/login {email,password} -> {token,user}
Registrasi publik dinonaktifkan; akun dibuat oleh admin/seed.

## Profile
GET /me -> User
PATCH /me {name,phone,dob,address,bio,avatar_url,nisn,grade,school_id} -> User
PATCH /me/password {password_current,password_new} -> {message}

## Dashboard
GET /dashboard -> {metrics, banner, subjects[], todos[], recommendations[], materials[]}

## Assessments
GET /assessments -> Assessment[]
POST /assessments {scores,psych,learning_style} -> Assessment

## Todos
GET /todos -> Todo[]
POST /todos {title,subject,due_date} -> Todo
PATCH /todos/{id}/status {status} -> Todo

## Predict
POST /predict {scores,psych,learning_style} -> Recommendation (persisted)

## Health (public)
GET /health -> {status,time}
