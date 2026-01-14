from .uploadable import Disambiguation

class DisambiguationInfo:
    disambiguations: dict[tuple, int]

    def __init__(self, disambiguations: dict[tuple, int]):
        self.disambiguations = disambiguations

    def disambiguate(self) -> int | None:
        return self.disambiguations[()] if () in self.disambiguations else None

    def disambiguate_tree(self) -> dict[str, int]:
        return {
            path[0][1:]: id
            for path, id in self.disambiguations.items()
            if path != () and path[0].startswith('$')
        }

    def disambiguate_to_one(self, to_one: str) -> Disambiguation:
        result: dict[tuple, int] = {
            path[1:]: id
            for path, id in self.disambiguations.items()
            if path and path[0] == to_one
        }
        return DisambiguationInfo(result) if result else None

    def disambiguate_to_many(self, to_many: str, record_index: int) -> Disambiguation:
        result: dict[tuple, int] = {
            path[2:]: id
            for path, id in self.disambiguations.items()
            if len(path) >= 2 and (to_many, f'#{str(record_index+1)}') == path[:2]
        }
        return DisambiguationInfo(result) if result else None


def from_json(data: dict[str, int]) -> DisambiguationInfo:
    return DisambiguationInfo({
        tuple(path.split('.') if path else []): id for path, id in data.items()
    })