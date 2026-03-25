from unittest import result
from dotenv import load_dotenv, find_dotenv
from langchain_core.globals  import set_verbose, set_debug
from langgraph import graph
from langgraph.prebuilt import create_react_agent
from tools import write_file, read_file, list_files, get_current_directory

load_dotenv()

from langchain_core.prompts import prompt
from langchain_groq import ChatGroq
llm=ChatGroq(model="openai/gpt-oss-120b")

from pydantic import BaseModel , Field
from prompts import *
from states import *

from langgraph.constants import END
from langgraph.graph import StateGraph

set_verbose(True)
set_debug(True)

def planner_agent(state: dict) -> dict:
    user_prompt = state["user_prompt"]
    prompt = planner_prompt(user_prompt)
    resp = llm.with_structured_output(Plan).invoke(prompt)

    if resp is None:
        raise ValueError("Planner did not return a valid response")

    return {"plan": resp}

def architect_agent(state: dict) -> dict:
    plan: Plan = state["plan"]
    resp = llm.with_structured_output(TaskPlan).invoke(architect_prompt(plan))
    if resp is None:
        raise ValueError("Architect did not return a valid response")

    resp.plan = plan
    return {"task_plan": resp}

def coder_agent(state: dict) -> dict:
    steps = state["task_plan"].implementation_steps
    current_stepIdx = 0
    current_task = steps[current_stepIdx]

    user_prompt = (
        f"Task : {current_task.task_description}\n"
    )
    system_prompt = coder_system_prompt()
    coder_tools = [read_file, write_file, list_files, get_current_directory]
    react_agent = create_react_agent(llm, coder_tools)

    react_agent.invoke({"messages": [{"role": "system", "content": system_prompt},
                                     {"role": "user", "content": user_prompt}]})

    return {}

graph = StateGraph(dict)
graph.add_node("planner",planner_agent)
graph.add_node("architect", architect_agent)
graph.add_node("coder", coder_agent)
graph.add_edge("planner", "architect")
graph.add_edge("architect", "coder")
graph.add_conditional_edges(
    "coder",
    lambda s: "END" if s.get("status") == "DONE" else "coder",
    {"END": END, "coder": "coder"}
)
graph.set_entry_point("planner")

agent = graph.compile()

user_prompt = "create a simple calculator web application"
result = agent.invoke({"user_prompt":user_prompt})

print(result)