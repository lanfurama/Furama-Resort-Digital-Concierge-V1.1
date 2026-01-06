# ReceptionPortal Refactoring Plan

## Objective
Chia component ReceptionPortal (6242 dòng) thành các sub-components để dễ maintain và test.

## Current Structure
- **Main File**: `components/ReceptionPortal.tsx` (6242 lines)
- **Total Functions**: 57 functions
- **Main Sections**: Modals, Views, Helper Functions

## Refactoring Strategy

### Phase 1: Extract Modals (Priority: HIGH)
Create `components/ReceptionPortal/modals/` folder

1. ✅ **AIAssignmentModal.tsx**
   - Shows AI assignment results
   - Lines: ~200-300
   - Dependencies: rides, drivers, assignment data

2. ✅ **ManualAssignModal.tsx**
   - Manual driver assignment
   - Lines: ~150-200
   - Dependencies: selected ride, online drivers

3. ✅ **RideDetailModal.tsx**
   - Display ride details
   - Lines: ~200-250
   - Dependencies: ride data, locations

4. ✅ **MergeRidesModal.tsx**
   - Merge multiple rides
   - Lines: ~300-400
   - Dependencies: rides, merge logic

5. ✅ **CreateRideModal.tsx**
   - Create new ride request
   - Lines: ~200-300
   - Dependencies: locations, voice input

6. ✅ **VoiceInputModal.tsx**
   - Voice input interface
   - Lines: ~150-200
   - Dependencies: voice parsing service

### Phase 2: Extract Views (Priority: MEDIUM)
Create `components/ReceptionPortal/views/` folder

1. ✅ **PendingRequestsView.tsx**
   - List of pending rides
   - Lines: ~400-500
   - Dependencies: rides, locations

2. ✅ **DriverFleetView.tsx**
   - Driver management (List + Map views)
   - Lines: ~600-800
   - Dependencies: drivers, rides, map

3. ✅ **ReportsView.tsx**
   - Statistics and reports
   - Lines: ~400-500
   - Dependencies: report data, charts

### Phase 3: Extract Utilities (Priority: MEDIUM)
Create `components/ReceptionPortal/utils/` folder

1. ✅ **rideAssignmentUtils.ts**
   - AI assignment logic
   - Functions: handleAutoAssign, cost calculation
   - Lines: ~500-600

2. ✅ **locationUtils.ts**
   - Location/distance calculations
   - Functions: resolveLocationCoordinates, calculateDistance
   - Lines: ~200-300

3. ✅ **mergeRideUtils.ts**
   - Ride merging logic
   - Functions: canCombineRides, calculateOptimalMergeRoute
   - Lines: ~300-400

### Phase 4: Extract Hooks (Priority: LOW)
Create `components/ReceptionPortal/hooks/` folder

1. ✅ **useReceptionData.ts**
   - Data fetching logic
   - Functions: loadData, loadGuestInfo, loadReports

2. ✅ **useGoogleMaps.ts**
   - Google Maps integration
   - Functions: initMap, map utilities

## Benefits
- ✅ Easier to maintain and test
- ✅ Better code organization
- ✅ Reusable components
- ✅ Smaller file sizes
- ✅ Clearer separation of concerns

## Timeline
- Phase 1: 2-3 hours
- Phase 2: 2-3 hours  
- Phase 3: 1-2 hours
- Phase 4: 1 hour

**Total Estimated Time**: 6-9 hours

## Notes
- Keep backward compatibility
- Test after each extraction
- Update imports in main file
- Document component props/interfaces
