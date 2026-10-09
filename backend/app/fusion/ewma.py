from app.models import SignalResult
from typing import Tuple, List

class EWMAFusionEngine:
    def __init__(self, alpha: float = 0.25):
        self.alpha = alpha
        self.prev_s = 0.0
        self.weights = {'S1': 0.4, 'S2': 0.35, 'S4': 0.25}

    def process(self, signals: List[SignalResult]) -> Tuple[float, str]:
        x_t = 0.0
        for s in signals:
            w = self.weights.get(s.signal, 0.0)
            x_t += w * s.score
            
        s_t = self.alpha * x_t + (1 - self.alpha) * self.prev_s
        self.prev_s = s_t
        
        trust_score = 100.0 * (1.0 - s_t)
        trust_score = max(0.0, min(100.0, trust_score))
        
        if trust_score >= 70:
            risk_level = 'HIGH_TRUST'
        elif trust_score >= 40:
            risk_level = 'WARNING'
        else:
            risk_level = 'ALERT'
            
        return trust_score, risk_level
    
    def boost_trust(self, amount: float):
        trust_score = 100.0 * (1.0 - self.prev_s)
        trust_score = min(100.0, trust_score + amount)
        self.prev_s = 1.0 - (trust_score / 100.0)
