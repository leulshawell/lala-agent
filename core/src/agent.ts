import { readFileSync } from "fs"
import { Model } from "./model.js"
import { WorkSpace } from "./workspace.js"
import { 
    action_not_found_error, 
    Tool, 
    type ToolCallResult, 
    type ToolCallValidationResult ,
    tool_not_found_error,  } from "./tool.js"
import * as path from "path"
import type { Channel } from "./channel.js"


export class Agent<P>{
    workspace: WorkSpace
    model: Model<P>
    channel: Channel
    tools: Map<string, Tool<string, any>>

    constructor(model_client: Model<P>, channel: Channel, workspace: WorkSpace, tools: readonly Tool<string, any>[]){
        this.model = model_client
        this.workspace = workspace
        this.channel = channel
        this.tools = new Map()
        this.model.system_pr = this.generate_master_prompt(tools)

        tools.forEach(tool => {
            this.tools.set(tool.name, tool)
        });


    }


    async start(){
        if(await this.channel.setup()){
            while (true){
                const req_id = this.workspace.get_next_call_id()
                const prompt = await this.channel.get_text_input( req_id, "Ready >>")

                const message = this.generate_user_promp(prompt, req_id, this.workspace.get_next_call_id())
                const res_ = this.model.next(req_id,  message, this.workspace)

                this.channel.message(req_id, prompt, ">>", "green")
                await this.channel.loading("thinking", res_)
                const res = await res_


                this.channel.message(req_id, JSON.stringify(res), "[debug]", "cyan") //set the response object in the channel for debugging

                if(res.type === "message"){
                    this.channel.message(req_id, res.text, ">>", "yellow")
                    continue
                }

                //this is the key inifinite loop that keeps going unless the model want to interact with the user
                //or sends un invalid message that doesn't follow the sytem prompt
                //the hope is the model won't do both of those things unless neccessary which will keep it fully automous
                while(true){
                    const {name, action, params} = res
                    this.channel.message(res.call_id, res.text, `[${name}]`, "red") //show the tool call

                    const result = await this.call_tool(name, action, params)
                    
                    const req_id = this.workspace.get_next_call_id()
                    
                    const res2_ = this.model.next(req_id, JSON.stringify(result), this.workspace)
                    await this.channel.loading("thinking", res2_)
                    const res2 = await res2_

                    //this means model wants to send the user a message so tool call loop breaks
                    if(res2.type === "message"){
                        this.channel.message(req_id, res2.text, ">>", "yellow")
                        break
                    }
                }

            }
        }else {
            console.error(`Channel setup failed\n ${this.channel.setup_result || "Unknown reason"}`)
            process.exit()
        }

    }

    async call_tool(tool_name: string, act: string, p: any): Promise<ToolCallResult | ToolCallValidationResult>{
        const tool = this.tools.get(tool_name)
        if(!tool) return tool_not_found_error(tool_name) 

        const action = tool.actions[act]

        if(!action) {
            return action_not_found_error(tool_name, act)
        }

        const isValid = action.validator(p, this.workspace)

        return isValid.success? await action.handler(p, this.workspace): isValid
        
    }

    generate_user_promp(prompt: string, req_id: string, next_call_id: string){
        const request =  {
                role: "user",
                type: "message",
                id: req_id,
                next_call_id,
                text: prompt
            };

        return JSON.stringify(request)
    }

    generate_master_prompt(tools: readonly Tool<string, any>[]): string{
        const sol  = readFileSync(path.resolve(process.cwd(), "SOUL.txt")).toString()
        const ins  = readFileSync(path.resolve(process.cwd(), "INSTRUCTIONS.txt")).toString()
        const tool  = readFileSync(path.resolve(process.cwd(), "TOOLS.txt")).toString()

        const base = `${sol}\n\n${ins}\n\n${tool}\n*Tools List*\n${tools.map((tool)=>tool.get_definition()).join("\n")}\n\n${this.workspace.loads()}`
        
        return base
    }


}

