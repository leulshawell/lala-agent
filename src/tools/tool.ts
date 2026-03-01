import { WorkSpace } from "../workspace"

export type ToolParam = {name: string, desc: string, required: boolean}



type _Action = {
    params: {
        [k: string]: boolean | string | number | string[]
    }
}



type _Actions = {
    [k: string]: _Action
}

export type ToolCallHandler<A extends _Action> = (p: A["params"], ws: WorkSpace)=>Promise<ToolCallResult>
export type ToolCallValidator<A extends _Action> = (p: A["params"], ws: WorkSpace)=>ToolCallValidationResult


type ActionEntry<
  A extends _Action,
> =  {
  desc: string
  handler: ToolCallHandler<A>
  validator: ToolCallValidator<A>
  params: {
    [Act in keyof A["params"]]: {desc: string, required: boolean}
  }
}




export type ToolCallValidationResult = {
    success: false,  
    error: string
    error_type?: "tool_call_error", 
    suggested_fix?: string
} | {success: true}

export type ToolCallResult = {
    success: boolean, 
    out_type?: "user_response" | "std_out", 
    error_type?: "execution_error" | "tool_call_error",  
    error?: string, 
    result?: string
}

export type Actions<A extends _Actions> = {
        [Act in keyof A]: ActionEntry<A[Act]> 
} 

export const param_not_found_error = (tool_name: string, act: string, param: string): ToolCallValidationResult=> {
    return {
        success: false,
        error_type: "tool_call_error", 
        error: `action ${act} of tool "${tool_name}" requires param "${param}"`,
        suggested_fix: `check definition for tool "${tool_name}" and add try again after adding the param accordingly`
    }
}


export const action_not_found_error = (tool_name: string,act: string): ToolCallValidationResult=>{
    return {
        success: false,
        error_type: "tool_call_error", 
        error: `tool "${tool_name}" requires action "${act}"`,
        suggested_fix: `check definition for tool "${tool_name}" and add try again after adding the param accordingly`
    }
}

export const  tool_not_found_error = (tool_name: string): ToolCallValidationResult =>{
    return { 
        success: false, 
        error: `Tool "${tool_name}" is not found. in your registery`, 
        suggested_fix: "Check your **Toool List** an try again" 
    }
}

export class Tool<N extends string, A extends _Actions> {
    name: N
    description: string
    actions: Actions<A>
    constructor(name: N,  desc: string, actions: Actions<A>){
        this.actions = actions
        this.name = name
        this.description = desc
    }


    get_definition(): string {
        const action_defs = Object.keys(this.actions).map((k)=>{
            const act = this.actions[k]
            return JSON.stringify({
                name: k, 
                description: act.desc,  
                params: [Object.keys(act.params).map(pk=>{
                    const param = act.params[pk]
                    return JSON.stringify({
                        name: pk,
                        description: param.desc,
                        require: param.required
                    })
                }).toString()
            ]
        })
    }).join("\n")
    return `{"name": ${this.name},"descripton": ${this.description},"actions": [${action_defs}]}`
    }
}