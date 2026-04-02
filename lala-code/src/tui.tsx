//This is a terminal channel. It lets the user interact with the agent using the terminal.
import {render, Box, Text, useInput, Newline, useStdout} from "ink"
import SelectInput from  "ink-select-input"
import Spinner from "ink-spinner"
import React, { type JSX, useState } from "react"
import {type Channel, type SetupResult} from "lala-agent-core"
import { type ChoiceInputItem } from "lala-agent-core/dist/channel.js"


import type { SpinnerName } from 'cli-spinners';



export type Block = {
    key?: string
    type: "select" | "prompt" | "text" | "loader" | "none"
    Component: React.ElementType
    props?: any & {children?: React.ElementType}
    children?: Block[] | boolean | string
}


export class TUI implements Channel {

    blocks: Block[]
    id = "tui"

    setup_result?: SetupResult;
    Interaction_block: Block = {
        Component: Box,
        type: "none"
    }



    constructor(){
        this.blocks = []

    }

    async setup() {
        console.clear()
        this.setup_result = {success: true, time_stamp: new Date()}
        return true
    }

    get_next_prompt_id() {
        return ""
    }

    static Message({text, iconColor, icon}: {text: string, iconColor?: string, icon: string}){
        return <Text><Text color={iconColor || "white"}>{icon}</Text> {text}</Text>
    }

    
    static UserInput = ({prompt, reciever}: {prompt: string, reciever: (v: string)=>void}) => {
        const [value, setValue] = useState("")
        useInput((input, key) => {
            if (key.return) 
                reciever(value)
            else {
                if(key.backspace || key.leftArrow)
                    setValue(prev=>prev.slice(0, prev.length-1))
                else 
                    setValue(prev=>`${prev}${input}`)
            }
        });

        return <Text>{prompt} {value}</Text>
    };

    static Loading = ({type, label}:{type: SpinnerName, label: string})=>{
            return <Text>
                <Text color="green"><Spinner type={type}/></Text>
                {label}
            </Text>
    }

    static Choose = ({items, onSelect, prompt}: {items: ChoiceInputItem[], onSelect: (i:  ChoiceInputItem)=>void, prompt: string})=>{
        return <Box>
            <Text>{prompt}</Text>
            <Newline/>
            <SelectInput items={items} onSelect={onSelect}/>
        </Box>
    }

    async loading(label: string, p: Promise<any>){
            this.Interaction_block = {
                type: "loader",
                Component: TUI.Loading,
                props: {
                    type: "dots",
                    label: label
                }
            }
            this.render()
            await p
    }

    async get_text_input(prompt_id: string, prompt: string){

        return await new Promise<string>((res, rej)=>{
            this.Interaction_block = {
                key: "prompt",
                type: "prompt",
                Component: TUI.UserInput,
                props: {prompt, reciever: (s: string)=>{
                    res(s)
                }},
            }
            this.render()
        })
    }

    async get_choice_input(prompt_id: string, prompt: string, items: ChoiceInputItem[]){
        return await new Promise<string>((res, rej)=>{
            this.Interaction_block = {
                key: prompt_id,
                type: "select",
                Component: TUI.Choose,
                props: {
                    prompt,
                    onSelect: (selected: ChoiceInputItem)=>{
                        res(selected.value)
                    },
                    items
                },
            }
            this.render()
        })
    }

    async message(msg_id: string, message: string, icon: string, iconColor?: string){
        this.blocks.push({
            type: "text",
            Component: TUI.Message,
            props: {text: message, icon, iconColor}
        })
        console.log(this.blocks)
        this.render()
    }

    static RootLayout({top_block, prompt_block}: {top_block: JSX.Element[], prompt_block: JSX.Element}){
        const {stdout} = useStdout()
        return <Box flexDirection="column" width={stdout.columns} height={stdout.rows}>
                    <Box
                        gap={1}
                        flexGrow={1}
                        flexDirection="column"
                        borderStyle="round"
                        borderColor="cyan"
                        padding={1}
                    >
                        {top_block}
                    </Box>

                    <Box
                        padding={1}
                        borderStyle="round"
                        borderColor="green"
                    >
                        {prompt_block}
                    </Box>
                </Box>
    }

    close (){
        this.Interaction_block = {
            Component: Box,
            type: "none",
            props: {}
        }
    }

    render(){
        render(
            <TUI.RootLayout 
            top_block={
                this.blocks.map((block)=> TUI.render_block(block))
            }
            prompt_block={
                this.Interaction_block && TUI.render_block(this.Interaction_block)
            }
            />
        )
    }

    static render_block(block: Block){
        return <block.Component {...block.props} key={block.key}/>
    }

}
