class DomainError(Exception):
    """Erro de regra de negócio, convertido em resposta HTTP no main.py."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail
