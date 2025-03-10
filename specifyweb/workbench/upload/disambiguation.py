from typing import Dict, Tuple, Optional

from .uploadable import Disambiguation

class DisambiguationInfo:
    disambiguations: Dict[Tuple, int]

    def __init__(self, disambiguations: Dict[Tuple, int]):
        self.disambiguations = disambiguations

    def disambiguate(self) -> Optional[int]:
        return self.disambiguations[()] if () in self.disambiguations else None

    def disambiguate_tree(self) -> Dict[str, int]:
        return {
            path[0][1:]: id
            for path, id in self.disambiguations.items()
            if path != () and path[0].startswith('$')
        }

    def disambiguate_to_one(self, to_one: str) -> Disambiguation:
        result: Dict[Tuple, int] = {
            path[1:]: id
            for path, id in self.disambiguations.items()
            if path and path[0] == to_one
        }
        return DisambiguationInfo(result) if result else None

    def disambiguate_to_many(self, to_many: str, record_index: int) -> Disambiguation:
        result: Dict[Tuple, int] = {
            path[2:]: id
            for path, id in self.disambiguations.items()
            if len(path) >= 2 and (to_many, f'#{str(record_index+1)}') == path[:2]
        }
        return DisambiguationInfo(result) if result else None


def from_json(data: Dict[str, int]) -> DisambiguationInfo:
    return DisambiguationInfo({
        tuple(path.split('.') if path else []): id for path, id in data.items()
    })