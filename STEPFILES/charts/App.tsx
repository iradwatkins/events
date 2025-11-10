// App.tsx
import React, { useState } from 'react';
import { RoundTable } from './components/tables/RoundTable';
import { RectangleTable } from './components/tables/RectangleTable';
import { Stage, DanceFloor, Bar, BuffetTable, Entrance } from './components/tables/SpecialAreas';
import { ShoppingCart } from './components/ShoppingCart';
import { Button } from './components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './components/ui/dialog';
import { Palette, ShoppingBag, Save, Trash2, Download } from 'lucide-react';

interface Table {
  id: number;
  type: 'round-8' | 'round-10' | 'round-12' | 'vip' | 'rect-6' | 'rect-8' | 'stage' | 'dancefloor' | 'bar' | 'buffet' | 'entrance';
  x: number;
  y: number;
}

interface CartItem {
  id: string;
  tableId: number;
  seatNumber: number;
  type: 'regular' | 'vip';
  price: number;
}

interface SoldSeats {
  [tableId: number]: number[];
}

function App() {
  const [mode, setMode] = useState<'designer' | 'selling'>('designer');
  const [tables, setTables] = useState<Table[]>([]);
  const [tableIdCounter, setTableIdCounter] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [soldSeats, setSoldSeats] = useState<SoldSeats>({});
  const [regularPrice, setRegularPrice] = useState(50);
  const [vipPrice, setVipPrice] = useState(100);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: ''
  });

  // Add table to floor plan
  const addTable = (type: Table['type'], x: number, y: number) => {
    const newTable: Table = {
      id: tableIdCounter,
      type,
      x,
      y
    };
    setTables([...tables, newTable]);
    setTableIdCounter(tableIdCounter + 1);
  };

  // Delete table
  const deleteTable = (id: number) => {
    setTables(tables.filter(t => t.id !== id));
    delete soldSeats[id];
    setSoldSeats({ ...soldSeats });
  };

  // Handle seat click
  const handleSeatClick = (tableId: number, seatNumber: number) => {
    const seatId = `${tableId}-${seatNumber}`;
    
    // Check if already in cart
    const existingIndex = cart.findIndex(item => item.id === seatId);
    
    if (existingIndex >= 0) {
      // Remove from cart
      setCart(cart.filter((_, index) => index !== existingIndex));
    } else {
      // Add to cart
      const table = tables.find(t => t.id === tableId);
      const isVIP = table?.type === 'vip';
      const price = isVIP ? vipPrice : regularPrice;
      
      setCart([...cart, {
        id: seatId,
        tableId,
        seatNumber,
        type: isVIP ? 'vip' : 'regular',
        price
      }]);
    }
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Clear cart
  const clearCart = () => {
    if (cart.length > 0 && confirm('Clear cart?')) {
      setCart([]);
    }
  };

  // Complete purchase
  const completePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark seats as sold
    const newSoldSeats = { ...soldSeats };
    cart.forEach(item => {
      if (!newSoldSeats[item.tableId]) {
        newSoldSeats[item.tableId] = [];
      }
      newSoldSeats[item.tableId].push(item.seatNumber);
    });
    setSoldSeats(newSoldSeats);
    
    // Clear cart
    setCart([]);
    setIsCheckoutOpen(false);
    
    // Reset form
    setCheckoutForm({ name: '', email: '', phone: '', paymentMethod: '' });
    
    // Show success
    const total = cart.reduce((sum, item) => sum + item.price, 0) * 1.1;
    alert(`✅ Purchase Complete!\n\nTotal: $${total.toFixed(2)}\nConfirmation sent to ${checkoutForm.email}`);
  };

  // Get selected seats for a table
  const getSelectedSeats = (tableId: number): number[] => {
    return cart
      .filter(item => item.tableId === tableId)
      .map(item => item.seatNumber);
  };

  // Get sold seats for a table
  const getSoldSeats = (tableId: number): number[] => {
    return soldSeats[tableId] || [];
  };

  // Clear all tables
  const clearFloorPlan = () => {
    if (confirm('Clear all tables?')) {
      setTables([]);
      setTableIdCounter(1);
    }
  };

  // Stats
  const totalTables = tables.filter(t => !['stage', 'dancefloor', 'bar', 'buffet', 'entrance'].includes(t.type)).length;
  const totalSeats = tables.reduce((sum, t) => {
    if (t.type === 'round-8' || t.type === 'vip') return sum + 8;
    if (t.type === 'round-10') return sum + 10;
    if (t.type === 'round-12') return sum + 12;
    if (t.type === 'rect-6') return sum + 6;
    if (t.type === 'rect-8') return sum + 8;
    return sum;
  }, 0);

  const renderTable = (table: Table) => {
    const commonProps = {
      key: table.id,
      x: table.x,
      y: table.y,
      isDesignerMode: mode === 'designer',
      onDelete: () => deleteTable(table.id)
    };

    switch (table.type) {
      case 'round-8':
        return (
          <RoundTable
            {...commonProps}
            tableId={table.id}
            seats={8}
            type="regular"
            onSeatClick={handleSeatClick}
            soldSeats={getSoldSeats(table.id)}
            selectedSeats={getSelectedSeats(table.id)}
          />
        );
      case 'round-10':
        return (
          <RoundTable
            {...commonProps}
            tableId={table.id}
            seats={10}
            type="regular"
            onSeatClick={handleSeatClick}
            soldSeats={getSoldSeats(table.id)}
            selectedSeats={getSelectedSeats(table.id)}
          />
        );
      case 'round-12':
        return (
          <RoundTable
            {...commonProps}
            tableId={table.id}
            seats={12}
            type="regular"
            onSeatClick={handleSeatClick}
            soldSeats={getSoldSeats(table.id)}
            selectedSeats={getSelectedSeats(table.id)}
          />
        );
      case 'vip':
        return (
          <RoundTable
            {...commonProps}
            tableId={table.id}
            seats={8}
            type="vip"
            onSeatClick={handleSeatClick}
            soldSeats={getSoldSeats(table.id)}
            selectedSeats={getSelectedSeats(table.id)}
          />
        );
      case 'rect-6':
        return (
          <RectangleTable
            {...commonProps}
            tableId={table.id}
            seats={6}
            onSeatClick={handleSeatClick}
            soldSeats={getSoldSeats(table.id)}
            selectedSeats={getSelectedSeats(table.id)}
          />
        );
      case 'rect-8':
        return (
          <RectangleTable
            {...commonProps}
            tableId={table.id}
            seats={8}
            onSeatClick={handleSeatClick}
            soldSeats={getSoldSeats(table.id)}
            selectedSeats={getSelectedSeats(table.id)}
          />
        );
      case 'stage':
        return <Stage {...commonProps} />;
      case 'dancefloor':
        return <DanceFloor {...commonProps} />;
      case 'bar':
        return <Bar {...commonProps} />;
      case 'buffet':
        return <BuffetTable {...commonProps} />;
      case 'entrance':
        return <Entrance {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5">
      <div className="max-w-[1900px] mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white p-8 text-center">
          <h1 className="text-4xl font-bold mb-3">🎟️ Complete Ticket System</h1>
          <p className="text-lg opacity-90 mb-6">Design your floor plan • Set prices • Sell tickets</p>
          
          {/* Mode Switcher */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setMode('designer')}
              variant={mode === 'designer' ? 'default' : 'outline'}
              size="lg"
              className={mode === 'designer' ? '' : 'bg-white/20 text-white border-2 border-white hover:bg-white/30'}
            >
              <Palette className="w-5 h-5 mr-2" />
              Designer Mode
            </Button>
            <Button
              onClick={() => setMode('selling')}
              variant={mode === 'selling' ? 'default' : 'outline'}
              size="lg"
              className={mode === 'selling' ? '' : 'bg-white/20 text-white border-2 border-white hover:bg-white/30'}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Selling Mode
            </Button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-[280px_1fr_350px] gap-5 p-5 min-h-[700px]">
          {/* Left Sidebar - Table Library (Designer Mode) */}
          {mode === 'designer' && (
            <div className="bg-gray-50 rounded-2xl p-5 overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-5 pb-4 border-b-2">
                🪑 Table Library
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-primary mb-3">Dining Tables</h4>
                  <div className="space-y-2">
                    {[
                      { type: 'round-8' as const, label: 'Round Table', seats: 8 },
                      { type: 'round-10' as const, label: 'Round Table', seats: 10 },
                      { type: 'round-12' as const, label: 'Round Table', seats: 12 },
                      { type: 'vip' as const, label: 'VIP Table', seats: '8 (Premium)', icon: '👑' },
                      { type: 'rect-6' as const, label: 'Rectangle Table', seats: 6 },
                      { type: 'rect-8' as const, label: 'Rectangle Table', seats: 8 }
                    ].map(item => (
                      <div
                        key={item.type}
                        onClick={() => addTable(item.type, 100, 100)}
                        className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-purple-500 hover:-translate-y-1 transition-all text-center"
                      >
                        <div className="text-2xl mb-2">{item.icon || '⭕'}</div>
                        <div className="font-semibold text-gray-800 text-sm">{item.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.seats} Seats</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-primary mb-3">Special Areas</h4>
                  <div className="space-y-2">
                    {[
                      { type: 'stage' as const, label: 'Stage', icon: '🎭' },
                      { type: 'dancefloor' as const, label: 'Dance Floor', icon: '💃' },
                      { type: 'bar' as const, label: 'Bar', icon: '🍸' },
                      { type: 'buffet' as const, label: 'Buffet', icon: '🍱' },
                      { type: 'entrance' as const, label: 'Entrance', icon: '🚪' }
                    ].map(item => (
                      <div
                        key={item.type}
                        onClick={() => addTable(item.type, 100, 100)}
                        className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-purple-500 hover:-translate-y-1 transition-all text-center"
                      >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <div className="font-semibold text-gray-800 text-sm">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Center - Floor Plan */}
          <div className={mode === 'designer' ? '' : 'col-span-2'}>
            <div className="bg-gray-50 rounded-2xl p-5">
              {/* Controls Bar */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-5 flex justify-between items-center flex-wrap gap-3">
                <div className="flex gap-2">
                  {mode === 'designer' && (
                    <>
                      <Button onClick={clearFloorPlan} variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                      <Button variant="success" size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Save Layout
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </>
                  )}
                </div>

                {mode === 'selling' && (
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-green-500"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-yellow-400"></div>
                      <span>Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-gray-400 opacity-50"></div>
                      <span>Sold</span>
                    </div>
                  </div>
                )}

                <div className="font-semibold text-primary">
                  Tables: {totalTables} | Total Seats: {totalSeats}
                </div>
              </div>

              {/* Floor Plan Canvas */}
              <div className="bg-white min-h-[700px] border-2 border-dashed border-gray-300 rounded-2xl p-5 relative overflow-auto">
                {tables.map(renderTable)}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Shopping Cart */}
          <ShoppingCart
            cart={cart}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onCheckout={() => setIsCheckoutOpen(true)}
            regularPrice={regularPrice}
            vipPrice={vipPrice}
            onPriceChange={(type, value) => {
              if (type === 'regular') setRegularPrice(value);
              else setVipPrice(value);
            }}
            isSellingMode={mode === 'selling'}
          />
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="text-center mb-4">
              <div className="text-6xl mb-3">✅</div>
              <DialogTitle className="text-2xl mb-2">Complete Purchase</DialogTitle>
              <DialogDescription className="text-lg">
                Total: <strong className="text-2xl text-gray-900">
                  ${(cart.reduce((sum, item) => sum + item.price, 0) * 1.1).toFixed(2)}
                </strong>
              </DialogDescription>
            </div>
          </DialogHeader>

          <form onSubmit={completePurchase} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Full Name *</label>
              <input
                type="text"
                required
                value={checkoutForm.name}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Email *</label>
              <input
                type="email"
                required
                value={checkoutForm.email}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Phone *</label>
              <input
                type="tel"
                required
                value={checkoutForm.phone}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Payment Method *</label>
              <select
                required
                value={checkoutForm.paymentMethod}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                <option value="">Select method</option>
                <option value="credit">Credit Card</option>
                <option value="debit">Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            <Button type="submit" className="w-full h-12 text-lg" variant="success">
              <CreditCard className="w-5 h-5 mr-2" />
              Complete Purchase
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
