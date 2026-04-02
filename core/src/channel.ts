export type ChoiceInputItem = {value: string, label: string}
export type SetupResult = {success: true,  time_stamp: Date} | {success: false, time_stamp: Date, fail_reason: string}

export interface Channel {
    id: string
    setup_result?: SetupResult

    setup: ()=>Promise<boolean>
    get_next_prompt_id: ()=>string

    loading: (label: string, p: Promise<any>)=>Promise<void>

    get_text_input: (
        prompt_id: string, 
        prompt: string,
    )=>Promise<string>


    get_choice_input: (
        prompt_id: string, 
        prompt: string,
        items: ChoiceInputItem[],
    )=>Promise<string>

    message: (message_id: string, message: string, icon: string, iconColor?: string)=> Promise<void>
    close: ()=>void

}