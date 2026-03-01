import { Agent } from "./agent";
import {  OllamaModelProvider } from "./model";
import FileTool from "./tools/file-tool";
import TodoTool from "./tools/todo-tool";
import { WorkSpace } from "./workspace";
import { TUI } from "./cli/tui";
import AskTool from "./tools/ask-tool";

const ws = new WorkSpace("./", new TUI())

const model_client = new OllamaModelProvider({host: "localhost"}, "qwen3")

export const agent = new Agent(model_client, new TUI(), ws, [
    FileTool,
    TodoTool,
    AskTool
    ]  as const)



console.log(FileTool.get_definition())
// console.log(await agent.call_tool("ask", "choose", {question: "wtf is you doing you little bastard?", options: ["wtf i want", "sleeping", "writing some shitty code "]}))
