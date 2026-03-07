import "dotenv/config"

import { Agent } from "../agent";
import {  OllamaModelProvider } from "../model";
import FileTool from "../tools/file-tool";
import TodoTool from "../tools/todo-tool";
import { WorkSpace } from "../workspace";
import { TUI } from "../channels/tui";
import AskTool from "../tools/ask-tool";





const MODEL_URI = process.env.MODEL_URI

//create a terminal channel
const tui = new TUI() 

//create a workspace for the agent
const ws = new WorkSpace("./", new TUI())

//create a model provider. the LLM you want to use
const model_client = new OllamaModelProvider({host: MODEL_URI, model_name: "qwen3"})

const tools = [FileTool, TodoTool, AskTool] as const

//create the agent
export const agent = new Agent(model_client, tui, ws, tools)


//start the agent main loop
agent.start()
