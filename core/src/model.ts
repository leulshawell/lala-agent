import { type Config, Ollama } from "ollama"
import { WorkSpace } from "./workspace.js"


export type ModelResponse = {
    role: "agent"
    type: "message"
    text: string 
} | {
    role: "agent"
    type: "tool_call" 
    text: string 
    name: string 
    action: string,
    params: any   
    call_id: string
}

type ResponseValidationResult = {success: true, res: ModelResponse} | {success: false, error: string}

export abstract class Model<P>{
    provider: P
    system_prompt?: string
    context: string

    constructor(pr: P){
        this.provider = pr
        this.context = ""
    }

    set system_pr(prompt: string){
        this.system_prompt = prompt
    }

    abstract next(req_id: string, prompt: string, ws: WorkSpace): Promise<ModelResponse>;

    add_to_context(prompt: string){
        this.context = this.context.concat(`\n${prompt}`)
    }


    static validate_res(res: string): ResponseValidationResult{
        try {
            const parsed = JSON.parse(res) as ModelResponse
            parsed.role = "agent"
            //do validation
            if(parsed.text){
                if(parsed.type === "message"){}
                else if (parsed.type === "tool_call")
                    if(!parsed.name || !parsed.action || !parsed.params)
                        throw new Error(`type: \"tool_call\", but field ${!parsed.name? "name" : !parsed.action? "action": "params"} is not found`)
                    else{}
                else 
                    throw new Error("field \"type\" of agent response must be \"tool_call\" or \"message\"")
                return {success: true, res: parsed}
            }
            parsed.text = parsed.type==="message"? ".": "tool call"
            return {success: true, res: parsed}

        }catch(e: any){
            return {success: false, error: e.message}   
        }
    }
}



export class OllamaModelProvider extends Model<Ollama>{
    model_name: string

    constructor(cfg: (Partial<Config>) & { model_name: string}){ 
        super(new Ollama(cfg)) 
        this.model_name = cfg.model_name
    }
    
    async next(req_id: string, _prompt: string, ws: WorkSpace): Promise<ModelResponse>{
        let prompt = _prompt
        while(true) {
            const res = await this.provider.generate(
                {
                    model: this.model_name,
                    prompt,
                    system: this.system_prompt || "",
                    stream: false,
                    think: false
                }
            )

            const isValid = Model.validate_res(res.response)
            if(isValid.success) {
                //add both request an response to model context
                this.add_to_context(prompt)
                this.add_to_context(JSON.stringify(res))
                return isValid.res
            }else {
                //if model respone was not in valid. the prompt the model with the error the valdation message 
                ws.channel.message("", isValid.error, "[debug]", "blue")
                prompt = `The message you just sent doesn't follow the JSON response schema we agreed upon.\nError: ${isValid.error}.\nFix it and try again`
            }
        }
    }
}
