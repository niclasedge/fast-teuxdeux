export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  category_id?: { Int64: number; Valid: boolean };
  category_name?: string;
  category_color?: string;
  scheduled_date?: { String: string; Valid: boolean };
  sort_order: number;
  color?: { String: string; Valid: boolean };
  recurring_pattern?: { String: string; Valid: boolean };
  parent_id?: { Int64: number; Valid: boolean };
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyTodos {
  date: string;
  day: string;
  todos: Todo[];
}

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface DashboardData {
  weekly_todos: WeeklyTodos[];
  someday_todos: Todo[];
  categories: Category[];
  today_date: string;
  week_start_date: string;
}