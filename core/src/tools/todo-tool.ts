import { WorkSpace } from "../workspace.js"
import {
    Tool, 
    param_not_found_error, 
    type Actions, 
    type ToolCallHandler, 
    type ToolCallResult, 
    type ToolCallValidator 
} from "../tool.js"

type Status =  "Pending" | "Completed" | "In-progress"

type TodoToolActions = {
    read: {
        name: string
    }
    change_status: {
        name: string
        task: string
        status: Status
    },
    create: {
        name: string,
        tasks: string[]
    }

}

const list =  new Map<string, Map<string, Status>>()


const  createHandler: ToolCallHandler<TodoToolActions["create"]>= async (params, ws: WorkSpace) => {
    const sub_tasks = new Map<string, Status>()
    params.tasks.forEach((task)=>sub_tasks.set(task, "Pending"))
    list.set(params.name, sub_tasks)
    return {success: true, result: `task "${params.name}" created successfuly`}
}

const  createValidator: ToolCallValidator<TodoToolActions["create"]> = async (params, ws: WorkSpace) => {
    const {name, tasks} = params
    if(!name || !tasks)
        return param_not_found_error("todolist", "create", !name? "name": "tasks")
    return {success: true}
    
}

const  changeStatusHandler: ToolCallHandler<TodoToolActions["change_status"]>= async (params, ws: WorkSpace) => {
    const l = list.get(params.name)
    l?.set(params.task, params.status)
    return {success: true, result: `task "${params.name}" under todolist "${params.name}" changed to ${params.status} created successfuly`}
}

const  changeStatusValidator: ToolCallValidator<TodoToolActions["change_status"]> = async (params, ws: WorkSpace) => {
    const {name, task, status} = params
    if(!name || !task || !status)
        return param_not_found_error("todolist", "change_status", !name? "name": !task? "tasks": "status")
    return {success: true}
}


const  readHandler: ToolCallHandler<TodoToolActions["read"]>= async (params, ws: WorkSpace) => {
    const l = list.get(params.name)
    if(!l){
        return {success: false, error_type: "execution_error", error: "Todolist of name ${params.name} not been created."}
    }
    
    const tasks = []
    for (const [task, status] of l?.entries()){
        tasks.push(`${task}: ${status}`)
    }

    return {success: true, result: tasks.toString()}
}

const  readValidator: ToolCallValidator<TodoToolActions["read"]> = async (params, ws: WorkSpace) => {
    const {name} = params
    if(!name)
        return param_not_found_error("todolist", "read", "name")
    return {success: true}
}



const actions: Actions<TodoToolActions> = {
    read: {
        desc: "Assuming you have already created a todolist with \"name\" This will help you if you get lost in between working on a multistep activity.",
        handler: readHandler,
        validator: readValidator,
        params: {
            name: {
                desc: "name of todolist to read",
                required: true
            }
        }
    },
    change_status: {
        desc: "change the status of a task in a todo list of name \"name\"",
        handler: changeStatusHandler,
        validator: changeStatusValidator,
        params: {
            name: {
                desc: "name of the todolist ",
                required: true
            },
            task: {
                required: true,
                desc: "task to change the status of"
            },
            status: {
                desc: "the new status you want to set for the task",
                required: true,
            }
        }
    },
    create: {
        desc: "Create a todolist. ",
        handler: createHandler,
        validator: createValidator,
        params: {
            name: {
                required: true,
                desc: "name of the todolist. Use unique names as this is use to retrieve a todolist later when you want to"
            },
            tasks: {
                desc: "a list of tasks you want to create. This has to be an actual list within []. example: [\"create dir a\", \"create dircotory b\"]",
                required: true
            }
        }
    }
}



const t =  new Tool<"todolist", TodoToolActions>("todolist", "use this tool to create a todo list if you are working on a multi step activity. You can load ", actions)

export default t

