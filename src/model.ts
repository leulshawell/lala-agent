import { Config, Ollama } from "ollama"
import { WorkSpace } from "./workspace"


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

    constructor(pr: P){
        this.provider   = pr
    }

    abstract next(system: string, prompt: string, ws: WorkSpace): Promise<ModelResponse>;

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
    
    async next(system: string, _prompt: string, ws: WorkSpace): Promise<ModelResponse>{
        let prompt = _prompt
        while(true) {
            const res = await this.provider.generate(
                {
                    model: this.model_name,
                    prompt,
                    system,
                    stream: false,
                    think: false
                }
            )

            const isValid = Model.validate_res(res.response)
            if(isValid.success) 
                return isValid.res!
            else 
                {
                    ws.channel.message("", isValid.error, "[debug]", "blue")
                    prompt = isValid.error
                }
        }
    }
}
