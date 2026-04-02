import { WorkSpace } from "../workspace.js"
import {
    Tool, 
    param_not_found_error, 
    type Actions, 
    type ToolCallHandler, 
    type ToolCallResult, 
    type ToolCallValidator 
} from "../tool.js"

import {spawn} from "child_process"



type BashAction = {
    exec: {
            command: string
            args: string[],
            env?: string[],
            cwd?: string
    },
}




const execHandler: ToolCallHandler<BashAction["exec"]> = async (params, ws): Promise<ToolCallResult> => {
    const {command, args, env, cwd} = params
    const procEnv: Record<string, string> = {}
    env?.forEach((var_)=>{
        const [k, v] = var_.split("=")
        if(k && v){
            procEnv[k] = v
        }
    })

    const ans = await ws.channel.get_choice_input("", `bash: ${command} ${args.join(" ")} cwd: ${cwd} env: ${env}`, [{label: "Yes", value: "yes"}, {label: "yes", value: "no"}])
    if(ans == "no"){
        return {success: false, error_type: "execution_error", error: "Command execution denied"}
    }
    return await new Promise((resolve, reject) => {
        const child = spawn("bash", ["-c", command], {
        stdio: ["ignore", "pipe", "pipe"],
        env: procEnv,
        cwd
        })

        let stdout = ""
        let stderr = ""

        child.stdout.on("data", (data) => {
            stdout += data
        })

        child.stderr.on("data", (data) => {
            stderr += data
        })

        child.on("close", (code) => {
            if (code === 0) resolve({success: true, out_type: "std_out", result: `${stdout}`})
            else reject({success: false, error_type: "execution_error", error: stderr})
        })
    })
   
}


const execValidator: ToolCallValidator<BashAction["exec"]> = (params, ws: WorkSpace) => {
    params.args = params.args || []
    const {command, cwd, env} = params
    //TODO: prevent some Env vars like model api keys and env vars used in this app
    if(!command)
        return param_not_found_error("bash", "exec", command)
    try{
        if(cwd) ws.assert_in_workspace(cwd)
        return {success: true}
    }catch(e: any){
        return {success: false, error_type: "tool_call_error", error: e.message, suggested_fix: `${cwd} is outside your workspace. Check with user that it is the right path.`}
    }
}


const actions: Actions<BashAction> = {
    exec: {
        desc: "Use this action to execute a command",
        params: {
            command:{
                desc: "commmand to execute",
                required: true,
            },
            args: {
                desc: "command line arguments to the command you want to run. . set this to [] if no args.",
                required: true,
            },
            env: {
                desc: "a string array of enviroment variables. example: [\"variable1\"=\"value1\", \"variable2\"=\"value2\"]",
                required: false
            },
            cwd: {
                desc: "the current working dir for the bash process to be started.",
                required: false
            }
        },
        handler: execHandler,
        validator: execValidator
    },
};


export default new Tool<"bash", BashAction>("bash", "use this tool to run bash commands", actions) 

