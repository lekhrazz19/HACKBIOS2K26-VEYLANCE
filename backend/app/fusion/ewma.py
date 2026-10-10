from app.models import SignalResult
from typing import Tuple, List

class EWMAFusionEngine:
    BASE_WEIGHTS = {'S1': 0.25, 'S2': 0.25, 'S3': 0.20, 'S4': 0.18, 'S5': 0.12}

    def __init__(self, alpha: float = 0.25):
        self.alpha = alpha
        self.prev_s = 0.0

    def get_instant_risk(self, signals: List[SignalResult]) -> float:
        active_names = {s.signal for s in signals}
        active_weights = {k: v for k, v in self.BASE_WEIGHTS.items() if k in active_names}
        total = sum(active_weights.values())
        if total == 0:
            return 0.0
        norm_weights = {k: v/total for k, v in active_weights.items()}
        return float(sum(norm_weights.get(s.signal, 0.0) * s.score for s in signals))

    def process(self, signals: List[SignalResult]) -> Tuple[float, str]:
        # Only use weights for signals present in this frame
        active_names = {s.signal for s in signals}
        active_weights = {k: v for k, v in self.BASE_WEIGHTS.items() if k in active_names}
        total = sum(active_weights.values())
        if total == 0:
            return 100.0 * (1.0 - self.prev_s), self._risk_level(100.0 * (1.0 - self.prev_s))
        # Normalize so active weights always sum to 1.0
        norm_weights = {k: v/total for k, v in active_weights.items()}
        
        x_t = sum(norm_weights.get(s.signal, 0.0) * s.score for s in signals)
            
        s_t = self.alpha * x_t + (1 - self.alpha) * self.prev_s
        self.prev_s = s_t
        
        trust_score = 100.0 * (1.0 - s_t)
        trust_score = max(0.0, min(100.0, trust_score))
        
        return trust_score, self._risk_level(trust_score)
    
    def _risk_level(self, trust: float) -> str:
        if trust >= 70: return 'HIGH_TRUST'
        if trust >= 40: return 'WARNING'
        return 'ALERT'
    
    def boost_trust(self, amount: float):
        trust_score = 100.0 * (1.0 - self.prev_s)
        trust_score = min(100.0, trust_score + amount)
        self.prev_s = 1.0 - (trust_score / 100.0)
