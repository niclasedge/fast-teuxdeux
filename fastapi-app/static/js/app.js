// TeuxDeux Clone JavaScript Application
class TeuxDeuxApp {
    constructor() {
        this.apiBase = '/api/v1';
        this.dashboardData = null;
        this.selectedColor = '#6b46c1';
        this.activeCategory = null;
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadDashboard();
        this.setupDragAndDrop();
    }

    bindEvents() {
        // Navigation buttons
        document.getElementById('today-btn').addEventListener('click', () => this.scrollToToday());
        document.getElementById('migrate-btn').addEventListener('click', () => this.migratePastTodos());
        
        // Modal events
        document.getElementById('new-category-btn').addEventListener('click', () => this.openCategoryModal());
        document.getElementById('close-modal').addEventListener('click', () => this.closeCategoryModal());
        document.getElementById('cancel-category').addEventListener('click', () => this.closeCategoryModal());
        document.getElementById('save-category').addEventListener('click', () => this.saveCategory());
        
        // Color picker
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectColor(e.target.dataset.color));
        });

        // Close modal on backdrop click
        document.getElementById('category-modal').addEventListener('click', (e) => {
            if (e.target.id === 'category-modal') {
                this.closeCategoryModal();
            }
        });

        // Enter key for category name
        document.getElementById('category-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveCategory();
            }
        });
    }

    async loadDashboard() {
        this.showLoading(true);
        try {
            const response = await fetch(`${this.apiBase}/dashboard`);
            const result = await response.json();
            
            if (result.success) {
                this.dashboardData = result.data;
                this.renderWeeklyView();
                this.renderSomedayLists();
            } else {
                this.showMessage('Failed to load dashboard: ' + result.error, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to load dashboard: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderWeeklyView() {
        const container = document.getElementById('weekly-container');
        container.innerHTML = '';

        this.dashboardData.weekly_todos.forEach((day, index) => {
            const dayElement = this.createDayColumn(day, index === 0);
            container.appendChild(dayElement);
        });
    }

    createDayColumn(dayData, isToday = false) {
        const dayColumn = document.createElement('div');
        dayColumn.className = `day-column ${isToday ? 'today' : ''}`;
        dayColumn.dataset.date = dayData.date;

        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';

        const dayName = document.createElement('div');
        dayName.className = 'day-name';
        dayName.textContent = dayData.day;

        const dayDate = document.createElement('div');
        dayDate.className = 'day-date';
        const dateObj = new Date(dayData.date);
        dayDate.textContent = dateObj.getDate();

        dayHeader.appendChild(dayName);
        dayHeader.appendChild(dayDate);

        const dayContent = document.createElement('div');
        dayContent.className = 'day-content';

        // Add existing todos
        dayData.todos.forEach(todo => {
            const todoElement = this.createTodoElement(todo, true);
            dayContent.appendChild(todoElement);
        });

        // Add new todo input
        const newTodo = this.createNewTodoElement(dayData.date);
        dayContent.appendChild(newTodo);

        dayColumn.appendChild(dayHeader);
        dayColumn.appendChild(dayContent);

        return dayColumn;
    }

    createTodoElement(todo, isDated = false) {
        const todoItem = document.createElement('div');
        todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        todoItem.dataset.id = todo.id;
        todoItem.draggable = true;

        const todoText = document.createElement('div');
        todoText.className = 'todo-text';
        todoText.textContent = todo.title;

        todoItem.appendChild(todoText);

        if (todo.category_name) {
            const categoryLabel = document.createElement('div');
            categoryLabel.className = 'todo-category';
            categoryLabel.textContent = todo.category_name;
            categoryLabel.style.color = todo.category_color || '#6b7280';
            todoItem.appendChild(categoryLabel);
        }

        // Click to toggle completion
        todoItem.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleTodoCompletion(todo.id, !todo.completed);
        });

        // Double click to edit
        todoItem.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.editTodo(todoItem, todo);
        });

        return todoItem;
    }

    createNewTodoElement(date = null) {
        const newTodo = document.createElement('div');
        newTodo.className = 'new-todo';
        newTodo.textContent = '+ Add a todo';

        newTodo.addEventListener('click', () => {
            this.showNewTodoInput(newTodo, date);
        });

        return newTodo;
    }

    showNewTodoInput(element, date) {
        const input = document.createElement('input');
        input.className = 'new-todo-input';
        input.placeholder = 'What needs to be done?';
        input.type = 'text';

        const saveInput = async () => {
            const title = input.value.trim();
            if (title) {
                await this.createTodo(title, date);
                element.style.display = 'block';
                input.remove();
            } else {
                element.style.display = 'block';
                input.remove();
            }
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveInput();
            }
        });

        input.addEventListener('blur', saveInput);

        element.style.display = 'none';
        element.parentNode.insertBefore(input, element);
        input.focus();
    }

    async createTodo(title, scheduledDate = null, categoryId = null) {
        try {
            const payload = {
                title,
                scheduled_date: scheduledDate,
                category_id: categoryId
            };

            const response = await fetch(`${this.apiBase}/todos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadDashboard(); // Reload to show new todo
                this.showMessage('Todo created successfully', 'success');
            } else {
                this.showMessage('Failed to create todo: ' + result.error, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to create todo: ' + error.message, 'error');
        }
    }

    async toggleTodoCompletion(todoId, completed) {
        try {
            const response = await fetch(`${this.apiBase}/todos/${todoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadDashboard(); // Reload to update UI
            } else {
                this.showMessage('Failed to update todo: ' + result.error, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to update todo: ' + error.message, 'error');
        }
    }

    async deleteTodo(todoId) {
        if (!confirm('Delete this todo?')) return;

        try {
            const response = await fetch(`${this.apiBase}/todos/${todoId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadDashboard();
                this.showMessage('Todo deleted', 'success');
            } else {
                this.showMessage('Failed to delete todo: ' + result.error, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to delete todo: ' + error.message, 'error');
        }
    }

    editTodo(element, todo) {
        const input = document.createElement('input');
        input.className = 'new-todo-input';
        input.value = todo.title;
        input.type = 'text';

        const saveEdit = async () => {
            const title = input.value.trim();
            if (title && title !== todo.title) {
                await this.updateTodo(todo.id, { title });
            }
            element.style.display = 'block';
            input.remove();
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            }
            if (e.key === 'Escape') {
                element.style.display = 'block';
                input.remove();
            }
        });

        input.addEventListener('blur', saveEdit);

        element.style.display = 'none';
        element.parentNode.insertBefore(input, element);
        input.focus();
        input.select();
    }

    async updateTodo(todoId, updates) {
        try {
            const response = await fetch(`${this.apiBase}/todos/${todoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadDashboard();
            } else {
                this.showMessage('Failed to update todo: ' + result.error, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to update todo: ' + error.message, 'error');
        }
    }

    renderSomedayLists() {
        const tabsContainer = document.getElementById('category-tabs');
        const listsContainer = document.getElementById('someday-lists');
        
        tabsContainer.innerHTML = '';
        listsContainer.innerHTML = '';

        if (!this.dashboardData.categories.length) {
            listsContainer.innerHTML = '<p>No categories yet. Create your first list!</p>';
            return;
        }

        // Render category tabs
        this.dashboardData.categories.forEach((category, index) => {
            const tab = document.createElement('button');
            tab.className = `category-tab ${index === 0 && !this.activeCategory ? 'active' : ''}`;
            tab.dataset.categoryId = category.id;
            tab.textContent = category.name;
            tab.style.borderColor = category.color;
            
            if (tab.classList.contains('active')) {
                this.activeCategory = category.id;
            }

            tab.addEventListener('click', () => this.switchCategory(category.id));
            tabsContainer.appendChild(tab);
        });

        // Render active category todos
        this.renderSomedayCategory();
    }

    renderSomedayCategory() {
        const listsContainer = document.getElementById('someday-lists');
        listsContainer.innerHTML = '';

        if (!this.activeCategory) {
            this.activeCategory = this.dashboardData.categories[0]?.id;
        }

        const category = this.dashboardData.categories.find(c => c.id === this.activeCategory);
        if (!category) return;

        const categoryTodos = this.dashboardData.someday_todos.filter(t => 
            t.category_id && t.category_id === this.activeCategory
        );

        const listElement = document.createElement('div');
        listElement.className = 'someday-list';

        const title = document.createElement('div');
        title.className = 'someday-list-title';
        title.textContent = category.name;
        title.style.borderColor = category.color;
        title.style.color = category.color;

        listElement.appendChild(title);

        // Add todos
        categoryTodos.forEach(todo => {
            const todoElement = this.createSomedayTodoElement(todo);
            listElement.appendChild(todoElement);
        });

        // Add new todo input
        const newTodo = this.createSomedayNewTodoElement(this.activeCategory);
        listElement.appendChild(newTodo);

        listsContainer.appendChild(listElement);
    }

    createSomedayTodoElement(todo) {
        const todoItem = document.createElement('div');
        todoItem.className = `someday-todo-item ${todo.completed ? 'completed' : ''}`;
        todoItem.dataset.id = todo.id;

        const todoText = document.createElement('div');
        todoText.className = 'todo-text';
        todoText.textContent = todo.title;

        todoItem.appendChild(todoText);

        // Click to toggle completion
        todoItem.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleTodoCompletion(todo.id, !todo.completed);
        });

        // Double click to edit
        todoItem.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.editTodo(todoItem, todo);
        });

        return todoItem;
    }

    createSomedayNewTodoElement(categoryId) {
        const newTodo = document.createElement('div');
        newTodo.className = 'new-todo';
        newTodo.textContent = '+ Add an item';

        newTodo.addEventListener('click', () => {
            this.showSomedayNewTodoInput(newTodo, categoryId);
        });

        return newTodo;
    }

    showSomedayNewTodoInput(element, categoryId) {
        const input = document.createElement('input');
        input.className = 'new-todo-input';
        input.placeholder = 'What do you want to remember?';
        input.type = 'text';

        const saveInput = async () => {
            const title = input.value.trim();
            if (title) {
                await this.createTodo(title, null, categoryId);
                element.style.display = 'block';
                input.remove();
            } else {
                element.style.display = 'block';
                input.remove();
            }
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveInput();
            }
        });

        input.addEventListener('blur', saveInput);

        element.style.display = 'none';
        element.parentNode.insertBefore(input, element);
        input.focus();
    }

    switchCategory(categoryId) {
        // Update active tab
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', parseInt(tab.dataset.categoryId) === categoryId);
        });

        this.activeCategory = categoryId;
        this.renderSomedayCategory();
    }

    scrollToToday() {
        const todayColumn = document.querySelector('.day-column.today');
        if (todayColumn) {
            todayColumn.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
    }

    async migratePastTodos() {
        this.showLoading(true);
        try {
            const response = await fetch(`${this.apiBase}/todos/migrate`, {
                method: 'POST'
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadDashboard();
                this.showMessage(`Migrated ${result.data.migrated_count} todos to today`, 'success');
            } else {
                this.showMessage('Failed to migrate todos: ' + result.error, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to migrate todos: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Category Modal Methods
    openCategoryModal() {
        document.getElementById('category-modal').classList.remove('hidden');
        document.getElementById('category-name').value = '';
        document.getElementById('category-name').focus();
        this.selectColor('#6b46c1'); // Default color
    }

    closeCategoryModal() {
        document.getElementById('category-modal').classList.add('hidden');
    }

    selectColor(color) {
        this.selectedColor = color;
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.color === color);
        });
    }

    async saveCategory() {
        const name = document.getElementById('category-name').value.trim();
        if (!name) {
            this.showMessage('Please enter a category name', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    color: this.selectedColor
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.closeCategoryModal();
                await this.loadDashboard();
                this.showMessage('Category created successfully', 'success');
            } else {
                this.showMessage('Failed to create category: ' + result.error, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to create category: ' + error.message, 'error');
        }
    }

    // Drag and Drop
    setupDragAndDrop() {
        // Will be implemented in next iteration
        console.log('Drag and drop setup - placeholder');
    }

    // Utility Methods
    showLoading(show) {
        document.getElementById('loading').classList.toggle('hidden', !show);
    }

    showMessage(message, type = 'success') {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.classList.remove('hidden');

        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 4000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TeuxDeuxApp();
});