# Multi-Assignee Task Assignment & Notifications Feature

## Overview
This update implements a complete notifications system with multi-assignee task support, allowing multiple users to be assigned to a single task and providing real-time notifications for assigned work.

## Backend Changes

### 1. Database Schema Update
- **New Table**: `task_assignees` (many-to-many junction table)
  - `task_id` (FK to tasks.id, primary key)
  - `user_id` (FK to users.id, primary key)
  - `assigned_at` (timestamp)

- **Modified Table**: `tasks`
  - Removed: `assigned_to` (single integer field)
  - Added: `created_by` (tracks who created the task)
  - Now uses many-to-many relationship via `task_assignees` table

- **Models Updated**:
  - `Task`: Relationship changed from single `assignee` to list of `assignees`
  - `User`: Relationship changed to many-to-many with tasks via `task_assignees`

### 2. New API Endpoints

#### Get Assigned Tasks (Notifications)
- **Endpoint**: `GET /tasks/assigned`
- **Auth**: Required (Bearer token)
- **Description**: Retrieve all tasks assigned to the current user
- **Response**: Array of Task objects with full details (title, description, due_date, assignees, etc.)
- **Use Case**: Powers the notifications panel in frontend

#### Add Task Assignee
- **Endpoint**: `POST /tasks/{task_id}/assignees`
- **Auth**: Required (Bearer token, admin only)
- **Payload**: `{ "user_id": integer }`
- **Description**: Add a user as an assignee to a task
- **Response**: Updated Task object with all assignees

#### Remove Task Assignee
- **Endpoint**: `DELETE /tasks/{task_id}/assignees/{user_id}`
- **Auth**: Required (Bearer token, admin only)
- **Description**: Remove a user from task assignees
- **Response**: Updated Task object

#### Update Task Assignees (Bulk)
- **Endpoint**: `PATCH /tasks/{task_id}/assign`
- **Auth**: Required (Bearer token, admin only)
- **Payload**: `{ "assignees": [user_id1, user_id2, ...] }`
- **Description**: Replace all assignees for a task
- **Response**: Updated Task object

### 3. Schema Changes in Services

**Task Creation**:
```python
# Old: assigned_to: Optional[int] = None
# New: assignees: Optional[List[int]] = None
await API.post("/tasks", {
  "title": "Task",
  "workspace_id": 1,
  "assignees": [2, 3, 4]  # Multiple assignees
})
```

**Task Update**:
- Members can only update status of tasks they're assigned to
- Admins can add/remove assignees individually
- Tasks check if user is in `assignees` list instead of checking `assigned_to`

### 4. Updated Services
- `task_service.py`: 
  - `add_task_assignee()` - Add single user
  - `remove_task_assignee()` - Remove single user
  - `get_assigned_tasks()` - Get all tasks for current user
  - Updated validation logic for many-to-many relationships

## Frontend Changes

### 1. New Components & State

**Notifications Modal**:
- Shows count of assigned tasks in header button
- Displays list of all tasks assigned to current user
- Click to expand and view full task details
- Shows task title, status, due date, assignees

**Notification Detail Modal**:
- Full task information display
- Description with proper formatting
- List of all assignees with email and ID
- Status, priority, and due date info

### 2. Task Card Updates

**Assignee Display**:
```tsx
// Old: "Assigned: USER ID 3"
// New: "Assigned: USER ID 2, USER ID 3, USER ID 5" (multiple assignees)
```

**Admin Controls for Task Assignment**:
- **Add Assignee**: Dropdown showing only unassigned members
- **Remove Assignee**: X button on each assignee tag
- **Delete Task**: Direct deletion button

### 3. New API Types

```typescript
export type AssigneeInfo = {
  id: number;
  email: string;
};

export type Task = {
  // ...
  assignees: AssigneeInfo[];  // List instead of assigned_to
  created_by: number;
  // ...
};
```

### 4. UI/UX Improvements

**Dashboard Header**:
- Added Notifications button (🔔) after main buttons
- Shows count of assigned tasks: `🔔 Notifications (5)`
- Toggles notifications panel on click

**Task Form**:
- Simplified assignee field: "Assign user ID (optional)"
- Single input for initial assignee on creation
- Admin can add more after task is created

**Task List**:
- Updated status display shows all assignees
- Individual add/remove controls in card
- Visual assignee tags with remove button (×)

**Responsive Design**:
- Modals work on mobile and desktop
- Flex layouts for assignee tags
- Proper spacing and animations

## Styling Updates

**New CSS Classes**:
- `.modal-overlay` - Full-screen modal background
- `.modal-content` - Modal card styling
- `.notifications-list` - List container
- `.notification-item` - Individual notification item
- `.notification-detail` - Detail view styling
- `.assignee-tag` - Assignee chip display
- `.btn-remove-assignee` - Remove button on assignee
- `.btn-info` - Info-style button (notifications)

## Migration Path

### For Existing Installations

1. **Database Migration Required**:
   - On startup, FastAPI will auto-create `task_assignees` table
   - Existing `tasks.assigned_to` data will be preserved
   - Run manual migration if needed:
   ```sql
   -- Transfer existing single assignees to many-to-many
   INSERT INTO task_assignees (task_id, user_id)
   SELECT id, assigned_to FROM tasks WHERE assigned_to IS NOT NULL;
   ```

2. **API Compatibility**:
   - Old single-assignee endpoints still work
   - New multi-assignee endpoints coexist
   - Update clients to use new endpoints for full functionality

## Testing Checklist

### Backend
- ✅ Create task with multiple assignees
- ✅ Add assignee to existing task
- ✅ Remove assignee from task
- ✅ Get assigned tasks for user
- ✅ RBAC: Only admins can modify assignees
- ✅ Cascade delete: Deleting task removes all assignees

### Frontend
- ✅ Notifications button shows correct count
- ✅ Notifications modal displays all assigned tasks
- ✅ Click notification shows full task details
- ✅ Admin can add assignee to task
- ✅ Admin can remove assignee from task
- ✅ Task form accepts initial assignee on creation
- ✅ Assignee display updated to show multiple users
- ✅ Modal responsive on mobile

## Postman Collection

Updated `postman_collection.json` includes:
- `GET /tasks/assigned` - Get notifications
- `POST /tasks/{id}/assignees` - Add assignee
- `DELETE /tasks/{id}/assignees/{user_id}` - Remove assignee
- `PATCH /tasks/{id}/assign` - Bulk update assignees

Variables configured:
- `baseUrl`, `accessToken`, `workspaceId`, `userId`, `userEmail`, `taskId`

## Usage Examples

### Assign Multiple Users to Task
```bash
# Create task with 2 assignees
curl -X POST http://localhost:8000/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design mockups",
    "workspace_id": 1,
    "assignees": [2, 3]
  }'

# Add another user later
curl -X POST http://localhost:8000/tasks/5/assignees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 4}'

# Remove one user
curl -X DELETE http://localhost:8000/tasks/5/assignees/3 \
  -H "Authorization: Bearer $TOKEN"
```

### Get Notifications
```bash
curl -X GET http://localhost:8000/tasks/assigned \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```json
[
  {
    "id": 1,
    "title": "Design Homepage",
    "description": "Create responsive design...",
    "status": "in_progress",
    "priority": "high",
    "assignees": [
      {"id": 2, "email": "alice@example.com"},
      {"id": 3, "email": "bob@example.com"}
    ],
    "due_date": "2024-01-15T23:59:59Z",
    "created_by": 1
  }
]
```

## Backward Compatibility

- Old API responses still include `created_at`, `created_by` fields
- New `assignees` field replaces `assigned_to`
- Existing single-assignee workflows must migrate to multi-assignee model
- Database schema compatible with async task loading

## Performance Considerations

- Task-assignee junction table is indexed on both task_id and user_id
- Queries use eager loading for assignees to prevent N+1 problems
- Notification list limited to tasks directly assigned (not workspace-wide)
- Efficient cascade delete when tasks removed

## Future Enhancements

- Real-time WebSocket notifications
- Mark notifications as read
- Notification preferences (email, in-app)
- Task assignment templates
- Bulk operations on multiple tasks
- Notification scheduling
