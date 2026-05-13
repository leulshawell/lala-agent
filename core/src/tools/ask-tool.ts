import { WorkSpace } from "../workspace.js"
import { type Actions, param_not_found_error, Tool, type ToolCallHandler, type  ToolCallValidator } from "../tool.js"


type  AskActions = {
    choose: {
        question: string,
        options: string[]
    },
    open: {
        question: string,
    }
}




const askOpenHandler: ToolCallHandler<AskActions["open"]> = async (params, ws) => {
    const ans = await ws.channel.get_text_input(ws.get_next_call_id(), params.question)
    return {success: true, out_type: "user_response", result: ans}
}

const askOpenValidator: ToolCallValidator<AskActions["open"]> = async (params, ws)=>{
    const {question} = params
    if(!question) 
        return param_not_found_error("ask", "open", "question")
    return {success: true}
    
}

const askChooseHandler: ToolCallHandler<AskActions["choose"]> = async (params, ws: WorkSpace) => {
    const {question, options} = params
    const ans = await ws.channel.get_choice_input("", question, options.map(opt=>({label: opt, value: opt})))
    return {success: true, out_type: "user_response", result: ans}
}

const askChooseValidator: ToolCallValidator<AskActions["choose"]> = async (params, ws)=>{
    const {question, options} = params
    if(!question || !options)
        return param_not_found_error("ask", "choose", question? "question": "options")
    return {success: true}
}


const actions: Actions<AskActions> = {
    choose: {
        desc: "use this to ask the user choice questions where that user will choose between options like yes/no.",
        handler: askChooseHandler,
        validator: askChooseValidator,
        params: {
            question: {
                desc: "The question user will answer by choosing among provided options",
                required: true
            },
            options: {
                desc: "The options user should choose from",
                required: true
            }
        }
    },
    open: {
        desc: "use this to ask the user open ended questions where they will type their answer.",
        handler: askOpenHandler,
        validator: askOpenValidator,
        params: {
            question: {
                desc: "The question you want to ask",
                required: true
            },
        }
    }
}

export default new Tool<"ask", AskActions>("ask", "", actions)