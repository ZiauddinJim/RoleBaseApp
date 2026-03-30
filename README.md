# Role-Based Post Management System

A full-stack web application featuring **Role-Based Access Control (RBAC)** built with a **.NET 10 Web API** backend and a **React 19 + Vite** frontend. The system supports two distinct roles — **Admin** and **User** — each with different permissions for managing posts.

---

## Features

### User Roles & Permissions

| Permission | Admin | User |
|---|:---:|:---:|
| Access Dashboard | ✅ | ✅ |
| View All Posts | ✅ | ✅ |
| Create Post | ✅ | ✅ |
| Edit Own Post | ✅ | ✅ |
| Edit Any Post | ✅ | ❌ |
| Delete Own Post | ✅ | ✅ |
| Delete Any Post | ✅ | ❌ |
| View Total Users | ✅ | ❌ |

### Admin Dashboard
- Total Users count
- Total Posts count
- Recent Posts table (all platform posts)
- Full CRUD control over all posts

### User Dashboard
- My Posts count
- My Posts / All Posts tab view
- Create, Edit, Delete own posts only
- Read-only view of others' posts

---

## Tech Stack

### Backend
- **Runtime:** .NET 10 (ASP.NET Core Web API)
- **Language:** C#
- **Authentication:** JWT (JSON Web Tokens) via `Microsoft.AspNetCore.Authentication.JwtBearer`
- **Password Hashing:** BCrypt.Net
- **ORM/Driver:** MongoDB.Driver

### Frontend
- **Framework:** React 19 with Vite
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **Forms & Validation:** React Hook Form
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Alerts:** SweetAlert2
- **Theme:** Dark / Light mode toggle

### Database
- **MongoDB** (hosted on MongoDB Atlas)

### Authentication
- **JWT Bearer Tokens** — generated on login, attached to every protected API call via Axios interceptors
- **BCrypt** — password hashing before storage

---

## Project Structure

```
RoleBaseApp/
├── dotnet-Backend/          # .NET 10 Web API
│   ├── Controllers/
│   │   ├── AuthController.cs    # Register, Login, GetUsersCount
│   │   └── PostsController.cs   # CRUD with RBAC enforcement
│   ├── DTOs/
│   │   ├── RegisterDto.cs
│   │   ├── LoginDto.cs
│   │   ├── CreatePostDto.cs
│   │   └── UpdatePostDto.cs
│   ├── Models/
│   │   ├── User.cs
│   │   └── Post.cs
│   ├── Services/
│   │   ├── MongoDbService.cs    # MongoDB connection
│   │   └── JwtService.cs        # JWT token generation
│   ├── Program.cs               # App entry point, middleware config
│   └── appsettings.json
│
└── frontend/                # React 19 + Vite
    └── src/
        ├── API/
        │   └── api.js           # Axios instance with JWT interceptor
        ├── components/
        │   ├── PostList.jsx     # Table view (Dashboard)
        │   ├── PostGrid.jsx     # Card view (Posts page)
        │   ├── PostModal.jsx    # Create / Edit modal form
        │   └── ThemeToggle.jsx  # Dark/Light mode toggle button
        ├── context/
        │   ├── AuthContext.jsx  # Global auth state (token, role, userId)
        │   └── ThemeContext.jsx # Global dark/light theme state
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   └── Dashboard.jsx
        ├── App.jsx              # Routes + ProtectedRoute guard
        └── main.jsx
```

---

## Setup Instructions

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/ZiauddinJim/RoleBaseApp.git
cd RoleBaseApp
```

### 2. Configure Environment — Backend

Create or edit `dotnet-Backend/appsettings.json`:

```json
{
  "MongoDb": {
    "ConnectionString": "your_mongodb_connection_string",
    "DatabaseName": "RoleDb"
  },
  "Jwt": {
    "Key": "YOUR_SUPER_SECRET_KEY_MIN_32_CHARS"
  }
}
```

> For Render deployment, configure these as **Environment Variables** using double underscore notation:
> - `MongoDb__ConnectionString`
> - `MongoDb__DatabaseName`
> - `Jwt__Key`
> - `PORT` = `10000`

### 3. Run the Backend

```bash
cd dotnet-Backend
dotnet run
```

API will be available at `http://localhost:5138`

### 4. Configure the Frontend

Edit `frontend/src/API/api.js` and set the base URL to your running backend:

```js
baseURL: "http://localhost:5138/api"
```

### 5. Install & Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

App will be available at `http://localhost:5173`

> No database migrations required — MongoDB is schema-less and collections are created automatically on first use.

---

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new user (Admin or User role) |
| `POST` | `/auth/login` | Public | Login and receive JWT token |
| `GET` | `/auth/users/count` | Admin only | Get total number of registered users |

**Register Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "pass123",
  "role": "User"
}
```

**Login Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "role": "Admin",
  "userId": "6608abc123def456",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Posts — `/api/posts`

All post routes require a valid `Authorization: Bearer <token>` header.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/posts` | All roles | Get all posts (sorted newest first) |
| `POST` | `/posts` | All roles | Create a new post |
| `PUT` | `/posts/{id}` | Owner or Admin | Edit a post |
| `DELETE` | `/posts/{id}` | Owner or Admin | Delete a post |

**Create/Update Request Body:**
```json
{
  "title": "My Post Title",
  "content": "Post content here..."
}
```

---

## Authentication & Authorization

- On **Login**, the server validates credentials and returns a **JWT token** containing the user's `Id` and `Role` as claims.
- The frontend stores the token in `localStorage` and attaches it to every API request via an **Axios interceptor**.
- Protected API routes use `[Authorize]` and `[Authorize(Roles = "Admin")]` attributes to enforce access.
- For `PUT` and `DELETE`, the backend compares the token's `userId` claim against the post's `CreatedByUserId`. If they don't match and the user is not an Admin, the server returns **403 Forbidden**.

---

## Dashboard

### Admin View
- **Stat Cards:** Total Users, Total Posts, Privilege Level (Full Control)
- **Posts Table:** All posts with Edit and Delete on every row
- **Sidebar:** Dashboard and Posts navigation

### User View
- **Stat Cards:** My Posts count, Platform Total Posts, Privilege Level (Manage Own)
- **Posts Table Tabs:** Toggle between "My Posts" and "All Posts"
- **Access Control:** Edit and Delete buttons only visible on own posts; others show "No access"

### Posts Page (Sidebar Nav)
- Displays all posts in a **responsive card grid**
- Full post content is visible (not truncated)
- Card footer shows Edit/Delete only if the user has permission
- Sidebar tab selection is persisted in `localStorage` across page reloads

---

## Validation

### Registration
| Field | Rule |
|---|---|
| Name | Required |
| Email | Required, valid format |
| Role | Required (Admin or User) |
| Password | Required, min 6 characters, at least 1 letter, at least 1 number |

### Login
| Field | Rule |
|---|---|
| Email | Required, valid format |
| Password | Required, min 6 characters, at least 1 letter, at least 1 number |

### Post Creation / Edit
| Field | Rule |
|---|---|
| Title | Required |
| Content | Optional |

All validations are enforced on the **frontend** via `react-hook-form` before any API call is made. The backend also validates required fields and returns appropriate error messages.

---

## Future Improvements

- [ ] Password change and profile update feature
- [ ] Pagination for large post lists
- [ ] Post categories / tags
- [ ] Rich text editor for post content
- [ ] Email verification on registration
- [ ] Admin panel to manage and delete users
- [ ] Audit log for admin actions

---

## Acknowledgement

This project was developed as a **Final Assessment** for an internship program, demonstrating proficiency in:
- Role-Based Access Control (RBAC) design
- .NET Web API development with JWT authentication
- React frontend development with protected routing
- MongoDB integration for data persistence
- Responsive UI design with Tailwind CSS and Dark Mode support

---

## Contact

**Sheikh Md Ziauddin**
- Email: [sheikhmdziauddin@gmail.com](mailto:sheikhmdziauddin@gmail.com)
- Phone: +8801615258155

---

*Built with .NET 10 · React 19 · MongoDB · Tailwind CSS v4*
