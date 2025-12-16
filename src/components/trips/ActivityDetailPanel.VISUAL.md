# ActivityDetailPanel - Visual Structure

## Component Layout

```
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │         BACKDROP (z-40)                 │ │
│ │    bg-black/30 backdrop-blur-sm         │ │
│ │                                         │ │
│ │    ┌──────────────────────────────┐    │ │
│ │    │  PANEL (z-50) - 400px width  │    │ │
│ │    ├──────────────────────────────┤    │ │
│ │    │ ┏━━━━━━━━━━━━━━━━━━━━━━━━┓ │    │ │
│ │    │ ┃ HEADER (sticky)        ┃ │    │ │
│ │    │ ┃  - Title               ┃ │    │ │
│ │    │ ┃  - Date                ┃ │    │ │
│ │    │ ┃  - [X] Close           ┃ │    │ │
│ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │ │
│ │    │ ┌──────────────────────┐   │    │ │
│ │    │ │ CONTENT (scrollable) │   │    │ │
│ │    │ │                      │   │    │ │
│ │    │ │ ╔══════════════════╗ │   │    │ │
│ │    │ │ ║  Time Section    ║ │   │    │ │
│ │    │ │ ║  🕐 Clock icon   ║ │   │    │ │
│ │    │ │ ║  Start: 09:00    ║ │   │    │ │
│ │    │ │ ║  End:   11:30    ║ │   │    │ │
│ │    │ │ ║  Duration: 2h30m ║ │   │    │ │
│ │    │ │ ║  [Flexible]      ║ │   │    │ │
│ │    │ │ ╚══════════════════╝ │   │    │ │
│ │    │ │                      │   │    │ │
│ │    │ │ ╔══════════════════╗ │   │    │ │
│ │    │ │ ║ Location Section ║ │   │    │ │
│ │    │ │ ║ 📍 MapPin icon   ║ │   │    │ │
│ │    │ │ ║ Location Name    ║ │   │    │ │
│ │    │ │ ║ [category badge] ║ │   │    │ │
│ │    │ │ ║                  ║ │   │    │ │
│ │    │ │ ║ ┌──────────────┐ ║ │   │    │ │
│ │    │ │ ║ │  Mini Map    │ ║ │   │    │ │
│ │    │ │ ║ │   [Leaflet]  │ ║ │   │    │ │
│ │    │ │ ║ │   📍 marker  │ ║ │   │    │ │
│ │    │ │ ║ └──────────────┘ ║ │   │    │ │
│ │    │ │ ║ Coordinates      ║ │   │    │ │
│ │    │ │ ╚══════════════════╝ │   │    │ │
│ │    │ │                      │   │    │ │
│ │    │ │ ╔══════════════════╗ │   │    │ │
│ │    │ │ ║  Notes Section   ║ │   │    │ │
│ │    │ │ ║  📄 FileText     ║ │   │    │ │
│ │    │ │ ║  Activity notes  ║ │   │    │ │
│ │    │ │ ║  go here...      ║ │   │    │ │
│ │    │ │ ╚══════════════════╝ │   │    │ │
│ │    │ │                      │   │    │ │
│ │    │ └──────────────────────┘   │    │ │
│ │    │ ┏━━━━━━━━━━━━━━━━━━━━━━━━┓ │    │ │
│ │    │ ┃ FOOTER (sticky)        ┃ │    │ │
│ │    │ ┃  [Edit] [Delete 🗑️]   ┃ │    │ │
│ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │ │
│ │    └──────────────────────────────┘    │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Animation Sequence

### Panel Opening (when isOpen changes from false to true)

```
Time: 0ms
┌──────────┐
│ Backdrop │ opacity: 0
└──────────┘
             ┌──────┐
             │ Panel│ x: 100% (off-screen right)
             └──────┘

Time: 100ms
┌──────────┐
│ Backdrop │ opacity: 0.5
└──────────┘
        ┌──────┐
        │ Panel│ x: 50% (sliding in)
        └──────┘

Time: 200ms (complete)
┌──────────┐
│ Backdrop │ opacity: 1
└──────────┘
   ┌──────┐
   │ Panel│ x: 0 (fully visible)
   └──────┘
```

### Delete Confirmation Flow

```
1. User clicks Delete button
   ↓
2. Delete confirmation modal appears
   ┌─────────────────────────────┐
   │  ⚠️  Delete Activity?       │
   │                             │
   │  Are you sure you want to   │
   │  delete "Museum Visit"?     │
   │                             │
   │  [Cancel]  [Delete 🗑️]     │
   └─────────────────────────────┘
   ↓
3a. User clicks Cancel → modal dismisses
   ↓
3b. User clicks Delete → mutation executes
   ↓
4. Panel closes, data refreshes
```

## Color Palette

### Primary Colors
```
Sunset:  #F97316  ████  (primary actions, icons)
Ocean:   #0EA5E9  ████  (duration, secondary)
```

### Background Gradients
```
Panel BG: gradient-to-br from-slate-50 via-white to-sunset-50/30
Header:   bg-white/95 backdrop-blur-xl
Section:  bg-white/95 backdrop-blur-xl (GlassPanel)
```

### Category Colors
```
Restaurant:  #F59E0B  ████  Amber
Attraction:  #10B981  ████  Emerald
Shopping:    #8B5CF6  ████  Purple
Nature:      #22C55E  ████  Green
Temple:      #EF4444  ████  Red
Hotel:       #3B82F6  ████  Blue
Transport:   #64748B  ████  Slate
Medical:     #F43F5E  ████  Rose
Playground:  #06B6D4  ████  Cyan
```

## Responsive Breakpoints

### Mobile (< 640px)
```
┌─────────────────────────┐
│   PANEL (full width)    │
│                         │
│  ┌─────────────────┐   │
│  │    Content      │   │
│  └─────────────────┘   │
│                         │
└─────────────────────────┘
     100% viewport width
```

### Desktop (>= 640px)
```
┌────────────────────────────┐
│                            │
│              ┌──────────┐  │
│              │  PANEL   │  │
│              │  400px   │  │
│              │          │  │
│              └──────────┘  │
└────────────────────────────┘
               400px fixed
```

## Component Tree

```
ActivityDetailPanel
├── AnimatePresence
│   └── Backdrop (motion.div)
│       └── onClick → onClose
│
├── AnimatePresence
│   └── Panel (motion.div)
│       ├── Header (sticky)
│       │   ├── Title & Date
│       │   └── Close Button (X)
│       │
│       ├── Content (scrollable)
│       │   ├── Time Section (GlassPanel)
│       │   │   ├── Clock Icon
│       │   │   ├── Start/End times
│       │   │   ├── Duration
│       │   │   └── Flexible badge (optional)
│       │   │
│       │   ├── Location Section (GlassPanel, optional)
│       │   │   ├── MapPin Icon
│       │   │   ├── Location Name
│       │   │   ├── Category Badge
│       │   │   ├── Mini Map (Leaflet)
│       │   │   └── Coordinates
│       │   │
│       │   └── Notes Section (GlassPanel, optional)
│       │       ├── FileText Icon
│       │       └── Notes Content
│       │
│       └── Footer (sticky, if canEdit)
│           ├── Edit Button
│           └── Delete Button
│
└── Delete Confirmation Modal (AnimatePresence)
    ├── Backdrop (z-60)
    └── Dialog (z-70)
        ├── Warning Icon
        ├── Title & Message
        └── Actions
            ├── Cancel Button
            └── Delete Button
```

## State Flow

```
┌──────────────────┐
│ TripViewPage     │
│                  │
│ scheduleItems ◄──┼── Convex Query
│      ▼           │
│ Click item       │
│      ▼           │
│ setActivityId(id)│
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ ActivityDetailPanel      │
│                          │
│ isOpen = true            │
│ activity = item          │
│ location = item.location │
└────────┬─────────────────┘
         │
         ├─► Edit → onEdit()
         │          ├─ Close panel
         │          └─ Open edit modal
         │
         └─► Delete → Show confirmation
                      │
                      ├─► Cancel → dismiss
                      │
                      └─► Confirm → mutation
                                    ├─ Delete item
                                    ├─ Close panel
                                    └─ Refresh data
```

## Icon Legend

| Icon | Name | Usage | Color |
|------|------|-------|-------|
| ⏰ | Clock | Time section header | sunset-600 |
| 📍 | MapPin | Location header | sunset-600 |
| 📄 | FileText | Notes header | sunset-600 |
| 🏷️ | Tag | Flexible badge | - |
| ✏️ | Edit2 | Edit button | - |
| 🗑️ | Trash2 | Delete button | - |
| ⚠️ | AlertTriangle | Delete warning | red-600 |
| ❌ | X | Close panel | slate-400 |

## Accessibility Tree

```
<div role="dialog" aria-modal="true">
  <div aria-labelledby="activity-detail-title">
    <header>
      <h2 id="activity-detail-title">Activity Title</h2>
      <p>Date</p>
      <button aria-label="Close panel">X</button>
    </header>

    <main>
      <section aria-label="Time details">
        <h3>Time</h3>
        <dl>
          <dt>Start</dt><dd>09:00</dd>
          <dt>End</dt><dd>11:30</dd>
          <dt>Duration</dt><dd>2h 30m</dd>
        </dl>
      </section>

      <section aria-label="Location details">
        <h3>Location</h3>
        <h4>Location Name</h4>
        <div aria-label="Map showing location">...</div>
      </section>

      <section aria-label="Activity notes">
        <h3>Notes</h3>
        <p>...</p>
      </section>
    </main>

    <footer>
      <button>Edit Activity</button>
      <button aria-label="Delete activity">🗑️</button>
    </footer>
  </div>
</div>
```

## Mini Map Configuration

```javascript
<MapContainer
  center={[location.lat, location.lng]}
  zoom={14}                    // Neighborhood level
  className="h-40 w-full"      // 160px height
  zoomControl={false}          // No zoom buttons
  attributionControl={false}   // No attribution
  dragging={false}             // No panning
  scrollWheelZoom={false}      // No scroll zoom
  doubleClickZoom={false}      // No double-click zoom
  touchZoom={false}            // No pinch zoom
>
  <TileLayer
    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
  />
  <Marker position={[lat, lng]}>
    <Popup>{location.name}</Popup>
  </Marker>
</MapContainer>
```

## Performance Optimization

```
Optimization Strategy:
├── AnimatePresence → Only renders when isOpen=true
├── Backdrop → Simple div, GPU accelerated
├── Panel → Transform animations (GPU)
├── Map → Lazy loads when panel opens
├── Sections → Conditional rendering
│   ├── Location → Only if location prop exists
│   ├── Notes → Only if notes exist
│   └── Footer → Only if canEdit
└── Delete Modal → Separate AnimatePresence
```

## Testing Scenarios

### Scenario 1: View Activity (Viewer Role)
```
1. User clicks schedule item
   ✓ Panel slides in from right
   ✓ Activity details display
   ✓ Location map shows
   ✓ No edit/delete buttons

2. User clicks backdrop
   ✓ Panel slides out

3. User clicks X button
   ✓ Panel closes
```

### Scenario 2: Edit Activity (Editor Role)
```
1. User clicks schedule item
   ✓ Panel opens with edit/delete buttons

2. User clicks Edit
   ✓ onEdit callback fires
   ✓ Panel closes

3. Edit modal opens (external logic)
```

### Scenario 3: Delete Activity (Owner Role)
```
1. User clicks Delete button
   ✓ Confirmation modal appears
   ✓ Panel still visible behind modal

2. User clicks Cancel
   ✓ Modal dismisses
   ✓ Panel still open

3. User clicks Delete again
   ✓ Modal reappears

4. User clicks Delete (confirm)
   ✓ Mutation executes
   ✓ Modal closes
   ✓ Panel closes
   ✓ Data refreshes
```

### Scenario 4: Activity Without Location
```
1. User views activity with no locationId
   ✓ Time section displays
   ✓ Location section hidden
   ✓ Notes section displays
```

### Scenario 5: Activity Without Notes
```
1. Viewer sees activity without notes
   ✓ No notes section shown

2. Editor sees activity without notes
   ✓ Empty state message shows
   ✓ "No notes added yet"
```

---

This visual guide provides a comprehensive understanding of the ActivityDetailPanel component's structure, behavior, and integration points.
