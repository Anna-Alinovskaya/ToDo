class AbstractStore {                       //абстрактный класс  регулирует поведение над  классами Store, StoreLS, StoreJS
    getTask(id) {
        throw new Error('not implemented');
    }

    getTasks() {
        throw new Error('not implemented');
    }

    saveTask(task) {
        throw new Error('not implemented');
    }

    updateTask(task) {
        throw new Error('not implemented');
    }

    deleteTask(task) {
        throw new Error('not implemented');
    }
}

class AbstractRender {
    renderTask(task) {
        throw new Error('not implemented');
    }

    updateTask(task) {
        throw new Error('not implemented');
    }

    destroyTask(task) {
        throw new Error('not implemented');
    }
}

class RealRender extends AbstractRender {
    constructor(taskContainer, errorContainer) {
        super();
        this.taskContainer = taskContainer;
        this.errorContainer = errorContainer;
    }
    set deleteTaskFunction(func) {
        this._deleteTaskFunction = func;
    }

    set toggleTaskFunction(func) {
        this._toggleTaskFunction = func;
    }

    renderTask(task) {

        const li = document.createElement('li');
        const div = document.createElement('div');
        const p = document.createElement('p');
        const divBtnWrapp = document.createElement('div');
        const btnPositive = document.createElement('button');
        const btnNegative = document.createElement('button');

        li.setAttribute('class', 'created-task--item');
        li.setAttribute('id', task.id);
        div.setAttribute('class', 'task');
        p.innerText = task.title;
        p.setAttribute('id', task.id);
        p.setAttribute('class', 'task--content task--content_color');
        divBtnWrapp.setAttribute('class', 'task--action-btn-wrapper');
        btnPositive.innerText = 'Toggle';
        btnPositive.setAttribute('class', 'task--action-btn task--action-btn_positive toggle-btn');
        btnNegative.innerText = 'Delete';
        btnNegative.setAttribute('class', 'task--action-btn task--action-btn_negative delete-btn');

        li.addEventListener('click', (event) => {
            const target = event.target;

            if (target.innerText === "Delete") {
                debugger;
                this._deleteTaskFunction(task);
            } else if (target.innerText === "Toggle") {
                debugger;
                this._toggleTaskFunction(task);
            }
        })

        this.taskContainer.append(li);
        li.append(div);
        div.append(p);
        div.append(divBtnWrapp);
        divBtnWrapp.append(btnPositive);
        divBtnWrapp.append(btnNegative);

    }
    updateTask(task) {
        const div = taskContainer.querySelector(`#${task.id}`);
        div.innerText = task.title;
    }

    destroyTask(task) {
        const div = this.taskContainer.querySelector(`#${task.id}`);
        div.remove();
    }

    renderError(error) {

    }
}

class StoreJS extends AbstractStore {
    constructor() {
        super();
        this._headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Method': 'GET, POST, PUT, DELETE, PATCH'
        }
    }

    async saveTask(task) {
        const response = await fetch(
            `http://localhost:3000/tasks`,
            {
                headers: this._headers,
                method: 'POST',
                body: Task.toJSON(task)
            });
        const taskProto = await response.json();
        return Task.fromJSON(JSON.stringify(taskProto));
    }

    async deleteTask(task) {
        const response = await fetch(`http://localhost:3000/tasks/${task.id}`,
            {
                headers: this._headers,
                method: 'DELETE'
            }
        );
        return await response.json();
    }

    async getTasks() {
        const response = await fetch('http://localhost:3000/tasks');
        const tasks = [];
        let arrOfTasks = await response.json();

        arrOfTasks.forEach(taskProto => {
            tasks.push(Task.fromJSON(JSON.stringify(taskProto)))
        });

        return Promise.resolve(tasks);
    }

    async updateTask(task) {
        const response = await fetch(`http://localhost:3000/tasks/${task.id}`,
            {
                headers: this._headers,
                method: 'PUT',
                body: Task.toJSON(task)
            }
        );
        return await response.json();
    }

}

class StoreLS extends AbstractStore {
    constructor() {
        super();
        this._prefix = 'strLS';
    }

    getTask(id) {

        const key = `${this._prefix}${id}`;
        const taskJson = localStorage.getItem(key);


        if (!taskJson) {
            throw new Error(`there is no task with id= ${id}`);
        }
        let tasks = null;
        try {
            tasks = Task.fromJSON(taskJson);
        } catch (e) {
            throw new Error(`impossible get task with id=${id}`, error.message);
        }
        return Promise.resolve(tasks);

    }

    getTasks() {
        const tasks = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            if (key.includes(this._prefix)) {
                let task = null;
                try {
                    task = Task.fromJSON(localStorage.getItem(key));
                } catch (e) {
                    throw new Error(`impossible get task with id=${id}`, error.message);
                }
                tasks.push(task);
            }
        }
        return Promise.resolve(tasks);

    }

    //сохраним таск в LocalStorage
    saveTask(task) {
        const key = `${this._prefix}${task.id}`;
        const json = Task.toJSON(task);

        localStorage.setItem(key, json);

        let tasks = null;
        try {
            tasks = Task.fromJSON(localStorage.getItem(key));
            ;
        } catch (e) {
            throw new Error(`impossible get task with id=${id}`, error.message);
        }

        return Promise.resolve(tasks);

    }

    deleteTask(task) {
        const currentTask = this.getTask(task.id);
        localStorage.removeItem(`${this.prefix}${currentTask.id}`);
        return Promise.resolve({});
    }

    async updateTask(task) {
        await this.deleteTask(task);
        return this.saveTask(task);
    }
}

class Store extends AbstractStore {
    constructor() {
        super();
        this._storage = [];
    }

    //прокидывание ошибки
    getTask(id) {
        const task = this._storage.find(task => task.id === id);
        if (!task) {
            throw new Error(`there is no task with id= ${id}`);
        }
        return Promise.resolve(task.copy());
    }

    saveTask(task) {
        this._storage.push(task);
        return Promise.resolve(task.copy());
    }

    getTasks() {
        return Promise.all(this._storage.map(task => this.getTask(task.id)));
    }

    deleteTask(task) {
        const currentTask = this.getTask(task.id);
        this._storage = this._storage.filter(data => data.id !== currentTask.id);

        return Promise.resolve({});
    }

    async updateTask(task) {
        await this.deleteTask(task);
        return this.saveTask(task);
    }

}

class Task {
    constructor(
        id,
        title,
        isDone = false,
        creationMoment = Date.now()
    ) {
        this._id = id;
        this._title = title;
        this._isDone = isDone;
        this._creationMoment = creationMoment;
    }

    get id() {
        return this._id;
    }

    get title() {
        return this._title;
    }

    get isDone() {
        return this._isDone;
    }

    get creationMoment() {
        return this._creationMoment;
    }

    toggle() {
        this._isDone = !this._isDone;
    }

    copy() {
        return new Task(
            this.id,
            this.title,
            this.isDone,
            this.creationMoment
        );
    }

    static toJSON(task) {
        return JSON.stringify({
            id: task.id,
            title: task.title,
            isDone: task.isDone,
            creationMoment: task.creationMoment
        });
    }

    static fromJSON(json) {
        let obj = null;
        try {
            obj = JSON.parse(json);
        } catch (e) {
            throw new Error(`invalid JSON : ${json}`, error.message);
        }
        return new Task(
            obj.id,
            obj.title,
            obj.isDone,
            obj.creationMoment
        );
    }
}

class TaskManager {
    constructor(store) {
        if (!(store instanceof AbstractStore)) {
            throw new Error('store should implements AbstractStore interface');
        }
        this._store = store;
    }

    getTasks() {
        return this._store.getTasks();
    }

    createTask(title) {
        const id = 'id' + Math.random().toString(36).substr(2, 16);
        const task = new Task(id, title);
        return this._store.saveTask(task);
    }

    deleteTask(task) {
        /*
        document.querySelector('.toggle-btn').addEventListener('click', () =>{
            render.destroyTask({ title: 'test 1', id: 'test0' });
            })*/
        return this._store.deleteTask(task);

    }

    toggleTask(task) {
        /*
        document.querySelector('.toggle-btn').addEventListener('click', () =>{
            render.updateTask({ title: 'test 1', id: 'test0' });
            })
        task.toggle();*/
        return this._store.updateTask(task);

    }

}

class TODO {
    constructor(taskManager, render) {
        this._taskManager = taskManager;
        this._render = render;
    }

    async init() {
        const tasks = await this._taskManager.getTasks();
        tasks.forEach(task => {
            this._render.renderTask(task);
        });
    }

    async deleteTask(task) {
        // const task = await this._taskManager.deleteTask(task);
        this._render.destroyTask(task);
    }

    async addTask(title) {
        const task = await this._taskManager.createTask(title);
        this._render.renderTask(task);
    }

    async deleteAllTask() {
        const tasks = await this._taskManager.getTasks();
        tasks.forEach(async tasks => {
            this._render.destroyTask(await this._taskManager.deleteTask(tasks));
        });
    }

    async toggleAllTask() {
        const tasks = await this._taskManager.getTasks();
        tasks.forEach(tasks => {
            this._taskManager.toggleTask(tasks)
                .then(tasks => this._render.renderTask(tasks));
        })
    }
}

class TODOApp {
    execute() {
        const store = new Store();

        const taskManager = new TaskManager(store);

        const taskContainer = document.getElementsByClassName('created-task--item-group')[0];
        const render = new RealRender(taskContainer);

        const todo = new TODO(taskManager, render);

        render.deleteTaskFunction = todo.deleteTask.bind(todo);
        render.toggleTaskFunction = todo.toggleAllTask.bind(todo);

        const titleInputRef = document.getElementById('todo-input');

        document.querySelector('#add-btn').addEventListener('click', () => {
            debugger;
            todo.addTask(titleInputRef.value);
        });

        //todo.init();
    }
}

const app = new TODOApp();
app.execute();