import { readFileSync } from "fs"
import { Model } from "./model"
import { WorkSpace } from "./workspace"
import { Actions, Tool, ToolCallResult, ToolCallValidationResult } from "./tools/tool"
import path from "path"
import { Channel } from "./channel"


export class Agent<P>{
    workspace: WorkSpace
    model: Model<P>
    master: string
    channel: Channel
    tools: Map<string, Tool<string, any>>
    system_prompt: string

    constructor(model_client: Model<P>, channel: Channel, workspace: WorkSpace, tools: Tool<string, any>[]){
        this.model = model_client
        this.workspace = workspace
        this.channel = channel
        this.tools = new Map()
        this.system_prompt = this.generate_master_prompt(tools)

        tools.forEach(tool => {
            this.tools.set(tool.name, tool)
        });

        this.master = this.generate_master_prompt(tools)

    }


    async start(){
        if(await this.channel.setup()){
            const request =  {
                role: "user",
                type: "message",
                id: "",
                next_call_id: this.workspace.get_next_call_id(),
                text: "" //place holder for the prompt 
            };
            while (true){

                const prompt = await this.channel.get_text_input( request.id, "Ready >>")

                const message = this.generate_user_promp(prompt)
                const res_ = this.model.next(this.system_prompt, message, this.workspace)

                this.channel.message(request.id, prompt, ">>", "green")
                await this.channel.loading("thinking", res_)
                const res = await res_

                this.master = `${message}\n${JSON.stringify(res)}`

                this.channel.message(request.id, JSON.stringify(res), "[debug]", "cyan") //set the response object in the channel for debugging

                if(res.type === "message"){
                    this.channel.message(request.id, res.text, ">>", "yellow")
                    continue
                }

                while(true){
                    const {name} = res
                    this.channel.message(res.call_id, res.text, `[${name}]`, "red") //show the tool call
                    
                    const tool = this.tools.get(name)
                    if(!tool)
                        throw new Error("Model attempted to use unregistered tool")
                    
                    const action = tool.actions[res.action]
                    const isValid  = tool.actions[res.action].validator(res.params, this.workspace)
                    
                    const result =  isValid.success? await action.handler(res.params, this.workspace): isValid

                    const pr = `${this.master}\n${JSON.stringify(result)}`
                    
                    const res2_ = this.model.next(this.system_prompt, pr, this.workspace)
                    await this.channel.loading("thinking", res2_)
                    const res2 = await res2_

                    this.channel.message(request.id, JSON.stringify(res2), "[debug]", "cyan") //set the response object in the channel for debugging
                    
                    this.master = `${prompt}\n${JSON.stringify(res2)}`

                    if(res2.type === "message"){
                        this.channel.message(request.id, res2.text, ">>", "yellow")
                        break
                    }
                }

            }
        }else {
            //check why setup failed
            console.error(`Channel setup failed\n ${this.channel.setup_result || "Unknown reason"}`)
            process.exit()
        }

    }

    async call_tool(tool_name: string, act: string, p: any): Promise<ToolCallResult | ToolCallValidationResult>{
        const tool = this.tools.get(tool_name)
        if(!tool) return {
            success: false,
            error: `Tool "${tool_name}" is not found. in your registery`,
            suggested_fix: "Check your **Toool List** an try again"
        }

        const action = tool.actions[act]

        if(!action) {
            return {
                success: false, 
                error_type: "tool_call_error", 
                error: `tool "${tool_name}" doen't provide action "${act}"`,
                suggested_fix: `Check the action definition for tool "${tool_name}" and try again`
            }
        }

        const isValid = action.validator(p, this.workspace)

        return isValid.success? await action.handler(p, this.workspace): isValid
        
    }

    generate_user_promp(prompt: string){
        return `{ "role": "user", "type": "message", "text": ${prompt}, "next_call_id": "${this.workspace.get_next_call_id()}" }`
    }

    generate_master_prompt(tools: Tool<string, any>[]): string{
        const sol  = readFileSync(path.resolve(process.cwd(), "SOL.txt")).toString()
        const ins  = readFileSync(path.resolve(process.cwd(), "INSTRUCTIONS.txt")).toString()
        const tool  = readFileSync(path.resolve(process.cwd(), "TOOLS.txt")).toString()

        const base = `${sol}\n\n${ins}\n\n${tool}\n*Tools List*\n${tools.map((tool)=>tool.get_definition()).join("\n")}\n\n${this.workspace.loads()}`
        
        return base
    }


}

