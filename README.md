# App Builder

An AI-powered multi-agent system that turns a natural-language prompt into a working software project. Given a description like "Build a colourful modern todo app in HTML, CSS, and JS," the pipeline plans the app, breaks it into implementation tasks, and writes the code file by file.

Built with [LangGraph](https://github.com/langchain-ai/langgraph), [LangChain](https://github.com/langchain-ai/langchain), and [Groq](https://groq.com/) (`openai/gpt-oss-120b`).

## How it works

The agent graph runs three stages in sequence:

```
User prompt → Planner → Architect → Coder (loop) → Done
```

| Stage | Role |
|-------|------|
| **Planner** | Converts your prompt into a structured project plan: name, description, tech stack, features, and file list. |
| **Architect** | Breaks the plan into ordered implementation steps—one or more tasks per file, with dependency ordering. |
| **Coder** | Executes each step using a ReAct agent with file tools (`read_file`, `write_file`, `list_files`, `get_current_directory`). Steps run sequentially until all files are written. |

Generated files are written to `generated_project/` relative to your current working directory.

## Prerequisites

- Python 3.11+ (3.12 recommended)
- [uv](https://docs.astral.sh/uv/) (or pip)
- A [Groq API key](https://console.groq.com/)

## Setup

1. Clone the repository and enter the project directory:

   ```bash
   cd app_builder
   ```

2. Install dependencies:

   ```bash
   uv sync
   ```

3. Create a `.env` file in the project root with your Groq API key:

   ```env
   GROQ_API_KEY=your_api_key_here
   ```

## Usage

Run the CLI and enter your project prompt when prompted:

```bash
uv run python main.py
```

Optional flags:

```bash
uv run python main.py --recursion-limit 100   # max coder loop iterations (default: 100)
```

You can also invoke the graph directly from `agent/graph.py` for development:

```bash
uv run python agent/graph.py
```

After a run completes, open the generated files in `generated_project/` (e.g. open `index.html` in a browser for web apps).

## Project structure

```
app_builder/
├── main.py                 # CLI entry point
├── agent/
│   ├── graph.py            # LangGraph pipeline (planner → architect → coder)
│   ├── prompts.py          # System prompts for each agent
│   ├── states.py           # Pydantic models (Plan, TaskPlan, CoderState, etc.)
│   └── tools.py            # File I/O tools scoped to generated_project/
├── generated_project/      # Output directory (created at runtime)
├── pyproject.toml
└── .env                    # GROQ_API_KEY (not committed)
```

## Configuration

| Setting | Location | Default |
|---------|----------|---------|
| LLM model | `agent/graph.py` | `openai/gpt-oss-120b` |
| Output directory | `agent/tools.py` | `./generated_project` |
| Recursion limit | `main.py` / invoke config | `100` |

The coder agent includes a 5-second delay between steps to reduce Groq rate-limit errors.

## Example

```
Enter your project prompt: Build a colourful modern todo app in html css and js
```

The planner produces a structured plan, the architect creates ordered file-level tasks, and the coder writes `index.html`, `styles.css`, `app.js`, and any other files into `generated_project/`.

## License

Not specified.
