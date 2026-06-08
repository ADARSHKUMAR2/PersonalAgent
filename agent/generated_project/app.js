(function() {
    // Core data model for the application
    class Task {
        constructor(id, text, completed, order) {
            this.id = id;
            this.text = text;
            this.completed = completed;
            this.order = order;
        }
    }

    // Utility: generate a UUID for new tasks
    function generateId() {
        return crypto.randomUUID();
    }

    // Load tasks from localStorage, parsing JSON into Task instances
    function loadTasks() {
        const raw = localStorage.getItem('colorfulTodoTasks');
        if (!raw) { return []; }
        try {
            const parsed = JSON.parse(raw);
            return parsed.map(item => new Task(item.id, item.text, item.completed, item.order));
        } catch (e) {
            console.error('Failed to parse tasks from localStorage', e);
            return [];
        }
    }

    // Save an array of Task instances to localStorage
    function saveTasks(tasks) {
        localStorage.setItem('colorfulTodoTasks', JSON.stringify(tasks));
    }

    // Module‑scoped task list, initialized from storage
    let tasks = loadTasks();

    // Retrieve the current task list (read‑only reference)
    function getTasks() {
        return tasks;
    }

    // Expose the API under a global namespace "ColorfulTodo"
    window.ColorfulTodo = {
        Task,
        generateId,
        loadTasks,
        saveTasks,
        getTasks,
        // Optional internal helper to replace the internal list (used by other modules)
        _setTasks: (newTasks) => { tasks = newTasks; }
    };
})();

// ---------------------------------------------------------------------------
// Existing TodoApp implementation (UI handling). This code remains unchanged
// to preserve the current application behaviour.
(function() {
    // Cache DOM elements
    var todoForm = document.getElementById('todo-form');
    var newTodoInput = document.getElementById('new-todo-input');
    var todoList = document.getElementById('todo-list');
    var filters = document.getElementById('filters');
    var themeToggle = document.getElementById('theme-toggle');

    // Todo data model
    function Todo(id, text, completed, order) {
        this.id = id;
        this.text = text;
        this.completed = completed;
        this.order = order;
    }

    var todos = [];
    var currentFilter = 'all';

    function generateId() {
        return crypto.randomUUID();
    }

    function loadTodos() {
        var data = localStorage.getItem('todos');
        if (data) {
            try {
                var parsed = JSON.parse(data);
                todos = parsed.map(function(item) {
                    return new Todo(item.id, item.text, item.completed, item.order);
                });
                todos.sort(function(a, b) { return a.order - b.order; });
            } catch (e) {
                console.error('Failed to parse todos from localStorage', e);
                todos = [];
            }
        } else {
            todos = [];
        }
    }

    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    // Render todos based on filter (all, active, completed)
    function renderTodos(filter) {
        if (filter === undefined) { filter = 'all'; }
        // Clear existing list
        todoList.innerHTML = '';
        // Ensure todos are sorted by order
        todos.sort(function(a, b) { return a.order - b.order; });
        // Iterate and render
        todos.forEach(function(todo) {
            var shouldShow = (filter === 'all') ||
                (filter === 'active' && !todo.completed) ||
                (filter === 'completed' && todo.completed);
            if (!shouldShow) { return; }
            var li = document.createElement('li');
            li.className = 'todo-item';
            li.dataset.id = todo.id;
            if (todo.completed) { li.classList.add('completed'); }
            var checkbox = '<input type=\'checkbox\' class=\'toggle\'' + (todo.completed ? ' checked' : '') + '>';
            var textSpan = '<span class=\'text\'>' + todo.text + '</span>';
            var editBtn = '<button class=\'edit\'>✎</button>';
            var deleteBtn = '<button class=\'delete\'>✖</button>';
            li.innerHTML = checkbox + textSpan + editBtn + deleteBtn;
            todoList.appendChild(li);
        });
        // Initialize drag and drop if available
        if (typeof attachDragAndDrop === 'function') {
            attachDragAndDrop();
        }
    }

    // Apply filter and update UI
    function applyFilter(filter) {
        currentFilter = filter;
        renderTodos(currentFilter);
        // Update active class on filter buttons
        if (filters) {
            var btns = filters.querySelectorAll('[data-filter]');
            Array.prototype.forEach.call(btns, function(btn) { btn.classList.remove('active'); });
            var activeBtn = filters.querySelector('[data-filter="' + filter + '"]');
            if (activeBtn) { activeBtn.classList.add('active'); }
        }
    }

    // Handler: Add new todo
    function handleAddTodo(event) {
        event.preventDefault();
        var text = newTodoInput.value.trim();
        if (!text) { return; }
        var todo = new Todo(TodoApp._generateId(), text, false, todos.length);
        todos.push(todo);
        newTodoInput.value = '';
        TodoApp._save();
        renderTodos(currentFilter);
    }

    // Handler: Toggle completed status
    function handleToggleComplete(id) {
        var todo = todos.find(function(t) { return t.id === id; });
        if (todo) {
            todo.completed = !todo.completed;
            TodoApp._save();
            renderTodos(currentFilter);
        }
    }

    // Handler: Edit todo text
    function handleEditTodo(id) {
        var li = todoList.querySelector('li[data-id=\'' + id + '\']');
        if (!li) { return; }
        var todo = todos.find(function(t) { return t.id === id; });
        if (!todo) { return; }
        var span = li.querySelector('span.text');
        if (!span) { return; }
        // Create input element
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = todo.text;
        // Replace span with input
        li.replaceChild(input, span);
        input.focus();
        // Helper to save changes
        function saveEdit() {
            var newText = input.value.trim();
            if (newText) {
                todo.text = newText;
                TodoApp._save();
            }
            // Restore span
            span.textContent = todo.text;
            li.replaceChild(span, input);
            renderTodos(currentFilter);
        }
        input.addEventListener('blur', function() {
            saveEdit();
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
        });
    }

    // Handler: Delete todo
    function handleDeleteTodo(id) {
        todos = todos.filter(function(t) { return t.id !== id; });
        // Reassign order values to maintain sequence
        todos.forEach(function(t, index) { t.order = index; });
        TodoApp._save();
        renderTodos(currentFilter);
    }

    // Register event listeners
    function registerEventListeners() {
        todoForm.addEventListener('submit', handleAddTodo);
        todoList.addEventListener('change', function(e) {
            if (e.target && e.target.classList.contains('toggle')) {
                var li = e.target.closest('li');
                var id = li.dataset.id;
                handleToggleComplete(id);
            }
        });
        todoList.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('edit')) {
                var li = e.target.closest('li');
                var id = li.dataset.id;
                handleEditTodo(id);
            } else if (e.target && e.target.classList.contains('delete')) {
                var li = e.target.closest('li');
                var id = li.dataset.id;
                handleDeleteTodo(id);
            }
        });
        // Filter buttons
        if (filters) {
            filters.addEventListener('click', function(e) {
                var target = e.target;
                var filter = target.dataset.filter;
                if (filter) {
                    applyFilter(filter);
                }
            });
        }
    }

    // Core TodoApp object
    var TodoApp = {
        init: function() {
            loadTodos();
            applyFilter('all');
            registerEventListeners();
            console.log('TodoApp initialized');
        },
        getElements: function() {
            return {
                todoForm: todoForm,
                newTodoInput: newTodoInput,
                todoList: todoList,
                filters: filters,
                themeToggle: themeToggle
            };
        },
        // expose for other modules if needed
        _todos: function() { return todos; },
        _save: function() { saveTodos(); },
        _generateId: function() { return generateId(); },
        // expose render for external calls
        render: renderTodos
    };

    // Export to global scope
    window.TodoApp = TodoApp;
})();