# AdminPortal Refactoring Guide

## Đã hoàn thành

### Custom Hooks
1. **useAdminData.ts** - Quản lý data fetching và state cho tất cả data types
2. **useAdminCRUD.ts** - Quản lý CRUD operations (create, update, delete)
3. **useFleetManagement.ts** - Quản lý fleet logic (auto-assign, refresh, config)
4. **useScheduleManagement.ts** - Quản lý driver schedules

### Components
1. **AdminHeader.tsx** - Header với logo, user info, logout button
2. **AdminTabs.tsx** - Navigation tabs component

## Cần tiếp tục

### Tab Components cần tách
Mỗi tab trong AdminPortal nên được tách thành component riêng:

1. **LocationsTab.tsx** - Quản lý locations
2. **MenuTab.tsx** - Quản lý menu items
3. **EventsTab.tsx** - Quản lý events
4. **PromosTab.tsx** - Quản lý promotions
5. **KnowledgeTab.tsx** - Quản lý knowledge base
6. **UsersTab.tsx** - Quản lý users/staff (bao gồm schedule management)
7. **GuestsTab.tsx** - Quản lý guests
8. **RoomsTab.tsx** - Quản lý rooms và room types
9. **HistoryTab.tsx** - Hiển thị service history
10. **FleetTab.tsx** - Quản lý buggy fleet

## Cách refactor AdminPortal

### Bước 1: Import hooks và components mới
```typescript
import { useAdminData } from '../../hooks/useAdminData';
import { useAdminCRUD } from '../../hooks/useAdminCRUD';
import { useFleetManagement } from '../../hooks/useFleetManagement';
import { useScheduleManagement } from '../../hooks/useScheduleManagement';
import { AdminHeader } from './admin/AdminHeader';
import { AdminTabs } from './admin/AdminTabs';
```

### Bước 2: Thay thế state management
Thay vì nhiều useState riêng lẻ, sử dụng hooks:
```typescript
const { data, isLoading, refreshData, loadDriverSchedules, setData } = useAdminData();
const { isParsing, handleDelete, handleAiSubmit } = useAdminCRUD();
const fleetManagement = useFleetManagement(tab, data.rides, data.users);
const scheduleManagement = useScheduleManagement(tab, staffRoleFilter, data.users);
```

### Bước 3: Tách tab components
Mỗi tab nên nhận props từ AdminPortal:
- Data cần thiết
- Callback functions (onAdd, onUpdate, onDelete, onRefresh)
- State management hooks

### Bước 4: Simplify AdminPortal
AdminPortal chỉ còn:
- Tab state management
- Render AdminHeader, AdminTabs, và tab components
- Pass props xuống các tab components

## Lợi ích

1. **Code dễ đọc hơn** - Mỗi component có trách nhiệm rõ ràng
2. **Dễ maintain** - Sửa một tab không ảnh hưởng tab khác
3. **Dễ test** - Có thể test từng component riêng
4. **Tái sử dụng** - Hooks có thể dùng ở components khác
5. **Performance** - Chỉ re-render component cần thiết

## Ví dụ: LocationsTab component

```typescript
interface LocationsTabProps {
    locations: Location[];
    onAdd: (location: Location) => Promise<void>;
    onUpdate: (id: string, location: Location) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onRefresh: () => Promise<void>;
    locationFilter: string;
    onFilterChange: (filter: string) => void;
    locationSearch: string;
    onSearchChange: (search: string) => void;
}

export const LocationsTab: React.FC<LocationsTabProps> = ({
    locations,
    onAdd,
    onUpdate,
    onDelete,
    onRefresh,
    locationFilter,
    onFilterChange,
    locationSearch,
    onSearchChange
}) => {
    // Component logic here
    return (
        // JSX for locations tab
    );
};
```
