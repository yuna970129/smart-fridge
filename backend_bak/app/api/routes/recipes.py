"""Recipe routes — recommendation (§6-3) + "made it" deduction (§6-4)."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user_id, get_recipe_service
from app.core.constants import DEFAULT_TOP_K
from app.schemas.consumption import ConsumptionResult
from app.schemas.recipe import RecipeOut, RecommendationResponse

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.get("/recommend", response_model=RecommendationResponse)
def recommend(
    k: int = DEFAULT_TOP_K,
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_recipe_service),
):
    return service.recommend(user_id=user_id, k=k)


@router.get("", response_model=list[RecipeOut])
def list_recipes(service=Depends(get_recipe_service)):
    return service.list_recipes()


@router.post("/made", response_model=ConsumptionResult)
def mark_made(
    recipe: RecipeOut,
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_recipe_service),
):
    return service.mark_made(user_id=user_id, recipe=recipe)
