# 🚀 Momentum

> **Consistency that compounds** — A comprehensive productivity SaaS application for personal and team task management, habit tracking, and goal achievement.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)

---

## 📌 Overview

**Momentum** is a modern productivity platform that helps individuals and teams track their work, build positive habits, achieve goals, and collaborate effectively. With a sleek dark-themed UI and responsive design, Momentum works seamlessly across desktop, tablet, and mobile devices.

---

## ✨ Key Features

### 📅 **My Work - Task & Calendar Tracking**
- Visual calendar board with time slots (6 AM - 9 PM)
- Drag-and-drop task management
- Date navigation with "Today" quick access
- Task categories and duration tracking
- Real-time current timeline indicator

### 🔥 **Habit Tracker**
- Daily habit completion tracking
- Streak counting with fire emoji indicators
- Completion history and statistics
- Success rate analytics
- Grace days for maintaining streaks

### 🎯 **Goal Tracker**
- Set personal and professional goals
- Track progress with completion percentage
- Add milestone logs and reviews
- Timeline visualization
- Goal analytics and insights

### 👥 **Team Collaboration**
- Create and manage teams
- Invite team members via email
- Assign tasks to team members (admin-only)
- View team activity logs
- Role-based permissions (admin/member)

### 📊 **Activity & Logs**
- User-specific activity tracking
- Team activity timeline
- Action history (tasks, habits, goals)
- Real-time activity updates

### 🎨 **Modern UI/UX**
- Dark theme with cyan accent (#00ffff)
- Smooth Framer Motion animations
- Responsive design (mobile, tablet, desktop)
- Keyboard accessibility
- Hover effects and micro-interactions

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **React Router** - Client-side routing
- **Framer Motion** - Smooth animations
- **Axios** - HTTP client
- **EmailJS** - Email service integration
- **CSS Variables** - Theming system

### **Backend**
- **Node.js** + **Express** + TypeScript
- **MongoDB** with Mongoose ORM
- **JWT** - Authentication
- **Multer** - File uploads
- **Bcrypt** - Password hashing

### **Architecture**
- RESTful API design
- Modular service pattern
- Context-based state management
- Custom hooks for reusable logic

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js v16+ and npm/yarn
- MongoDB (local or Atlas)
- Git

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/momentum.git
cd momentum
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

**Backend `.env` example:**
```env
PORT=5002
MONGODB_URI=mongodb://localhost:27017/momentum
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=development
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install

# Create .env file
cp .env.example .env
# Edit .env with backend API URL
```

**Frontend `.env` example:**
```env
VITE_API_URL=http://localhost:5002/api
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### **Running the Application**

**Backend:**
```bash
cd backend
npm run dev  # Development mode with hot reload
# or
npm start    # Production mode
```

**Frontend:**
```bash
cd frontend
npm run dev  # Development server (Vite)
# or
npm run build && npm run preview  # Production build
```

Access the app at: `http://localhost:5173`

---

## 📱 Responsive Design

Momentum is fully responsive across all devices:

- **Desktop** (≥ 1280px) - Full sidebar, multi-column layout
- **Laptop** (1024px - 1279px) - Collapsible sidebar
- **Tablet** (768px - 1023px) - Hamburger menu, stacked layout
- **Mobile** (≤ 767px) - Mobile-optimized, full-screen modals

---

## 🎯 Project Structure

```
momentum/
├── backend/
│   ├── src/
│   │   ├── config/          # DB & env config
│   │   ├── middleware/      # Auth, error handling
│   │   ├── modules/         # Feature modules
│   │   │   └── auth/
│   │   │       ├── activity/
│   │   │       ├── goal/
│   │   │       ├── habit/
│   │   │       ├── project/
│   │   │       ├── task/
│   │   │       └── team/
│   │   ├── utils/           # Utilities
│   │   ├── app.ts           # Express app
│   │   └── server.ts        # Server entry
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── board/       # Calendar board
│   │   │   ├── layout/      # Layout components
│   │   │   ├── task/        # Task components
│   │   │   ├── team/        # Team components
│   │   │   └── trackers/    # Habit/Goal trackers
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── utils/           # Utilities
│   │   └── main.tsx         # Entry point
│   └── package.json
│
└── README.md
```

---

## 🔐 Environment Variables

### Backend
```env
PORT=5002
MONGODB_URI=mongodb://localhost:27017/momentum
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Frontend
```env
VITE_API_URL=http://localhost:5002/api
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

> **⚠️ Security Note:** Never commit `.env` files. Use `.env.example` as templates.

---

## 🧪 Build & Deploy

### **Build Frontend**
```bash
cd frontend
npm run build
```
Output: `frontend/dist/`

### **Build Backend**
```bash
cd backend
npm run build
```
Output: `backend/dist/`

### **Deployment**
- Frontend: Vercel, Netlify, or any static host
- Backend: Railway, Render, Heroku, or VPS
- Database: MongoDB Atlas (recommended)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Rishabh Upadhyay**

- Portfolio: [rishabhupadhyay.vercel.app](https://rishabhupadhyay.vercel.app/)
- Blog: [techiesblog12.vercel.app](https://techiesblog12.vercel.app/)
- Email: rishabh.292002@gmail.com
- LinkedIn: [Rishabh Upadhyay](https://linkedin.com/in/rishabh-upadhyay-880294220)
- GitHub: [@Rishabhupadhya](https://github.com/Rishabhupadhya)

---

## 🙏 Acknowledgments

- Built with ❤️ using React, TypeScript, and Node.js
- Design inspired by Linear and Notion
- Icons and animations powered by Framer Motion

---

<div align="center">
  <strong>⭐ Star this repo if you find it helpful!</strong>
  <br><br>
  Made with 💙 by Rishabh Upadhyay
</div>

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
