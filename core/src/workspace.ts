//handles model memories, files, and more

import path from "path"
import { type Channel } from "./channel.js"
import Path from "path"


type FilePath = {path: string, desc: string, sub_paths: FilePath[]}
type Todo = {task: string, desc: string, status: "in-progress"|"pending"|"complete", sub_tasks: Todo[]}

class Session{
    id: string

    
    constructor(id?: string){
        this.id = id? id: this._get_random_id()
    }

    get_init_prompt(pre?: string, post?: string){
        return this._get_random_id(pre? pre: "promp", post)
    }

    _get_random_id(pre?: string, post?: string): string{
        return `${pre? pre: this.id}`.concat(Date.now().toString()).concat(`${post}`)
    }

}


export class WorkSpace{
    path: string
    pathstructure: FilePath[]
    channel: Channel
    session: Session
    todolist = new  Map<string, Todo[]>()

    constructor(path: string, channel: Channel){
        this.path = Path.resolve(path)
        this.pathstructure = [{path, desc: "This is your workspace path. You can do anything you want in here.", sub_paths: []}]  //Nested structure of the current working dir 
        this.channel = channel
        this.session = new Session()
    }

    loads (): string{
        return `
** WorkSpace **
This Descripes Your current Workspace which is a directory with all files that describe the current work
*Directory Structure*
${WorkSpace.path_to_string(this.pathstructure)}
*Todo list*

`
    }

    static path_to_string(pathstructure: FilePath[], depth:number=0): string{
        const tabs = new Array(depth).map((__)=>"\t").join("")
        return pathstructure.map((path)=>`${tabs}path: ${path.path}, ${tabs}description: ${path.desc}\n${WorkSpace.path_to_string(path.sub_paths, depth+1)}`).join("\n")
    }

    static todolist_to_string(todolist: Todo[], depth: number=0): string{
        const tabs = new Array(depth).map((__)=>"\t").join("")
        return todolist.map((todo)=>`${tabs}task: ${todo.task}\n${tabs}description: ${todo.desc}\n${WorkSpace.todolist_to_string(todo.sub_tasks, depth+1)}`).join("\n")
    }

    get_next_call_id(){
        return `some_tool_call_${Date.now()}`
    }


    assert_in_workspace(_path: string){
        const child = path.resolve(_path)
        const relative = path.relative(this.path, child)
        
        if(relative===".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
            throw new Error("Can't write outside workspace")
    }
}