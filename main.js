//абстрактный класс над Store & StoreLS ктр будет регулировать поведение над  классами Store
class AbstractStore { //класс каk кпример полиморфизма
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
}

class StoreJS extends AbstractStore{
    constructor(){
        super();
        this._headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Method': 'GET, POST, PUT, DELETE, PATCH'
        }
    }
    async saveTask(task){
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

    async deleteTask(task){
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

//хранение таска между сессиями
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
                tasks = Task.fromJSON(localStorage.getItem(key));;
            } catch (e) {
                throw new Error(`impossible get task with id=${id}`, error.message);
            }

            return Promise.resolve(tasks);

    }

    deleteTask(task){
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
class Render {
    renderTask(task) {
        console.log(task);
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
        const id = Math.random().toString(36).substr(2, 16);
        const task = new Task(id, title);
        return this._store.saveTask(task);
    }

    deleteTask(task) {
        return this._store.deleteTask(task);
    }

    toggleTask(task) {
        task.toggle();
        return this._store.updateTask(task);
    }

}
class TODO {
    constructor(taskManager, render) {
        this._taskManager = taskManager;
        this._render = render;
    }

    async init() {
        const  tasks = await this._taskManager.getTasks();
        tasks.forEach(task => {
            this._render.renderTask(task);
        });
    }

    async addTask(title) {
        const task = await this._taskManager.createTask(title);
        this._render.renderTask(task);
    }

    async deleteAllTask() {
        const tasks = await this._taskManager.getTasks();
        tasks.forEach(async tasks => {
            this._render.renderTask(await this._taskManager.deleteTask(tasks))
        });
    }
    async toggleAllTask() {
        const tasks = await this._taskManager.getTasks();
        tasks.forEach(tasks =>{
            this._taskManager.toggleTask(tasks)
                .then(tasks => this._render.renderTask(tasks));
        })
    }
}

class TODOApp {
    execute() {
        const store = new StoreJS();
        const render = new Render();

        const taskManager = new TaskManager(store);

        const todo = new TODO(taskManager, render);

        const titleInputRef = document.getElementById('title-input');
        const createTaskBtnRef = document.getElementById('create-btn');
        const deleteAllTasksBtnRef = document.getElementById('delete-btn');
        const toggleAllTaskBtnHref = document.getElementById('toggle-btn');

        createTaskBtnRef.addEventListener('click', () => {
            todo.addTask(titleInputRef.value);
        });

        deleteAllTasksBtnRef.addEventListener('click', () => {
            debugger;
            todo.deleteAllTask();
        });

        toggleAllTaskBtnHref.addEventListener('click', () => {
            debugger;
            todo.toggleAllTask();
        });

        //todo.init();
    }
}

const app = new TODOApp();
app.execute();





