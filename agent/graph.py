from unittest import result
from dotenv import load_dotenv
from langgraph import graph
load_dotenv()

from langchain_core.prompts import prompt
from langchain_groq import ChatGroq
llm=ChatGroq(model="openai/gpt-oss-120b")

from pydantic import BaseModel , Field
from prompts import *
from states import *

from langgraph.constants import END
from langgraph.graph import StateGraph

def planner_agent(state: dict) -> dict:
    user_prompt = state["user_prompt"]
    prompt = planner_prompt(user_prompt)
    resp = llm.with_structured_output(Plan).invoke(prompt)
    return {"plan": resp}

def architect_agent(state: dict) -> dict:
    plan: Plan = state["plan"]
    resp = llm.with_structured_output(TaskPlan).invoke(architect_prompt(plan))
    if resp is None:
        raise ValueError("Architect did not return a valid response")

    resp.plan = plan
    return {"task_plan": resp}

graph = StateGraph(dict)
graph.add_node("planner",planner_agent)
graph.add_node("architect", architect_agent)
graph.add_edge("planner", "architect")
graph.set_entry_point("planner")

agent = graph.compile()

user_prompt = "create a simple calculator web application"
result = agent.invoke({"user_prompt":user_prompt})

print(result)