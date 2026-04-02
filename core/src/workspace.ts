import path from "path"
import { type Channel } from "./channel.js"


type FilePath = {path: string, desc: string, sub_paths: FilePath[]}


export class WorkSpace{
    path: string
    pathstructure: FilePath[]
    channel: Channel

    constructor(path_: string, channel: Channel){
        this.path = path.resolve(path_)
        this.pathstructure = [{path: path_,  desc: "This is your workspace path. You can do anything you want in here.", sub_paths: []}]  //Nested structure of the current working dir 
        this.channel = channel
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