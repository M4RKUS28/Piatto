"""
This is a service that lets you estimate the costs of an LLM call given the model and the input/output
"""
from typing import List, Tuple
import tokencost
from requests.sessions import Session

#from ..db.database import get_db_context
from currency_converter import CurrencyConverter
from tokencost import calculate_prompt_cost, calculate_completion_cost




class CostService:
    def __init__(self):
        self.currency_converter = CurrencyConverter()

    def estimate_costs(self, model: str, inputs: List[str], outputs: List[str]) -> Tuple[float, float, float]:
        prompt_cost = sum([calculate_prompt_cost(prompt, model) for prompt in inputs])
        completion_cost = sum([calculate_completion_cost(completion, model) for completion in outputs])

        input_costs_eur = self.currency_converter.convert(prompt_cost, 'USD', 'EUR') #€
        output_costs_eur = self.currency_converter.convert(completion_cost, 'USD', 'EUR') #€
        full_costs_eur = input_costs_eur + output_costs_eur

        return input_costs_eur, output_costs_eur, full_costs_eur


if __name__ == "__main__":
    cs = CostService()
    inputs = ["Give me a course about Kiro"]
    outputs = ["This is a course about Kiro"]
    model = "gemini-2.5-pro"
    cs.estimate_costs(model=model, inputs=inputs, outputs=outputs)