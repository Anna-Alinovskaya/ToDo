class AbstractStore {                       //абстрактный класс над Store & StoreLS - регулирует поведение над  классами Store, StoreLS, StoreJS
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

class AbstractRender {
    renderTask(task){
        throw new Error('not implemented');
    }

    updateTask(task){
        throw new Error('not implemented');
    }

    destroyTask(task){
        throw new Error('not implemented');
    }
}

class RealRender extends AbstractRender{
    constructor(taskContainer, errorContainer) { 
        super();
        this.taskContainer = taskContainer;
    }
    set deleteTaskFunction(func) {
        this._deleteTaskFunction = func;
      }
    
    set toggleTaskFunction(func) {
        this._toggleTaskFunction = func;
      }
    
      renderTask(task) {

        const li = document.createElement('li');
        li.setAttribute('class', 'created-task--item');
        this.taskContainer.append(li);

        const div = document.createElement('div');
        div.setAttribute('class', 'task');
        li.append(div);

        const p = document.createElement('p');
        p.innerText = task.title;
        p.setAttribute('id', task.id);
        p.setAttribute('class', 'task--content_color task--content');
        div.append(p);

        const divBtnWrapp = document.createElement('div');
        divBtnWrapp.setAttribute('class', 'task--action-btn-wrapper');
        div.append(divBtnWrapp);

        const btnPositive = document.createElement('button');
        btnPositive.innerText = 'Toggle';
        btnPositive.setAttribute('class', 'task--action-btn task--action-btn_positive');
        divBtnWrapp.append(btnPositive);

        const btnNegative = document.createElement('button');
        btnNegative.innerText = 'Delete';
        btnNegative.setAttribute('class', 'task--action-btn task--action-btn_negative delete-btn');
        /*btnNegative.addEventListener('click', () =>{
            debugger;
            todo.deleteAllTask();
        })*/
        divBtnWrapp.append(btnNegative);
        
        /*
        block.addEventListener('click', (event) => {
          const target = event.target;
    
          if (true) {
            this._deleteTaskFunction(task)
          }
    
          if (false) {
            this.toggleTaskFunction(task)
          }
        })*/
       
      }
      updateTask(task) {
        const div = taskContainer.querySelector(`#${task.id}`);
        div.innerText = task.title;
      }
          
      destroyTask(task) {
        const div = this.taskContainer.querySelector(`#${task.id}`);
        this.taskContainer.remove(div);
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
        const tasks = await this._taskManager.getTasks();
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
        console.log(tasks);
        this._render.destroyTask(tasks);
        /*
        const tasks = await this._taskManager.getTasks();
        tasks.forEach(async tasks => {
            this._render.destroyTask(await this._taskManager.deleteTask(tasks));
        });*/
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
        const store = new StoreLS();
        
        const taskContainer = document.getElementsByClassName('created-task--item-group')[0];
        const render = new RealRender(taskContainer);

        const taskManager = new TaskManager(store);

        const todo = new TODO(taskManager, render);
        
        const titleInputRef = document.getElementById('todo-input');
        
        /*
        document.querySelector('#add-btn').addEventListener('click', () => {
            debugger;
            todo.addTask(titleInputRef.value);
        })*/
        
        const prom = new Promise(resolve => {
            document.querySelector('#add-btn').addEventListener('click', () => {
                debugger;
                resolve(todo.addTask(titleInputRef.value));
            })
        })
        prom
            .then(() => {
                document.querySelector('.delete-btn').addEventListener('click', () =>{
                    debugger;
                    todo.deleteAllTask();
                })
            });
        
        //todo.init();
    }
}

const app = new TODOApp();
app.execute();