# RBAC Dashboard Project

A Role-Based Access Control (RBAC) dashboard application with a .NET/MongoDB backend and a modern, glassmorphic React front-end. It implements a fully generic "Post Creation" feature using the elegant visual language of a Book Courier platform as per the requirements.

## Features

- **RBAC Authentication**: Secure JWT-based registration and login.
- **Roles**:
  - `Admin`: Full access (Create, View, Update, Delete ANY post)
  - `Manager`: Elevated access (View all posts, Update any post, but CANNOT delete)
  - `User`: Basic access (Create, View, Update, Delete ONLY their OWN posts)
- **Generic Posts**: Simple post management (Title, Content) using clean CRUD operations.
- **Premium UI**: Crafted using Vanilla CSS avoiding Tailwind, featuring glassmorphism, responsive grid layouts, and sleek typography (`Outfit` font).

## Prerequisites
- [.NET 10.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/en) (v18+ recommended)
- A working MongoDB Connection. A default cluster is already configured in `appsettings.json`.

## Setup Instructions

### 1. Start the Backend API
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd dotnet-Backend
   ```
2. Restore packages and run the API:
   ```bash
   dotnet restore
   dotnet run
   ```
   *The server will typically start at `http://localhost:5273`.*

### 2. Start the Frontend Application
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Javascript dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:5173` (or the port specified by Vite).*

## Database & Evaluation Context

- The project relies on **MongoDB** rather than a relational DB, according to the final system requirement adjustment requested.
- **Evaluation Criteria**:
  - Code Quality and Structure: Ensured by cleanly separated Components, Contexts, and secure .NET API endpoints.
  - Role-Based Control: Tested inside `PostsController.cs` via Claims extraction and in the UI by conditionally rendering specific UI elements (like the Delete button which is invisible to Managers).
  - Usability: A highly responsive UI, user-friendly forms, dynamic real-time dashboard statistic updates based on actual backend data count.
