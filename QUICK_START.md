# Quick Start Guide - Notifications & Multi-Assignee Feature

## 🚀 Getting Started

### Prerequisites
- Python 3.8+ (backend)
- Node.js 16+ (frontend)
- PostgreSQL (or SQLite for development)

### Installation

```bash
# Backend setup
cd backend
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```

### Running

```bash
# Terminal 1: Start backend
cd backend
python -m uvicorn app.main:app --reload
# API available at http://localhost:8000

# Terminal 2: Start frontend
cd frontend
npm run dev
# UI available at http://localhost:5173
```

## 📋 Key Features

### 1. Notifications System
- Click 🔔 button to see all tasks assigned to you
- Click any task to view full details (title, description, deadline)
- See which colleagues are also assigned to each task

### 2. Multi-Assignee Task Management
- Assign multiple team members to a single task
- Add/remove assignees after task creation
- View all assignees with their emails on task cards

### 3. Task Administration (Admin Only)
- Create tasks with initial assignees
- Add more users to existing tasks
- Remove users from tasks
- Delete tasks

## 🛠️ API Endpoints

### Get Your Notifications
```bash
GET /tasks/assigned
Authorization: Bearer <token>
```
Returns: List of all tasks assigned to current user

### Create Task with Multiple Assignees
```bash
POST /tasks
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Design Review",
  "description": "Review all UI mockups",
  "workspace_id": 1,
  "priority": "high",
  "assignees": [2, 3, 4],
  "due_date": "2024-12-31T23:59:59Z"
}
```

### Add User to Task
```bash
POST /tasks/{task_id}/assignees
Content-Type: application/json
Authorization: Bearer <token>

{
  "user_id": 5
}
```

### Remove User from Task
```bash
DELETE /tasks/{task_id}/assignees/{user_id}
Authorization: Bearer <token>
```

## 📊 Database Schema

### New Table: task_assignees
```sql
CREATE TABLE task_assignees (
  task_id INTEGER PRIMARY KEY,
  user_id INTEGER PRIMARY KEY,
  assigned_at DATETIME,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Updated Table: tasks
- Removed: `assigned_to` (single user)
- Added: `created_by` (track creator)
- Added: Relationship to multiple assignees via junction table

## 🎯 Common Workflows

### Workflow 1: Assign a New Task to Team Members
1. Click "Create Workspace" button
2. Select workspace from list
3. Fill task details (title, priority, description)
4. Enter initial assignee ID (or leave blank)
5. Click "Create Task"
6. Click "Add assignee..." dropdown to add more users
7. Task now shows all assignees

### Workflow 2: Check Your Assigned Work
1. Click 🔔 Notifications button
2. See count of tasks assigned to you
3. Click any task to view full details
4. See deadline, description, and other assignees
5. Close modal to return to dashboard

### Workflow 3: Update Task Assignment
1. Go to workspace
2. Find task in task list
3. Use "Add assignee..." dropdown to add users
4. Click × on assignee tags to remove users
5. Changes save immediately

## 🔒 Role-Based Access Control

| Operation | Admin | Member |
|-----------|-------|--------|
| Create task | ✅ | ✅ |
| Add assignee to task | ✅ | ❌ |
| Remove assignee from task | ✅ | ❌ |
| Delete task | ✅ | ❌ |
| Update task status | ✅ | ✅* |
| View task details | ✅ | ✅* |
| Add workspace member | ✅ | ❌ |
| Remove workspace member | ✅ | ❌ |

*Members can only update/view tasks assigned to them

## 📱 Mobile Responsive

All features work on:
- ✅ Desktop (1920×1080+)
- ✅ Tablet (768×1024)
- ✅ Mobile (375×812)

Modals and forms automatically adapt to screen size.

## 🐛 Troubleshooting

### Issue: "Not authorized to assign tasks"
- Solution: Only workspace admins can add/remove task assignees
- Check your role in workspace settings

### Issue: "User not part of workspace"
- Solution: You can only assign users who are workspace members
- Add the user to workspace first, then assign to task

### Issue: Notifications not showing
- Solution: Reload page or check if tasks are actually assigned to you
- Use API: `GET /tasks/assigned` to verify

### Issue: Changes not saving
- Solution: Check browser console for errors
- Verify Bearer token is valid
- Ensure no network errors

## 📚 Documentation

- Full feature guide: `NOTIFICATIONS_FEATURES.md`
- API collection: `backend/docs/postman_collection.json`
- Import in Postman for easy API testing

## 🎓 Learning Resources

### Backend Architecture
- Database: SQLAlchemy ORM with PostgreSQL
- API: FastAPI with async support
- Auth: JWT Bearer tokens
- RBAC: Role-based access control

### Frontend Architecture
- Framework: React 18 with TypeScript
- State: React Hooks (useState, useEffect)
- API: Axios for HTTP requests
- Styling: CSS with custom properties

### Key Files to Understand

**Backend**:
- `app/models/task_assignee.py` - Junction table definition
- `app/services/task_service.py` - Business logic
- `app/api/routes/tasks.py` - API endpoints

**Frontend**:
- `src/pages/Dashboard.tsx` - Main UI component
- `src/api/api.ts` - API client and types
- `src/styles.css` - All styling

## 🤝 Contributing

To add new features:

1. **Backend**: Add service functions, create routes
2. **Frontend**: Update types, create UI components
3. **Database**: Create migration if schema changes
4. **Documentation**: Update README and Postman collection
5. **Testing**: Test all RBAC scenarios

## ✅ Validation Checklist

Before deploying, verify:
- [ ] Backend starts without errors
- [ ] Database tables created automatically
- [ ] Frontend builds successfully
- [ ] Can create workspace and tasks
- [ ] Can assign multiple users
- [ ] Notifications display correctly
- [ ] Admin controls work properly
- [ ] RBAC enforced correctly
- [ ] All endpoints in Postman respond
- [ ] Mobile responsive

## 📞 Support

Check logs for issues:
```bash
# Backend logs
# Check stdout for FastAPI logs

# Frontend logs
# Open browser console (F12)
```

For detailed errors:
1. Enable DEBUG mode in backend
2. Check Network tab in browser dev tools
3. Review database logs
4. Check API response in Postman

---

**Last Updated**: 2024
**Version**: 1.0 (Multi-Assignee with Notifications)
