#!/usr/bin/env python3
"""Upload the prepared dataset to Hugging Face as RENOLOGY/permittimelines.

GATED: run only after Assaf approves. Reads HF_TOKEN from
~/.credentials/huggingface.env.
"""
import os
import pathlib

from huggingface_hub import HfApi

HERE = pathlib.Path(__file__).parent
REPO = "RENOLOGY/permittimelines"

for line in (pathlib.Path.home() / ".credentials/huggingface.env").read_text().splitlines():
    if line.startswith("HF_TOKEN="):
        os.environ["HF_TOKEN"] = line.split("=", 1)[1].strip()

api = HfApi()
api.create_repo(REPO, repo_type="dataset", exist_ok=True)
api.upload_file(
    path_or_fileobj=HERE / "hf-dataset/README.md",
    path_in_repo="README.md", repo_id=REPO, repo_type="dataset",
)
for name in ["permit-records.csv.gz", "permit-cohorts.csv", "permit-timelines.csv"]:
    api.upload_file(
        path_or_fileobj=HERE.parent / "inst/extdata" / name,
        path_in_repo=name, repo_id=REPO, repo_type="dataset",
    )
print(f"uploaded: https://huggingface.co/datasets/{REPO}")
