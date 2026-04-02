**lala-agent-core**

The core lib for building AI agents

example from lala-code Agent

```typescript
import "dotenv/config"
import { Agent, WorkSpace } from "lala-agent-core";
import {  OllamaModelProvider } from "lala-agent-core/dist/model.js";
import {FileTool, AskTool, TodoTool, BashTool} from "lala-agent-core/dist/tools/index.js";
import {Ollama} from "ollama"

import { TUI } from "./tui.js";


const MODEL_URI = process.env.MODEL_URI || ""

//create a terminal channel
const tui = new TUI() 

//create a workspace for the agent
const ws = new WorkSpace("./", new TUI())

//create a model provider. the LLM you want to use
const model_client = new OllamaModelProvider({host: MODEL_URI, model_name: "qwen3"})

const tools = [FileTool, TodoTool, AskTool] as const

//create the agent
export const agent: Agent<Ollama> = new Agent(model_client, tui, ws, tools)


//start the agent main loop
agent.start()

```