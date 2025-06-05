# Flow Visualization

An interactive hierarchical task flow visualization built with React Flow, featuring agent execution traces and multi-level navigation.

## Features

- **Hierarchical Navigation**: Navigate through 4 levels of task hierarchy
  - Level 1: Main Tasks
  - Level 2: Subtasks  
  - Level 3: Engineering Tasks
  - Level 4: Execution Traces

- **Agent Types**: Visual representation of different agent types
  - 🔧 Fullstack Agent
  - 📋 PM Agent
  - ⚡ SWE Agent
  - 🔍 Trace Agent

- **Interactive Elements**:
  - Click nodes to drill down into subtasks
  - Breadcrumb navigation for easy level switching
  - Real-time status updates with animations
  - Progress tracking and statistics
  - Detailed trace step visualization

- **Visual Features**:
  - Dark/Light theme support
  - Animated edges and nodes
  - Status-based color coding
  - Responsive layout
  - Minimap and controls

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd flow-visualization
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
flow-visualization/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── globals.css         # Global styles and CSS variables
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main page component
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── separator.tsx
│   │   │   └── sheet.tsx
│   │   └── Flow.tsx            # Main flow visualization component
│   ├── contexts/
│   │   ├── TaskContext.tsx     # Task data management
│   │   └── ThemeContext.tsx    # Theme management
│   ├── lib/
│   │   ├── utils/
│   │   │   └── agent-hierarchy.ts  # Agent hierarchy utilities
│   │   └── utils.ts            # General utilities
│   ├── styles/
│   │   └── flow.css            # Flow-specific styles
│   └── types/
│       ├── index.ts            # Main type definitions
│       └── agent-hierarchy.ts  # Agent hierarchy types
├── package.json
└── README.md
```

## Data Integration

The project currently uses mock data defined in `src/contexts/TaskContext.tsx`. To integrate with your own data:

1. **Replace the mock data**: Update the `mockTasks` array in `TaskContext.tsx` with your actual task data
2. **Implement API calls**: Replace the mock `fetchTasks` function with real API calls
3. **Update types**: Modify the type definitions in `src/types/` to match your data structure

### Expected Data Format

Tasks should follow this structure:

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: Priority;
  due_date?: string;
  created_at: string;
  updated_at: string;
  assignees: string[];
  subtasks?: Task[];
  // ... other fields
}
```

## Customization

### Themes
- Modify CSS variables in `src/app/globals.css` for custom color schemes
- Update the theme logic in `src/contexts/ThemeContext.tsx`

### Agent Types
- Add new agent types in `src/types/agent-hierarchy.ts`
- Update icons and colors in `src/lib/utils/agent-hierarchy.ts`

### Layout Algorithms
- Customize node positioning in the `calculateHierarchicalLayout` function in `Flow.tsx`
- Modify edge connections and animations

## Technologies Used

- **React 18** - UI framework
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **React Flow** - Flow diagram library
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Radix UI** - Accessible UI primitives
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 