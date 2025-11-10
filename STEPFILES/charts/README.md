# 🎟️ React Ticket System - Complete Design Code

> **My exact visual designs in React + shadcn + Tailwind CSS**

This is the **complete React version** of my ticket purchasing system with the same outlined floor plan design, color-coded seats, and all visual elements.

---

## ✨ What You Get

### 🎨 **My Exact Designs:**
- ✅ Outlined table style (not filled)
- ✅ Color-coded seats (Green/Yellow/Grey)
- ✅ VIP tables with gold accents
- ✅ Stage, Dance Floor, Bar, Buffet, Entrance
- ✅ Same SVG-based visual design
- ✅ Responsive layout with Tailwind

### 🛠️ **Tech Stack:**
- **React 18** - Component framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Radix UI** - Headless components
- **Lucide React** - Icons

---

## 🚀 Quick Start

### Installation

```bash
# Clone or create project
npm create vite@latest ticket-system -- --template react-ts

# Navigate to project
cd ticket-system

# Install dependencies
npm install

# Install additional packages
npm install lucide-react @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-select @radix-ui/react-slot class-variance-authority clsx tailwind-merge

# Install Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Setup

1. Copy all the component files I created into your `src/` directory
2. Replace `tailwind.config.js` with my version
3. Replace `src/index.css` with my version
4. Replace `src/App.tsx` with my version
5. Run `npm run dev`

---

## 📁 Project Structure

```
ticket-system-react/
├── src/
│   ├── components/
│   │   ├── tables/
│   │   │   ├── RoundTable.tsx       ⭐ My round table design
│   │   │   ├── RectangleTable.tsx   ⭐ My rectangle table design
│   │   │   ├── Seat.tsx             ⭐ Color-coded seat component
│   │   │   └── SpecialAreas.tsx     ⭐ Stage, Dance, Bar designs
│   │   ├── ui/
│   │   │   ├── button.tsx           (shadcn)
│   │   │   └── dialog.tsx           (shadcn)
│   │   └── ShoppingCart.tsx         ⭐ Shopping cart UI
│   ├── lib/
│   │   └── utils.ts                 (cn helper)
│   ├── App.tsx                      ⭐ Main application
│   └── index.css                    (Tailwind + CSS vars)
├── package.json
└── tailwind.config.js
```

---

## 🎨 Design Code Breakdown

### 1. **Round Table Design** (RoundTable.tsx)

My design features:
- **Outlined circles** (not filled)
- **White center** with dark border
- **Individual seats** around perimeter
- **VIP gold accents** for premium tables

```typescript
// Key design elements:
<circle
  cx={center}
  cy={center}
  r={radius}
  fill="none"                    // Outlined style!
  stroke="#2c3e50"               // Dark outline
  strokeWidth={3}
/>

<circle
  cx={center}
  cy={center}
  r={radius - 15}
  fill="#f8f9fa"                 // White center
  stroke="#2c3e50"
  strokeWidth={2}
/>
```

### 2. **Seat Component** (Seat.tsx)

My color-coded design:
- 🟢 **Green (#4CAF50)** = Available
- 🟡 **Yellow (#FFC107)** = Selected
- ⚫ **Grey (#999)** = Sold

```typescript
const getColors = () => {
  switch (status) {
    case 'available':
      return {
        fill: '#4CAF50',        // Green
        stroke: '#2c3e50',
        cursor: 'pointer'
      };
    case 'selected':
      return {
        fill: '#FFC107',        // Yellow
        stroke: '#2c3e50',
        strokeWidth: 3
      };
    case 'sold':
      return {
        fill: '#999',           // Grey
        opacity: 0.5,
        cursor: 'not-allowed'
      };
  }
};
```

### 3. **VIP Table Design**

VIP tables get special treatment:
- Gold outline (#B8860B)
- Glow effect
- Crown icon 👑
- Premium label

```typescript
// VIP glow effect
<circle
  cx={center}
  cy={center}
  r={radius + 5}
  fill="none"
  stroke="#FFD700"              // Gold glow
  strokeWidth="2"
  opacity="0.3"
/>

// VIP crown
<text x={center} y={center - 20} fontSize="24">
  👑
</text>
```

### 4. **Rectangle Table Design**

Clean rectangular tables with:
- Rounded corners
- Seats on all sides
- Outlined style

```typescript
<rect
  x={tableX}
  y={tableY}
  width={width}
  height={height}
  rx="10"                       // Rounded corners
  fill="none"                   // Outlined!
  stroke="#2c3e50"
  strokeWidth="3"
/>
```

### 5. **Stage Design**

Professional stage with:
- Dashed border (curtain effect)
- Spotlight circles
- Purple/indigo color scheme

```typescript
<rect
  width={300}
  height={80}
  rx="10"
  fill="#e8eaf6"                // Light purple
  stroke="#5c6bc0"              // Indigo
  strokeWidth="3"
  strokeDasharray="10,5"        // Dashed border!
/>

// Spotlights
<circle cx={width * 0.25} cy={height / 2} r="8" 
        fill="#FFD700" opacity="0.4" />
```

### 6. **Dance Floor Design**

Checkered dance floor with:
- Checkerboard pattern
- Gradient glow
- Bold colors

```typescript
// Checkerboard pattern
<pattern id="checkerboard" width="40" height="40">
  <rect x="0" y="0" width="20" height="20" fill="#667eea" />
  <rect x="20" y="0" width="20" height="20" fill="#764ba2" />
  <rect x="0" y="20" width="20" height="20" fill="#764ba2" />
  <rect x="20" y="20" width="20" height="20" fill="#667eea" />
</pattern>

<rect
  width={size}
  height={size}
  fill="url(#checkerboard)"
  stroke="#5568d3"
  strokeWidth="5"
/>
```

### 7. **Bar Design**

Wood-grain bar with:
- Gradient fill (wood texture)
- Glass icons
- Shine effect

```typescript
// Wood grain gradient
<linearGradient id="woodGrain">
  <stop offset="0%" stopColor="#8B4513" />
  <stop offset="50%" stopColor="#A0522D" />
  <stop offset="100%" stopColor="#8B4513" />
</linearGradient>

<rect
  width={width}
  height={height}
  fill="url(#woodGrain)"        // Wood texture!
  stroke="#654321"
  strokeWidth="3"
/>
```

---

## 🎯 Key Features

### Designer Mode
- Drag and drop tables from library
- Click to add to floor plan
- Hover to delete
- Save layouts

### Selling Mode
- Click seats to add to cart
- Color-coded status
- Real-time pricing
- Checkout modal

### Shopping Cart (shadcn)
- Clean UI with Tailwind
- Remove items
- Price calculation
- Tax (10%)

---

## 💻 Usage Examples

### Add a Table

```typescript
const addTable = (type, x, y) => {
  const newTable = {
    id: tableIdCounter,
    type,  // 'round-8', 'vip', 'stage', etc.
    x,
    y
  };
  setTables([...tables, newTable]);
};
```

### Handle Seat Click

```typescript
const handleSeatClick = (tableId, seatNumber) => {
  const seatId = `${tableId}-${seatNumber}`;
  
  // Toggle seat selection
  if (cart.includes(seatId)) {
    // Remove from cart
    setCart(cart.filter(id => id !== seatId));
  } else {
    // Add to cart
    setCart([...cart, seatId]);
  }
};
```

### Mark Seats as Sold

```typescript
const soldSeats = {
  1: [1, 2, 5],      // Table 1: seats 1,2,5 sold
  3: [1, 3, 4, 7],   // Table 3: seats 1,3,4,7 sold
};
```

---

## 🎨 Tailwind Customization

My custom colors in `tailwind.config.js`:

```javascript
extend: {
  colors: {
    // Seat colors
    available: '#4CAF50',    // Green
    selected: '#FFC107',     // Yellow
    sold: '#999',            // Grey
    
    // VIP colors
    vip: '#B8860B',          // Gold
    vipGlow: '#FFD700',      // Bright gold
    
    // Brand colors
    primary: '#667eea',      // Purple
    secondary: '#764ba2',    // Deep purple
  }
}
```

---

## 🔧 Customization Guide

### Change Seat Colors

In `Seat.tsx`:

```typescript
const getColors = () => {
  switch (status) {
    case 'available':
      return { fill: '#YOUR_COLOR' };  // Change green
    case 'selected':
      return { fill: '#YOUR_COLOR' };  // Change yellow
    case 'sold':
      return { fill: '#YOUR_COLOR' };  // Change grey
  }
};
```

### Change Table Size

In `RoundTable.tsx`:

```typescript
const getRadius = () => {
  switch (seats) {
    case 8: return 80;     // Change this
    case 10: return 90;    // Change this
    case 12: return 100;   // Change this
  }
};
```

### Change Price Defaults

In `App.tsx`:

```typescript
const [regularPrice, setRegularPrice] = useState(50);  // Change 50
const [vipPrice, setVipPrice] = useState(100);         // Change 100
```

---

## 📦 Component Props

### RoundTable Props

```typescript
interface RoundTableProps {
  tableId: number;
  seats: 8 | 10 | 12;
  type: 'regular' | 'vip';
  x: number;
  y: number;
  onSeatClick: (tableId: number, seatNumber: number) => void;
  soldSeats: number[];
  selectedSeats: number[];
  isDesignerMode: boolean;
  onDelete?: () => void;
}
```

### Seat Props

```typescript
interface SeatProps {
  cx: number;
  cy: number;
  radius: number;
  number: number;
  status: 'available' | 'selected' | 'sold';
  type: 'regular' | 'vip';
  onClick: () => void;
  isInteractive: boolean;
}
```

---

## 🎬 Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📱 Responsive Design

My designs are mobile-responsive:
- Tables scale appropriately
- Cart becomes full-width on small screens
- Touch-friendly interactions
- Responsive grid layout

```typescript
// Responsive grid in App.tsx
<div className="grid grid-cols-[280px_1fr_350px] gap-5 lg:grid-cols-1">
  {/* Left sidebar */}
  {/* Floor plan */}
  {/* Cart */}
</div>
```

---

## 🎨 Design Philosophy

### Why Outlined Style?
- **Professional:** Clean, modern look
- **Clarity:** Easy to distinguish elements
- **Flexibility:** Works on any background
- **Accessibility:** High contrast

### Color System
- **Green:** Positive action (available to buy)
- **Yellow:** Active selection (in cart)
- **Grey:** Inactive/unavailable (sold)
- **Purple:** Brand/primary actions
- **Gold:** Premium/VIP elements

---

## 🚀 Production Checklist

Before deploying:

- [ ] Connect to real payment processor (Stripe, PayPal)
- [ ] Add database for seat persistence
- [ ] Implement real-time updates (WebSockets)
- [ ] Add authentication
- [ ] Email confirmation system
- [ ] Generate unique ticket codes
- [ ] Add analytics
- [ ] Error handling
- [ ] Loading states
- [ ] Form validation

---

## 📚 Additional Resources

### shadcn/ui Documentation
- https://ui.shadcn.com/docs

### Tailwind CSS
- https://tailwindcss.com/docs

### Radix UI
- https://www.radix-ui.com/

### Lucide Icons
- https://lucide.dev/

---

## 🎯 Summary

You now have:

✅ **Complete React codebase** with TypeScript
✅ **My exact visual designs** (outlined tables, color-coded seats)
✅ **shadcn UI components** (Button, Dialog)
✅ **Tailwind CSS** styling
✅ **Full ticket system** (designer + selling modes)
✅ **Shopping cart** with checkout
✅ **All special areas** (Stage, Dance Floor, Bar, etc.)

All the design code is in the components - just copy and use! 🎉

---

## 💡 Quick Tips

1. **Start Simple:** Begin with just round tables
2. **Test Mobile:** Check responsive design
3. **Customize Colors:** Change in one place (Seat.tsx)
4. **Add Features:** Build on the foundation
5. **Use TypeScript:** Catches errors early

---

Happy coding! 🎟️✨
