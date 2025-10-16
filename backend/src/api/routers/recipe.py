from ...services.agent_service import AgentService
from fastapi import APIRouter, HTTPException, Body
from ..schemas.recipe import (
    GenerateRecipeRequest, ChangeRecipeAIRequest, ChangeRecipeManualRequest,
    SaveRecipeRequest, StartRecipeRequest, ChangeStateRequest, AskQuestionRequest
)

agent_service = AgentService()

router = APIRouter()

@router.post("/generate_recipe")
def generate_recipe(request: GenerateRecipeRequest):
    gen_context_id = request.gen_context_id if request.gen_context_id is not None else 0
    return agent_service.generate_recipe(request.user_id, request.prompt, gen_context_id)

@router.post("/change_recipe_ai")
def change_recipe_ai(request: ChangeRecipeAIRequest):
    return agent_service.change_recipe(request.user_id, request.change_prompt, request.recipe_id)

@router.post("/change_recipe_manual")
def change_recipe_manual(request: ChangeRecipeManualRequest):
    pass

@router.post("/save_recipe")
def save_recipe(request: SaveRecipeRequest):
    pass

@router.post("/start_recipe")
def start_recipe(request: StartRecipeRequest):
    pass

@router.post("/change_state")
def change_state(request: ChangeStateRequest):
    pass

@router.post("/ask_question")
def ask_question(request: AskQuestionRequest):
    user_id = "1" # Insert user_id retrieval logic here
    prompt_history_id = request.prompt_history_id if request.prompt_history_id is not None else 0
    return agent_service.ask_question(user_id, request.cooking_session_id, request.prompt, prompt_history_id)

@router.get("/view_options")
def view_options():
    pass

@router.get("/get_recipe")
def get_recipe(recipe_id: int):
    pass

@router.get("/get_state")
def get_state(cooking_session_id: int):
    pass

@router.get("/get_prompt_history")
def get_prompt_history(prompt_history_id: int):
    pass