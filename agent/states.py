
from pydantic import BaseModel , Field , ConfigDict

class File(BaseModel):
    path : str = Field(description="The path to the file to be created or modified")
    purpose: str = Field(description="The purpose of the file, eg: 'main application knowledge' , 'data processing module' ,etc ")


class Plan(BaseModel):
    name : str = Field(description="The name of the app to be built")
    desc : str = Field(description="A online description of the app to be built, A web application for managing details")
    techStack : str = Field(description="The techstack to be used for the app -> 'python' , 'javascript' , 'react' , etc")
    features : list[str] = Field(description="A list of features that the app should have, eg: 'user authentication' , 'data visualization' ,etc")
    files : list[File] = Field(description="A list of files to be created with path and purpose")

# Architect
class ImplementationTask(BaseModel):
    filepath: str = Field(description="The path to the file to be modified")
    task_description: str = Field(description="A detailed description of the task to be performed on the file, e.g. 'add user authentication', 'implement data processing logic', etc.")

class TaskPlan(BaseModel):
    implementation_steps: list[ImplementationTask] = Field(description="A list of steps to be taken to implement the task")
    model_config = ConfigDict(extra="allow")