import { writeFile, mkdir } from "fs/promises"
import { WorkSpace } from "../workspace"
import { ToolCallResult, Tool, Actions, ToolCallHandler, ToolCallValidator, param_not_found_error } from "./tool"
import { readFile } from "fs/promises"


type FileAction = {
    read: {
        params: {
            path: string
        }
    },
    write: {
        params: {
            path: string,
            content: string,
        }
    },
    create_dir: {
        params: {
            path: string
        }
    },
}




const writeHandler: ToolCallHandler<FileAction["write"]> = async (params, ws): Promise<ToolCallResult> => {
   try{
       const content = params.content
       const write_path   = params.path
       await writeFile(write_path, content)
       return {success: true, out_type: "std_out", result: `${content.length} bytes written to ${write_path}`}
   }catch(e: any){
       return {success: false, error_type: "execution_error", error: e.message}
   }
}


const writeValidator: ToolCallValidator<FileAction["write"]> = (params, ws: WorkSpace) => {
    const {path: write_path, content} = params
    if(!write_path || !content)
        return param_not_found_error("file", "write", !write_path? "path": "content")
    try{
        ws.assert_in_workspace(write_path)
        return {success: true}
    }catch(e: any){
        return {success: false, error_type: "tool_call_error", error: e.message, suggested_fix: `${write_path} is outside your workspace. Check with user that it is the right path.`}
    }
}



const  readHandler: ToolCallHandler<FileAction["read"]> = async (params, ws: WorkSpace) => {
    const {path} = params
    const content = (await readFile(path)).toString()
    return {success: true, out_type: "std_out", result: content}
}

const  readValidator: ToolCallValidator<FileAction["read"]> = (params, ws: WorkSpace) => {
    const {path: read_path} = params
    if(!read_path)
        return param_not_found_error("file", "read", "path")
    try{
        ws.assert_in_workspace(read_path)
        return {success: true}
    }catch(e: any){
        return {success: false, error_type: "tool_call_error", error: e.message, suggested_fix: `${read_path} is outside your workspace. Check with user that it is the right path.`}
    }
}

const  createDirHandler: ToolCallHandler<FileAction["create_dir"]> = async (params, ws: WorkSpace) => {
    const {path} = params
    await mkdir(path)
    return {success: true, out_type: "std_out", result: `${path} created`}
    
}

const  createDirValidator: ToolCallValidator<FileAction["create_dir"]> = (params, ws: WorkSpace) => {
    const {path: write_path} = params
    if(!write_path)
        return param_not_found_error("file", "create_dir", "path")
    try{
        ws.assert_in_workspace(write_path)
        return {success: true}
    }catch(e: any){
        return {success: false, error_type: "tool_call_error", error: e.message, suggested_fix: `${write_path} is outside your workspace. Can't write there.`}
    }
}

const actions: Actions<FileAction> = {
    read: {
        desc: "use this to read files",
        params: {
            path:{
                desc: "the path where you want to read from",
                required: true,
            }
        },
        handler: readHandler,
        validator: readValidator

    },
    write: {
        desc: "Use this tool to write a file on disk",
        params: {
            path:{
                desc: "path where you want to write the file",
                required: true,
            },
            content: {
                desc: "content you want to write to the file",
                required: true,
            }
        },
        handler: writeHandler,
        validator: writeValidator
    },
    create_dir: {
        desc: "use this action to create directories on disk",
        params: {
            path:{
                desc: "path where you want to create the ",
                required: true,
            }
        },
        handler: createDirHandler,
        validator: createDirValidator
    }
};


export default new Tool<"file", FileAction>("file", "use this tool to perform actions realted to files on disk", actions) 

