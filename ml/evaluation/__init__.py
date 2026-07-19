"""Evaluation sub-package – dataset analysis + model evaluation."""
from .analyzer import analyze_dataset, get_dataset_quality_score, compare_datasets

__all__ = ["analyze_dataset", "get_dataset_quality_score", "compare_datasets"]
