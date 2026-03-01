Example usage

```typescript

import { Agent } from "../agent";
import {  OllamaModelProvider } from "../model";
import { WorkSpace } from "../workspace";

import { TUI } from "./tui";

//import some tools for the agent to use
import FileTool from "../tools/file-tool"; //used for file ops on disk
import TodoTool from "../tools/todo-tool"; //used to create and manage todolist
import AskTool from "../tools/ask-tool";   //used to ask the user questions

const MODEL_URI = process.env.MODEL_URI 

//create a terminal channel
const tui = new TUI() 

//create a workspace for the agent
const ws = new WorkSpace("./", tui)

//create a model provider. the LLM you want to use
const mp = new OllamaModelProvider({host: MODEL_URI}, "qwen3")

const tools = [FileTool, TodoTool, AskTool]

//create the agent
export const agent = new Agent(mp, tui, ws, tools)


//start the agent main loop
agent.start()

```