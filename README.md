# lala-Agent

This is a light weight personal llm agent mainly for educational purposes. 


Default Usage
```bash
git clone https://github.com/leulshawell/lala-agent
npm install -g ./lala-agent/cli

lala-agent
```

Developer Example usage
First install the dev version which provides tool dev and agent config options
```bash
git clone https://github.com/leulshawell/lala-agent
npm install ./lala-agent/dev
rm ./lala-agent #Unless you want the source

```
```typescript

import { Agent, OllamaModelProvider, WorkSpace } from "lala-agent";

import { TUI } from "lala-agent/channels";

//import some tools for the agent to use
import {FileTool, TodoTool, AskTool} from "lala-agent/tools"; 

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