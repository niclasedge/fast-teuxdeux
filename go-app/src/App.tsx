import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, Plus, X, Edit3 } from 'lucide-react'
import { DashboardData, Todo, Category, APIResponse } from './types'

const colorOptions = [
  '#6b46c1', '#059669', '#dc2626', '#7c2d12', '#1d4ed8',
  '#7c3aed', '#0891b2', '#ea580c', '#65a30d'
];

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(colorOptions[0]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTodo, setEditingTodo] = useState<{ todo: Todo; newTitle: string } | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchDashboard();
    
    // Check if mobile on mount and window resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchDashboard = async () => {
    console.log('Fetching dashboard data...');
    try {
      const response = await fetch('/api/v1/dashboard');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiResponse: APIResponse<DashboardData> = await response.json();
      console.log('API response:', apiResponse);
      
      if (apiResponse.success && apiResponse.data) {
        console.log('Setting data:', apiResponse.data);
        setData(apiResponse.data);
        if (apiResponse.data.categories.length > 0 && !selectedCategory) {
          console.log('Setting selected category:', apiResponse.data.categories[0].id);
          setSelectedCategory(apiResponse.data.categories[0].id);
        }
      } else {
        console.error('API Error:', apiResponse.error);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const createTodo = async (title: string, scheduledDate?: string, categoryId?: number) => {
    try {
      const response = await fetch('/api/v1/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          scheduled_date: scheduledDate,
          category_id: categoryId
        })
      });
      
      if (response.ok) {
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    try {
      const response = await fetch(`/api/v1/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed })
      });
      
      if (response.ok) {
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (todoId: number) => {
    try {
      const response = await fetch(`/api/v1/todos/${todoId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const response = await fetch('/api/v1/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          color: newCategoryColor
        })
      });
      
      if (response.ok) {
        setNewCategoryName('');
        setNewCategoryColor(colorOptions[0]);
        setCategoryModalOpen(false);
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const deleteCategory = async (categoryId: number) => {
    try {
      const response = await fetch(`/api/v1/categories/${categoryId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const updateCategory = async (categoryId: number, name: string, color: string) => {
    try {
      const response = await fetch(`/api/v1/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color })
      });
      
      if (response.ok) {
        setEditingCategory(null);
        setNewCategoryName('');
        setNewCategoryColor(colorOptions[0]);
        setCategoryModalOpen(false);
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const updateTodoDate = async (todoId: number, newDate: string | null) => {
    try {
      const payload = newDate ? { scheduled_date: newDate } : { scheduled_date: "" };
      const response = await fetch(`/api/v1/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error updating todo date:', error);
    }
  };

  const updateTodoCategory = async (todoId: number, categoryId: number) => {
    try {
      const response = await fetch(`/api/v1/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId, scheduled_date: "" })
      });
      
      if (response.ok) {
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error updating todo category:', error);
    }
  };

  const startEditTodo = (todo: Todo) => {
    setEditingTodo({ todo, newTitle: todo.title });
  };

  const saveEditTodo = async () => {
    if (!editingTodo || !editingTodo.newTitle.trim()) {
      setEditingTodo(null);
      return;
    }

    try {
      const response = await fetch(`/api/v1/todos/${editingTodo.todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTodo.newTitle.trim() })
      });
      
      if (response.ok) {
        setEditingTodo(null);
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error updating todo title:', error);
      setEditingTodo(null);
    }
  };

  const cancelEditTodo = () => {
    setEditingTodo(null);
  };

  const handleEditKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveEditTodo();
    } else if (e.key === 'Escape') {
      cancelEditTodo();
    }
  };

  const handleDragStart = (e: React.DragEvent, todo: Todo) => {
    setDraggedTodo(todo);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', todo.id.toString());
  };
  
  // Touch event handlers for mobile drag and drop
  const handleTouchStart = (e: React.TouchEvent, todo: Todo) => {
    if (isMobile) {
      setDraggedTodo(todo);
      e.currentTarget.style.opacity = '0.5';
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isMobile && draggedTodo) {
      e.preventDefault();
      const touch = e.touches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Reset all drop zone highlights
      setDragOverDay(null);
      setDragOverCategory(null);
      
      // Find drop zone
      const dayColumn = elementBelow?.closest('[data-date]');
      const categoryColumn = elementBelow?.closest('[data-category-id]');
      
      if (dayColumn) {
        const date = dayColumn.getAttribute('data-date');
        setDragOverDay(date);
      } else if (categoryColumn) {
        const categoryId = categoryColumn.getAttribute('data-category-id');
        setDragOverCategory(parseInt(categoryId || '0'));
      }
    }
  };
  
  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (isMobile && draggedTodo) {
      const touch = e.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      
      const dayColumn = elementBelow?.closest('[data-date]');
      const categoryColumn = elementBelow?.closest('[data-category-id]');
      
      if (dayColumn) {
        const date = dayColumn.getAttribute('data-date');
        if (date) {
          await updateTodoDate(draggedTodo.id, date);
        }
      } else if (categoryColumn) {
        const categoryId = categoryColumn.getAttribute('data-category-id');
        if (categoryId) {
          await updateTodoCategory(draggedTodo.id, parseInt(categoryId));
        }
      }
      
      // Reset states
      setDraggedTodo(null);
      setDragOverDay(null);
      setDragOverCategory(null);
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(date);
  };

  const handleCategoryDragOver = (e: React.DragEvent, categoryId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCategory(categoryId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDay(null);
    setDragOverCategory(null);
  };

  const handleDrop = async (e: React.DragEvent, date: string) => {
    e.preventDefault();
    setDragOverDay(null);
    
    if (draggedTodo) {
      await updateTodoDate(draggedTodo.id, date);
      setDraggedTodo(null);
    }
  };

  const handleCategoryDrop = async (e: React.DragEvent, categoryId: number) => {
    e.preventDefault();
    setDragOverCategory(null);
    
    if (draggedTodo) {
      await updateTodoCategory(draggedTodo.id, categoryId);
      setDraggedTodo(null);
    }
  };

  const handleCategorySubmit = () => {
    if (editingCategory) {
      updateCategory(editingCategory.id, newCategoryName, newCategoryColor);
    } else {
      createCategory();
    }
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setCategoryModalOpen(true);
  };

  const migratePastTodos = async () => {
    try {
      const response = await fetch('/api/v1/todos/migrate', {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error migrating todos:', error);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newOffset = direction === 'next' ? weekOffset + 7 : weekOffset - 7;
    setWeekOffset(newOffset);
    fetchDashboardForWeek(newOffset);
  };

  const goToToday = () => {
    setWeekOffset(0);
    fetchDashboard();
  };

  const fetchDashboardForWeek = async (offset: number) => {
    console.log('Fetching dashboard for week offset:', offset);
    try {
      const response = await fetch(`/api/v1/dashboard?weekOffset=${offset}`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiResponse: APIResponse<DashboardData> = await response.json();
      console.log('API response:', apiResponse);
      
      if (apiResponse.success && apiResponse.data) {
        console.log('Setting data:', apiResponse.data);
        setData(apiResponse.data);
        if (apiResponse.data.categories.length > 0 && !selectedCategory) {
          console.log('Setting selected category:', apiResponse.data.categories[0].id);
          setSelectedCategory(apiResponse.data.categories[0].id);
        }
      } else {
        console.error('API Error:', apiResponse.error);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const getCalendarWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const handleNewTodoKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, date?: string, categoryId?: number) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      const title = target.value.trim();
      if (title) {
        createTodo(title, date, categoryId);
        target.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <div className="text-sm text-gray-400 mb-2">Loading TeuxDeux...</div>
          <div className="text-xs text-gray-500">
            Check browser console for debug info
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-400 mb-2">Failed to load data</div>
          <button 
            onClick={fetchDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const today = data.today_date;
  const selectedCategoryData = data.categories.find(c => c.id === selectedCategory);
  
  // Group someday todos by category
  const somedayTodosByCategory = data.someday_todos.reduce((acc, todo) => {
    const categoryId = todo.category_id?.Valid ? todo.category_id.Int64 : 0;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(todo);
    return acc;
  }, {} as { [key: number]: Todo[] });

  return (
    <div className="sm:min-h-screen bg-gray-900 font-mono text-gray-100">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-2 py-2">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-100">
              {data && data.weekly_todos.length > 0 && 
                new Date(data.weekly_todos[0].date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              }
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-700 rounded-full text-gray-400 touch-manipulation"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-700 rounded-full text-gray-400 touch-manipulation"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <div className="w-full">
        {/* Weekly View */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-0 border-t border-gray-700">
          {data.weekly_todos.map((day, index) => {
            const dayDate = new Date(day.date);
            const isToday = day.date === today;
            const dayNum = dayDate.getDate();
            const monthAbbr = dayDate.toLocaleDateString('en-US', { month: 'short' });
            const dayAbbr = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
            const isMonday = dayDate.getDay() === 1;
            const isSaturday = dayDate.getDay() === 6;
            const isSunday = dayDate.getDay() === 0;
            const weekNumber = isMonday ? getCalendarWeek(dayDate) : null;
            
            // Skip Sunday as it will be combined with Saturday
            if (isSunday) return null;
            
            // Find Sunday for Saturday column
            const sundayDay = isSaturday ? data.weekly_todos.find(d => new Date(d.date).getDay() === 0) : null;
            
            return (
              <div 
                key={day.date} 
                data-date={day.date}
                className={`border-r border-gray-700 last:border-r-0 sm:min-h-[600px] ${
                  dragOverDay === day.date ? 'bg-gray-800' : 'bg-gray-900'
                }`}
                onDragOver={(e) => handleDragOver(e, day.date)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day.date)}
              >
                {isSaturday ? (
                  // Combined Saturday/Sunday column
                  <div>
                    {/* Saturday Header */}
                    <div className="p-1 border-b border-gray-700">
                      <div className="flex flex-col items-start">
                        <div className={`text-sm font-bold ${day.date === today ? 'text-blue-400' : 'text-gray-100'}`}>
                          {dayNum} {monthAbbr}. {dayAbbr}
                        </div>
                      </div>
                    </div>
                    {/* Saturday Todos */}
                    <div className="p-1 space-y-1 border-b border-gray-600">
                      {day.todos?.map((todo) => (
                        <div
                          key={todo.id}
                          className={`group cursor-move touch-manipulation ${
                            draggedTodo?.id === todo.id ? 'opacity-50' : ''
                          }`}
                          draggable={editingTodo?.todo.id !== todo.id}
                          onDragStart={(e) => handleDragStart(e, todo)}
                          onTouchStart={(e) => handleTouchStart(e, todo)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                        >
                          <div className="flex items-center gap-1">
                            {editingTodo?.todo.id === todo.id ? (
                              <input
                                type="text"
                                value={editingTodo.newTitle}
                                onChange={(e) => setEditingTodo({ ...editingTodo, newTitle: e.target.value })}
                                onKeyDown={handleEditKeyPress}
                                onBlur={saveEditTodo}
                                className="flex-grow text-sm bg-gray-800 border border-blue-500 rounded px-1 py-1 text-gray-100 focus:outline-none focus:border-blue-400"
                                autoFocus
                              />
                            ) : (
                              <div className="flex-grow min-w-0">
                                <div
                                  className={`text-sm cursor-pointer py-1 px-1 rounded hover:bg-gray-800 break-words leading-tight ${
                                    todo.completed 
                                      ? 'text-gray-500 line-through' 
                                      : 'text-gray-100'
                                  }`}
                                  onClick={() => toggleTodo(todo)}
                                  onDoubleClick={() => startEditTodo(todo)}
                                >
                                  {todo.title}
                                </div>
                              </div>
                            )}
                            
                            <div className={`flex gap-0.5 transition-all ${
                              isMobile 
                                ? 'opacity-100' 
                                : 'w-0 opacity-0 overflow-hidden group-hover:w-auto group-hover:opacity-100'
                            }`}>
                              <button
                                onClick={() => startEditTodo(todo)}
                                className="flex-shrink-0 w-5 h-5 text-gray-400 hover:text-blue-400 transition-all touch-manipulation flex items-center justify-center"
                                title="Edit todo"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteTodo(todo.id)}
                                className="flex-shrink-0 w-5 h-5 text-gray-400 hover:text-red-400 transition-all touch-manipulation flex items-center justify-center"
                                title="Delete todo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )) || []}
                      <div className="mt-1">
                        <input
                          type="text"
                          placeholder="Add Saturday todo..."
                          className="w-full text-xs bg-transparent border-none outline-none placeholder-gray-500 text-gray-300 py-1 hover:bg-gray-800 rounded px-1 touch-manipulation"
                          onKeyPress={(e) => handleNewTodoKeyPress(e, day.date)}
                        />
                      </div>
                    </div>
                    
                    {/* Sunday Header */}
                    {sundayDay && (
                      <>
                        <div className="p-1 border-b border-gray-700">
                          <div className="flex flex-col items-start">
                            <div className={`text-sm font-bold ${sundayDay.date === today ? 'text-blue-400' : 'text-gray-100'}`}>
                              {new Date(sundayDay.date).getDate()} {new Date(sundayDay.date).toLocaleDateString('en-US', { month: 'short' })}. So
                            </div>
                          </div>
                        </div>
                        {/* Sunday Todos */}
                        <div className="p-1 space-y-1">
                          {sundayDay.todos?.map((todo) => (
                            <div
                              key={todo.id}
                              className={`group cursor-move touch-manipulation ${
                                draggedTodo?.id === todo.id ? 'opacity-50' : ''
                              }`}
                              draggable={editingTodo?.todo.id !== todo.id}
                              onDragStart={(e) => handleDragStart(e, todo)}
                              onTouchStart={(e) => handleTouchStart(e, todo)}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                            >
                              <div className="flex items-center gap-1">
                                {editingTodo?.todo.id === todo.id ? (
                                  <input
                                    type="text"
                                    value={editingTodo.newTitle}
                                    onChange={(e) => setEditingTodo({ ...editingTodo, newTitle: e.target.value })}
                                    onKeyDown={handleEditKeyPress}
                                    onBlur={saveEditTodo}
                                    className="flex-grow text-sm bg-gray-800 border border-blue-500 rounded px-1 py-1 text-gray-100 focus:outline-none focus:border-blue-400"
                                    autoFocus
                                  />
                                ) : (
                                  <div className="flex-grow min-w-0">
                                    <div
                                      className={`text-sm cursor-pointer py-1 px-1 rounded hover:bg-gray-800 break-words leading-tight ${
                                        todo.completed 
                                          ? 'text-gray-500 line-through' 
                                          : 'text-gray-100'
                                      }`}
                                      onClick={() => toggleTodo(todo)}
                                      onDoubleClick={() => startEditTodo(todo)}
                                    >
                                      {todo.title}
                                    </div>
                                  </div>
                                )}
                                
                                <div className={`flex gap-0.5 transition-all ${
                                  isMobile 
                                    ? 'opacity-100' 
                                    : 'w-0 opacity-0 overflow-hidden group-hover:w-auto group-hover:opacity-100'
                                }`}>
                                  <button
                                    onClick={() => startEditTodo(todo)}
                                    className="flex-shrink-0 w-5 h-5 text-gray-400 hover:text-blue-400 transition-all touch-manipulation flex items-center justify-center"
                                    title="Edit todo"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteTodo(todo.id)}
                                    className="flex-shrink-0 w-5 h-5 text-gray-400 hover:text-red-400 transition-all touch-manipulation flex items-center justify-center"
                                    title="Delete todo"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )) || []}
                          <div className="mt-1">
                            <input
                              type="text"
                              placeholder="Add Sunday todo..."
                              className="w-full text-xs bg-transparent border-none outline-none placeholder-gray-500 text-gray-300 py-1 hover:bg-gray-800 rounded px-1 touch-manipulation"
                              onKeyPress={(e) => handleNewTodoKeyPress(e, sundayDay.date)}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  // Regular weekday column (Monday-Friday)
                  <div>
                    <div className="p-1 border-b border-gray-700">
                      <div className="flex flex-col items-start">
                        <div className={`text-sm font-bold ${isToday ? 'text-blue-400' : 'text-gray-100'}`}>
                          {dayNum} {monthAbbr}. {dayAbbr}
                          {weekNumber && <span className="text-xs text-gray-400 ml-1">KW{weekNumber}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="p-1 space-y-1">
                      {day.todos?.map((todo) => (
                        <div
                          key={todo.id}
                          className={`group cursor-move touch-manipulation ${
                            draggedTodo?.id === todo.id ? 'opacity-50' : ''
                          }`}
                          draggable={editingTodo?.todo.id !== todo.id}
                          onDragStart={(e) => handleDragStart(e, todo)}
                          onTouchStart={(e) => handleTouchStart(e, todo)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                        >
                          <div className="flex items-center gap-1">
                            {editingTodo?.todo.id === todo.id ? (
                              <input
                                type="text"
                                value={editingTodo.newTitle}
                                onChange={(e) => setEditingTodo({ ...editingTodo, newTitle: e.target.value })}
                                onKeyDown={handleEditKeyPress}
                                onBlur={saveEditTodo}
                                className="flex-grow text-sm bg-gray-800 border border-blue-500 rounded px-1 py-1 text-gray-100 focus:outline-none focus:border-blue-400"
                                autoFocus
                              />
                            ) : (
                              <div className="flex-grow min-w-0">
                                <div
                                  className={`text-sm cursor-pointer py-1 px-1 rounded hover:bg-gray-800 break-words leading-tight ${
                                    todo.completed 
                                      ? 'text-gray-500 line-through' 
                                      : 'text-gray-100'
                                  }`}
                                  onClick={() => toggleTodo(todo)}
                                  onDoubleClick={() => startEditTodo(todo)}
                                >
                                  {todo.title}
                                </div>
                              </div>
                            )}
                            
                            <div className={`flex gap-0.5 transition-all ${
                              isMobile 
                                ? 'opacity-100' 
                                : 'w-0 opacity-0 overflow-hidden group-hover:w-auto group-hover:opacity-100'
                            }`}>
                              <button
                                onClick={() => startEditTodo(todo)}
                                className="flex-shrink-0 w-5 h-5 text-gray-400 hover:text-blue-400 transition-all touch-manipulation flex items-center justify-center"
                                title="Edit todo"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteTodo(todo.id)}
                                className="flex-shrink-0 w-5 h-5 text-gray-400 hover:text-red-400 transition-all touch-manipulation flex items-center justify-center"
                                title="Delete todo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )) || []}
                      <div className="mt-1">
                        <input
                          type="text"
                          placeholder="Add a todo..."
                          className="w-full text-xs bg-transparent border-none outline-none placeholder-gray-500 text-gray-300 py-1 hover:bg-gray-800 rounded px-1 touch-manipulation"
                          onKeyPress={(e) => handleNewTodoKeyPress(e, day.date)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Categories Section */}
        <div className="bg-gray-900 border-t border-gray-700 mt-8">
          <div className="grid grid-cols-5 gap-0">{/* Updated to show fewer categories inline */}
            {data.categories.slice(0, 5).map((category, index) => {
              const categoryTodos = somedayTodosByCategory[category.id] || [];
              return (
                <div 
                  key={category.id} 
                  data-category-id={category.id}
                  className={`border-r border-gray-700 last:border-r-0 min-h-[400px] bg-gray-900 ${
                    dragOverCategory === category.id ? 'bg-gray-800' : ''
                  }`}
                  onDragOver={(e) => handleCategoryDragOver(e, category.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleCategoryDrop(e, category.id)}
                >
                  <div className="p-1 border-b border-gray-700 group relative">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="text-sm font-medium text-gray-100">
                        {category.name}
                      </div>
                    </div>
                    <div className={`absolute top-2 right-2 flex gap-1 transition-opacity ${
                      isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <button
                        onClick={() => openEditCategory(category)}
                        className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors flex items-center justify-center"
                        title="Edit category"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                        title="Delete category"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="p-1 space-y-1">
                    {categoryTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className={`group cursor-move touch-manipulation ${
                          draggedTodo?.id === todo.id ? 'opacity-50' : ''
                        }`}
                        draggable={editingTodo?.todo.id !== todo.id}
                        onDragStart={(e) => handleDragStart(e, todo)}
                        onTouchStart={(e) => handleTouchStart(e, todo)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        <div className="flex items-center gap-1">
                          
                          {editingTodo?.todo.id === todo.id ? (
                            <input
                              type="text"
                              value={editingTodo.newTitle}
                              onChange={(e) => setEditingTodo({ ...editingTodo, newTitle: e.target.value })}
                              onKeyDown={handleEditKeyPress}
                              onBlur={saveEditTodo}
                              className="flex-grow text-sm bg-gray-800 border border-blue-500 rounded px-1 py-1 text-gray-100 focus:outline-none focus:border-blue-400"
                              autoFocus
                            />
                          ) : (
                            <div className="flex-grow min-w-0">
                              <div
                                className={`text-sm cursor-pointer py-1 px-1 rounded hover:bg-gray-800 break-words leading-tight ${
                                  todo.completed 
                                    ? 'text-gray-500 line-through' 
                                    : 'text-gray-100'
                                }`}
                                onClick={() => toggleTodo(todo)}
                                onDoubleClick={() => startEditTodo(todo)}
                              >
                                {todo.title}
                              </div>
                            </div>
                          )}
                          
                          <div className={`flex gap-0.5 transition-all ${
                            isMobile 
                              ? 'opacity-100' 
                              : 'w-0 opacity-0 overflow-hidden group-hover:w-auto group-hover:opacity-100'
                          }`}>
                            <button
                              onClick={() => startEditTodo(todo)}
                              className="flex-shrink-0 w-5 h-5 text-gray-400 hover:text-blue-400 transition-all touch-manipulation flex items-center justify-center"
                              title="Edit todo"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteTodo(todo.id)}
                              className="flex-shrink-0 w-5 h-5 text-gray-400 hover:text-red-400 transition-all touch-manipulation flex items-center justify-center"
                              title="Delete todo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-1">
                      <input
                        type="text"
                        placeholder="Add item..."
                        className="w-full text-xs bg-transparent border-none outline-none placeholder-gray-500 text-gray-300 py-1 hover:bg-gray-800 rounded px-1 touch-manipulation"
                        onKeyPress={(e) => handleNewTodoKeyPress(e, undefined, category.id)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Hidden dialogs for new categories */}
      <Dialog open={categoryModalOpen} onOpenChange={(open) => {
        setCategoryModalOpen(open);
        if (!open) {
          setEditingCategory(null);
          setNewCategoryName('');
          setNewCategoryColor(colorOptions[0]);
        }
      }}>
        <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-100">
              {editingCategory ? 'Edit List' : 'New List'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name" className="text-gray-300">List name</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="List name"
                maxLength={50}
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
              />
            </div>
            <div>
              <Label className="text-gray-300">Color</Label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCategoryColor(color)}
                    className={`w-8 h-8 rounded-md border-2 ${
                      newCategoryColor === color ? 'border-gray-400 scale-110' : 'border-transparent'
                    } transition-all`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryModalOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancel
            </Button>
            <Button onClick={handleCategorySubmit} className="bg-blue-600 hover:bg-blue-500 text-white">
              {editingCategory ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;