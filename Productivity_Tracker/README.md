# Productivity Tracker

A comprehensive productivity management application with task tracking, team collaboration, goal setting, and habit tracking.

## Features

- **Task Management**: Create, organize, and track tasks with calendar view
- **Team Collaboration**: Create teams, assign tasks, and collaborate
- **Goal Tracking**: Set and monitor personal and professional goals
- **Habit Tracking**: Build and maintain positive habits
- **Project Management**: Organize work into projects
- **Activity Insights**: Track productivity patterns and insights
- **Profile Management**: Customize your profile with avatar uploads

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- MongoDB (Mongoose)
- JWT authentication
- File uploads with Multer

### Frontend
- React + TypeScript
- Vite
- React Router
- Axios

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
   - MongoDB URI
   - JWT Secret

5. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Project Structure

```
Productivity_Tracker/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & environment config
│   │   ├── middleware/     # Auth, error handling, uploads
│   │   ├── modules/
│   │   │   └── auth/
│   │   │       ├── task/       # Task management
│   │   │       ├── team/       # Team collaboration
│   │   │       ├── profile/    # User profiles
│   │   │       ├── project/    # Project management
│   │   │       ├── goal/       # Goal tracking
│   │   │       ├── habit/      # Habit tracking
│   │   │       └── activity/   # Activity insights
│   │   └── utils/          # Utilities & helpers
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     # React components
    │   │   ├── task/       # Task components
    │   │   ├── board/      # Calendar board
    │   │   ├── team/       # Team components
    │   │   ├── layout/     # App layout
    │   │   └── profile/    # Profile components
    │   ├── pages/          # Route pages
    │   ├── services/       # API services
    │   └── contexts/       # React contexts
    └── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Teams
- `GET /api/team` - Get user's teams
- `POST /api/team` - Create team
- `POST /api/team/:id/members` - Add team member

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/avatar` - Upload avatar

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal

### Habits
- `GET /api/habits` - Get all habits
- `POST /api/habits` - Create habit
- `POST /api/habits/:id/log` - Log habit completion

## License

MIT
