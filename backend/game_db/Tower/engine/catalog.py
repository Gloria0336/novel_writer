"""YAML catalog loading and validation for Tower."""

from __future__ import annotations

from pathlib import Path
from typing import TypeVar

import yaml
from pydantic import BaseModel, ValidationError

from schema.models import Catalog, EliteTemplate, MonsterSpecies, NodeBonus, TechNode, UnitTemplate


ModelT = TypeVar("ModelT", bound=BaseModel)


def _load_yaml(path: Path) -> dict:
    try:
        payload = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        raise ValueError(f"{path.name}: invalid YAML: {exc}") from exc
    if not isinstance(payload, dict):
        raise ValueError(f"{path.name}: expected a mapping at document root")
    return payload


def _validate_mapping(path: Path, model: type[ModelT]) -> dict[str, ModelT]:
    raw = _load_yaml(path)
    out: dict[str, ModelT] = {}
    for key, value in raw.items():
        try:
            out[str(key)] = model.model_validate(value)
        except ValidationError as exc:
            raise ValueError(f"{path.name}:{key}: {exc}") from exc
    return out


def _validate_bonus_templates(path: Path) -> dict[str, list[NodeBonus]]:
    raw = _load_yaml(path)
    out: dict[str, list[NodeBonus]] = {}
    for key, value in raw.items():
        if not isinstance(value, list):
            raise ValueError(f"{path.name}:{key}: expected a list of bonuses")
        try:
            out[str(key)] = [NodeBonus.model_validate(item) for item in value]
        except ValidationError as exc:
            raise ValueError(f"{path.name}:{key}: {exc}") from exc
    return out


def load_catalog(data_dir: str | Path | None = None) -> Catalog:
    root = Path(data_dir) if data_dir is not None else Path(__file__).resolve().parents[1] / "data"
    return Catalog(
        monsters=_validate_mapping(root / "monsters.yaml", MonsterSpecies),
        units=_validate_mapping(root / "units.yaml", UnitTemplate),
        elites=_validate_mapping(root / "elites.yaml", EliteTemplate),
        techs=_validate_mapping(root / "tech_tree.yaml", TechNode),
        node_bonus_templates=_validate_bonus_templates(root / "node_bonuses.yaml"),
    )
