# VeyLance / Interview Sentinel
## System-Level Problem, Threat Model, Solution Architecture & Competitive Intelligence

**Document type:** System-level product/research specification  
**Version:** 1.0  
**Research date:** 2026-10-09  
**Scope:** Remote interview integrity, real-time deepfake detection, synthetic identity, impersonation and continuous identity assurance

---

# 1. Executive Summary

## 1.1 Problem

Remote interviews create a new identity-assurance gap: the organization may verify a candidate's documents, resume and background, yet still lack continuous assurance that the **person appearing in the live interview is the person being evaluated**.

Generative AI makes this gap more serious because attackers can combine:

- stolen or synthetic identities,
- fabricated resumes and professional profiles,
- voice cloning,
- real-time face swapping,
- AI-assisted interview responses,
- proxy/stand-in interviewees,
- forged identity documents,
- and post-hiring account/device abuse.

The FBI explicitly warns that North Korean IT workers have used AI and face-swapping technology during video job interviews and recommends identity verification during interviewing, onboarding and employment. The FBI also recommends asking candidates to wave a hand in front of the face because this can trigger malfunction in AI-generated video.  
Source: https://www.fbi.gov/investigate/cyber/alerts/2025/north-korean-it-worker-threats-to-us-businesses

The problem therefore is not simply:

> "Can we detect a deepfake?"

The larger security problem is:

> **How can an organization continuously increase confidence that the person participating in a remote interaction is real, is the expected person, and is not being synthetically represented?**

---

# 2. Strategic Reframing

VeyLance should NOT position itself as another generic "AI deepfake detector."

The stronger system-level framing is:

> **VeyLance is a real-time video integrity and continuous identity-risk layer for remote interactions.**

Interview Sentinel is the application layer around that engine.

### VeyLance

Detection + evidence + risk scoring.

### Interview Sentinel

Interviewer-facing monitoring + alerts + verification workflow.

### Future platform

Continuous identity assurance across:

- interviews,
- onboarding,
- remote work,
- help-desk authentication,
- executive communications,
- high-risk video meetings.

This reframing is important because the commercial market already contains strong deepfake-detection vendors. The defensible opportunity is therefore **workflow + explainability + edge deployment + continuous evidence**, not merely "another detector."

---

# 3. Why This Problem Is Real

## 3.1 Remote hiring has become a security boundary

The FBI describes North Korean IT-worker campaigns in which fraudulent workers obtain employment and then use access to company systems for data theft, cybercrime and revenue generation.

The July 2025 FBI advisory specifically states that North Korean IT workers:

- disguise their identities,
- use U.S.-based individuals,
- attend virtual interviews,
- use AI models and other services,
- and have used face-swapping technology during interviews.

The FBI recommends:

- identity verification,
- cross-checking applicant information,
- employment and education verification,
- video interviews,
- asking candidates to expose their surroundings,
- and asking them to wave a hand in front of their face.

Source:
https://www.fbi.gov/investigate/cyber/alerts/2025/north-korean-it-worker-threats-to-us-businesses

The FBI's January 2025 update further describes data exfiltration and recommends monitoring network/browser activity and strengthening remote-hiring processes.

Source:
https://www.fbi.gov/investigate/cyber/alerts/2025/north-korean-it-workers-conducting-data-extortion

---

# 4. Threat Model

## 4.1 Primary adversary

The primary adversary is an individual or organized group attempting to misrepresent identity during a remote interaction.

Potential motivations:

1. Obtain employment.
2. Obtain privileged access.
3. Steal intellectual property.
4. Commit payment fraud.
5. Establish persistent access.
6. Evade sanctions.
7. Conduct espionage.
8. Scale fraud across many organizations.

## 4.2 Attacker capability levels

### Level 1 — Low sophistication

- static image,
- prerecorded video,
- simple camera overlay,
- obvious voice modification.

### Level 2 — Consumer deepfake

- real-time face swap,
- consumer voice cloning,
- virtual camera,
- AI-generated responses.

### Level 3 — Advanced adversary

- high-quality face synthesis,
- synchronized voice,
- realistic expression transfer,
- latency compensation,
- adaptive behavior,
- proxy humans,
- synthetic identities,
- multiple devices/accounts.

### Level 4 — Hybrid human + AI attack

The most difficult case.

Example:

```text
Real attacker
    +
AI voice assistant
    +
real-time face swap
    +
stolen identity
    +
proxy address/device
```

The system must therefore avoid assuming:

> deepfake = entire attack.

A deepfake may only be one component of a larger identity attack.

---

# 5. Attack Chain: Hiring Kill Chain

A useful system model is:

```text
Identity acquisition
       ↓
Synthetic profile creation
       ↓
Resume / portfolio fabrication
       ↓
Application at scale
       ↓
Recruiter screening
       ↓
Remote interview
       ↓
Identity manipulation
       ↓
Technical interview
       ↓
Offer
       ↓
Onboarding
       ↓
Credential/device access
       ↓
Internal reconnaissance
       ↓
Data theft / fraud / persistence
```

This means video integrity is only one security control.

However, it is an important control at the **human trust boundary** immediately before access is granted.

---

# 6. Security Requirements

## R1 — Continuous rather than point-in-time verification

The system should continuously evaluate the video session instead of performing a single liveness check.

Reason:

A candidate may pass one verification moment and later appear through another identity.

## R2 — Passive monitoring

The system should avoid requiring the candidate to constantly perform unnatural actions.

Challenges can exist as an escalation mechanism, but passive analysis should be the default.

## R3 — Explainable alerts

A result such as:

> "Deepfake probability: 93%"

is weak operational evidence.

Prefer:

```text
ALERT

Trust: 34/100

Evidence:
- Face-boundary anomaly: HIGH
- Occlusion tracking instability: HIGH
- Blink anomaly: MEDIUM
- A/V sync: unavailable

Recommended action:
Pause interview and perform identity challenge.
```

## R4 — Low latency

The system must detect meaningful changes during the interaction, not hours later.

## R5 — Local/edge option

Sensitive interview video should ideally remain local when possible.

This reduces:

- privacy exposure,
- cloud processing dependency,
- bandwidth requirements,
- and attack surface.

## R6 — Graceful degradation

If audio is unavailable:

```text
S5 = inactive
```

rather than:

```text
No audio = suspicious
```

The fusion system must understand missing signals.

## R7 — Evidence preservation

For investigations, the system should eventually record:

- timestamp,
- signal state,
- score trajectory,
- event type,
- system version,
- model/version,
- verification actions.

Raw video storage should be opt-in and governed by explicit privacy/consent requirements.

---

# 7. Detection Philosophy

A major design principle should be:

> **No single signal should determine identity authenticity.**

Instead:

```text
Physical artifacts
      +
Temporal behavior
      +
Audio/video relationship
      +
Identity consistency
      +
Device/session context
      ↓
Risk fusion
      ↓
Human decision / policy
```

This is more robust than betting the entire product on one classifier.

---

# 8. VeyLance Detection Layers

## Layer 1 — S1: Face Boundary / Blending Artifacts

Detect anomalies around the transition between the manipulated face and surrounding pixels.

Concept:

```text
Real background
       │
       │ suspicious transition
       ↓
[ synthetic face ]
```

Microsoft's Video Authenticator historically used subtle blending-boundary and related visual artifacts as detection features.

Source:
https://blogs.microsoft.com/on-the-issues/2020/09/01/disinformation-deepfakes-newsguard-video-authenticator/

### Strength

Fast and explainable.

### Weakness

Modern generators and video compression can reduce obvious boundaries.

---

# 9. Layer 2 — S2: Occlusion / Landmark Stability

This is currently one of VeyLance's most interesting signals.

The system tracks facial landmarks and observes their behavior when part of the face becomes occluded.

Example:

```text
Face visible
     ↓
Hand/object crosses face
     ↓
Landmark behavior changes
     ↓
Unexpected instability/dropout
     ↓
S2 anomaly increases
```

The FBI itself recommends a hand-wave test because AI-generated video may malfunction when the face is occluded.

Source:
https://www.fbi.gov/investigate/cyber/alerts/2025/north-korean-it-worker-threats-to-us-businesses

### Important limitation

Occlusion instability is NOT proof of a deepfake.

Real cameras and real faces can also cause tracking failures.

Therefore:

> S2 is evidence, not identity proof.

---

# 10. Layer 3 — S4: Blink / Temporal Physiology

Blink behavior can be measured through eye landmarks / Eye Aspect Ratio and temporal cadence.

Historically, eye-blink behavior was explored as a deepfake detection cue.

Li & Lyu's research:

https://arxiv.org/abs/1806.02877

### Strong design

Do not judge one blink.

Measure:

```text
blink timing
+
inter-blink intervals
+
eye landmark stability
+
longitudinal behavior
```

### Limitation

Modern deepfake systems can model eye behavior better than early-generation systems.

Therefore S4 should be one feature in the fusion layer.

---

# 11. Layer 4 — S5: Audio/Visual Synchronization

Potential features:

```text
mouth movement
      ↕
audio envelope
      ↕
phoneme timing
      ↕
latency
```

Suspicious timing can provide useful evidence.

However, real conferencing systems introduce:

- network jitter,
- compression,
- microphone delay,
- echo cancellation,
- dropped frames.

Therefore:

> A/V sync must tolerate normal conferencing noise.

The current VeyLance repository treats S5 as roadmap rather than a registered live signal.

---

# 12. Layer 5 — Identity Consistency

This is the major future layer.

The system should eventually answer:

> Is this the same person we saw 5 minutes ago?

rather than only:

> Is this frame fake?

Possible signals:

```text
Face embedding consistency
       +
Voice consistency
       +
Profile identity
       +
Previous-session identity
       +
Document/selfie identity
```

This is where VeyLance can evolve from a deepfake detector into a **continuous identity assurance platform**.

---

# 13. Layer 6 — Session / Device Risk

Future signals:

- VPN/proxy anomalies,
- geolocation inconsistency,
- multiple simultaneous sessions,
- device fingerprint changes,
- virtual camera detection,
- browser anomalies,
- unusual session switching.

These should never be treated as proof of fraud individually.

They are contextual risk signals.

---

# 14. Fusion Engine

The system should combine signals rather than rely on a binary detector.

Example:

```text
S1 Boundary       0.72
S2 Occlusion      0.88
S4 Blink          0.31
S5 A/V Sync       unavailable

             ↓
      Weighted Fusion
             ↓
      Temporal EWMA
             ↓
      Trust = 38/100
             ↓
         ALERT
```

The current VeyLance implementation uses EWMA and thresholds around:

```text
TRUST_WARN = 70
TRUST_LOW  = 40
```

These should be presented as **system thresholds**, not calibrated probabilities.

---

# 15. Recommended Risk Model

Long-term, move from one score to two scores:

### Authenticity Risk

> How suspicious is the media?

### Identity Confidence

> How confident are we that the participant is the claimed person?

This distinction is powerful.

Example:

```text
Authenticity Risk: 12/100
Identity Confidence: 42/100
```

The video may look completely real while the person could still be using a stolen identity.

Conversely:

```text
Authenticity Risk: 81/100
Identity Confidence: 93/100
```

The real person could be using a manipulated camera feed.

This avoids collapsing two different security problems into one number.

---

# 16. System Architecture

## 16.1 Current 24-hour architecture

```text
             CAMERA / FILE / OBS
                     │
                     ▼
                  OpenCV
                     │
                     ▼
             MediaPipe Face Mesh
                     │
       ┌─────────────┼──────────────┐
       ▼             ▼              ▼
   S1 Boundary   S2 Occlusion    S4 Blink
       │             │              │
       └─────────────┼──────────────┘
                     ▼
                EWMA Fusion
                     │
                     ▼
              Trust Score 0-100
                     │
                     ▼
             Local HTTP Server
                     │
                     ▼
             Interview Dashboard
```

The current repository reports this core as working, with 27 tests passing and a local dashboard.

---

# 17. Full Interview Sentinel Architecture

```text
             Zoom / Teams / Meet
                     │
                     ▼
            Browser Capture Layer
              getDisplayMedia()
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
      Video Track           Audio Track
          │                     │
          ▼                     ▼
     Frame Sampler          Audio Analyzer
          │                     │
          └──────────┬──────────┘
                     ▼
             Feature Extraction
                     │
       ┌─────────────┼──────────────┐
       ▼             ▼              ▼
     Visual       Temporal        Audio
     Forensics    Liveness        Analysis
       │             │              │
       └─────────────┼──────────────┘
                     ▼
              Risk Fusion Engine
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
  Authenticity Risk      Identity Confidence
          │                     │
          └──────────┬──────────┘
                     ▼
              Policy Engine
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
      PASS          WARN          ALERT
                     │
                     ▼
            Interviewer HUD
                     │
                     ▼
            Verification Action
```

---

# 18. Escalation Strategy

The system should not immediately accuse the candidate.

Use a progressive response.

### Level 0 — Normal

```text
Trust: HIGH
No action
```

### Level 1 — Suspicious

```text
Trust: WARNING

Continue monitoring.
```

### Level 2 — Strong anomaly

```text
ALERT

Ask candidate to perform a short verification action.
```

### Level 3 — Persistent anomaly

```text
HIGH RISK

Pause interview.
Perform secondary identity verification.
```

### Level 4 — Identity mismatch

```text
CRITICAL

Escalate to HR/security.
Preserve audit evidence.
```

This prevents a noisy detector from directly becoming a hiring decision.

---

# 19. Challenge Protocol

The challenge should be an **escalation mechanism**, not the primary detector.

Possible challenges:

### Challenge A — Occlusion

> "Please place your hand briefly in front of your face."

### Challenge B — Head rotation

> "Please turn your head 90 degrees to the left and back."

### Challenge C — Environment

> "Please show the room or a specified physical object."

### Challenge D — Audio phrase

> "Please repeat this unusual phrase."

### Challenge E — Identity consistency

Compare:

```text
Current face
vs.
previous verified face
```

The FBI already recommends a hand-wave style check in remote hiring contexts.

---

# 20. Privacy Architecture

Recommended default:

```text
RAW VIDEO
   │
   ▼
LOCAL PROCESSING
   │
   ├── discard frames
   │
   ├── retain scores
   │
   └── retain event metadata
```

Do not send raw interview video to a cloud server unless the deployment explicitly requires it and appropriate consent/legal controls exist.

For future enterprise deployments:

- encryption,
- access control,
- retention policies,
- audit logs,
- consent,
- data minimization,
- regional processing,
- deletion workflows.

---

# 21. Competitive Landscape

The competitive market is already significant.

VeyLance should explicitly acknowledge these competitors.

---

## Competitor 1 — Reality Defender

Reality Defender provides multimodal deepfake detection for:

- audio,
- video,
- images,
- live calls,
- meetings,
- identity workflows,
- hiring/workforce protection.

Its RealMeeting product alerts meeting hosts to manipulated media, while RealAPI provides structured detection results.

Sources:

https://www.realitydefender.com/
https://www.realitydefender.com/platform/technology
https://www.realitydefender.com/solutions/hiring-workforce-protection

### Strengths

- enterprise focus,
- multimodal,
- live meetings,
- API,
- mature product positioning,
- multiple industries.

### Weakness against VeyLance

VeyLance does not beat Reality Defender on general detection capability.

The opportunity is:

> **open, inspectable, edge-first, hackathon-friendly detection with transparent signal-level reasoning.**

---

# 22. Competitor 2 — Pindrop Pulse

Pindrop Pulse focuses on deepfake audio and meeting protection.

Its meetings product describes continuous analysis of voice/video and additional identity/location risk signals.

Sources:

https://www.pindrop.com/product/pindrop-pulse/
https://www.pindrop.com/product/pindrop-pulse/meetings/

Pindrop has also publicly described discovering deepfake candidates during its own hiring process.

Source:

https://www.pindrop.com/resources/article/deepfake-detection-revealed-coordinated-hiring-scheme

### Strengths

- strong audio expertise,
- enterprise fraud focus,
- meeting integration,
- identity/liveness framing.

### VeyLance opportunity

Focus specifically on:

> **transparent visual forensic signals + local processing + explainable interview risk workflow.**

---

# 23. Competitor 3 — GetReal Security

This is probably the **closest strategic competitor**.

GetReal explicitly markets:

> "Expose Fake Job Candidates"

and offers real-time detection of fraudulent candidates in video interviews.

It combines:

- forensic analysis,
- machine learning,
- identity-centric detection,
- threat intelligence,
- continuous identity verification,
- response workflows.

Sources:

https://www.getrealsecurity.com/solutions/expose-fake-job-candidates
https://www.getrealsecurity.com/solutions/candidate-fraud-detection

### Important competitive insight

GetReal explicitly warns that not every imposter uses a deepfake.

This means VeyLance should NOT claim:

> "Deepfake detection solves candidate fraud."

Instead:

> "Deepfake detection is one layer of an identity-assurance system."

That is a much stronger technical position.

---

# 24. Competitor 4 — Sumsub

Sumsub operates primarily around identity verification and KYC.

Its platform supports:

- ID verification,
- biometric verification,
- liveness,
- video identification,
- deepfake detection.

Sumsub launched deepfake detection for real-time video interviews as an extension of its liveness system.

Sources:

https://sumsub.com/newsroom/sumsub-unveils-industry-first-deepfake-detection-in-video-identification/
https://sumsub.com/deepfake-detection/
https://docs.sumsub.com/docs/video-identification

### Strength

Strong identity-verification ecosystem.

### Difference

Sumsub is primarily an identity/KYC platform.

VeyLance can focus on:

> **continuous interview integrity and security telemetry.**

---

# 25. Competitor 5 — Intel FakeCatcher

Intel's FakeCatcher uses biological/physiological signals related to blood-flow changes in video pixels.

Intel reported real-time operation and a 96% accuracy result in its 2022 announcement.

Sources:

https://www.intel.com/content/www/us/en/newsroom/news/intel-introduces-real-time-deepfake-detector.html
https://www.intel.com/content/www/us/en/research/trusted-media-deepfake-detection.html

### Strength

Interesting physiological signal.

### Limitation for VeyLance comparison

It demonstrates that real-time biological cues can be useful, but a single physiological detector is still vulnerable to:

- camera quality,
- lighting,
- compression,
- novel generation methods,
- distribution shift.

VeyLance's multi-signal architecture is conceptually complementary.

---

# 26. Competitor 6 — Microsoft Video Authenticator

Microsoft Research previously developed Video Authenticator, which provided a confidence score and examined subtle manipulation artifacts.

Source:

https://blogs.microsoft.com/on-the-issues/2020/09/01/disinformation-deepfakes-newsguard-video-authenticator/

### Importance

This validates the basic concept that:

> visual forensic artifacts can be converted into a real-time confidence signal.

It also reinforces why VeyLance should not claim that boundary analysis alone is enough.

---

# 27. Competitive Matrix

| Capability | VeyLance | Reality Defender | Pindrop | GetReal | Sumsub |
|---|---:|---:|---:|---:|---:|
| Real-time video | Yes | Yes | Yes | Yes | Yes |
| Audio analysis | Roadmap | Yes | Strong | Yes | Yes |
| Hiring use case | Primary | Yes | Yes | Primary | Possible |
| Explainable signal layer | **Core design** | Partial/enterprise | Partial | Strong | Partial |
| Edge/local-first | **Core direction** | Deployment dependent | Enterprise | Enterprise | Enterprise |
| Open/student-build orientation | **Yes** | No | No | No | No |
| Continuous identity | Roadmap | Yes | Yes | **Strong** | Yes |
| Threat intelligence | Future | Yes | Yes | **Strong** | Yes |
| Browser meeting integration | Future | Yes | Yes | Yes | SDK/workflows |
| Privacy-minimal architecture | **Core principle** | Deployment dependent | Enterprise | Enterprise | Enterprise |
| Full hiring lifecycle | Future | Yes | Yes | **Yes** | Yes |
| Transparent heuristic pipeline | **Yes** | Proprietary | Proprietary | Proprietary | Proprietary |

### Conclusion

VeyLance should **not compete head-on on model accuracy** with enterprise vendors.

Its strongest differentiation is:

```text
Explainability
+
Edge processing
+
Open architecture
+
Signal-level forensic reasoning
+
Interview-specific workflow
+
Low deployment complexity
```

---

# 28. Competitive White Space

The strongest opportunity is the intersection:

```text
REAL-TIME DEEPFAKE DETECTION
             +
INTERVIEW SECURITY
             +
EDGE PROCESSING
             +
EXPLAINABILITY
             +
OPEN/LOW-COST DEPLOYMENT
```

Existing enterprise platforms cover many of these capabilities, so this is not an uncontested market.

The defensible product thesis should therefore be:

> **VeyLance is a transparent, privacy-conscious interview integrity layer that can operate locally and expose the evidence behind its risk assessment.**

---

# 29. Academic / Research Landscape

Deepfake detection is not solved.

DeepfakeBench exists because the field suffers from:

- inconsistent preprocessing,
- inconsistent evaluation,
- different datasets,
- different metrics,
- poor comparability.

Source:
https://github.com/SCLBD/DeepfakeBench

The benchmark integrates multiple datasets and detectors and supports metrics including:

- frame-level AUC,
- video-level AUC,
- accuracy,
- EER,
- precision/recall,
- average precision.

This strongly supports using standardized evaluation rather than claiming accuracy from one custom demo.

---

# 30. The Generalization Problem

A major scientific weakness in deepfake detection is distribution shift.

A detector trained against:

```text
Generator A
```

may perform worse against:

```text
Generator B
```

or after:

```text
compression
resize
blur
re-encoding
screen capture
video conferencing
```

NIST's 2026 Guardians of Forensic Evidence program explicitly highlights the need to evaluate generalization and robustness against real-world post-processing and anti-forensic transformations.

Source:
https://www.nist.gov/programs-projects/guardians-forensic-evidence

Therefore VeyLance should evaluate:

```text
Original fake
     ↓
Zoom-like compression
     ↓
720p → 480p
     ↓
screen capture
     ↓
blur/noise
     ↓
network degradation
```

---

# 31. Evaluation Plan

Do NOT evaluate only:

> "Does the red alert appear?"

Build a real test matrix.

## Dataset categories

### Real

- multiple people,
- different lighting,
- different skin tones,
- glasses/no glasses,
- different cameras,
- different backgrounds.

### Fake

- face swaps,
- AI avatars,
- recorded attacks,
- multiple generators,
- multiple resolutions.

### Perturbations

- compression,
- blur,
- low light,
- camera motion,
- network artifacts,
- screen capture.

---

# 32. Metrics

Minimum:

```text
TP
TN
FP
FN
```

Then:

```text
Precision
Recall
F1
FPR
FNR
ROC-AUC
PR-AUC
```

Operational metrics:

```text
Median latency
P95 latency
FPS
CPU utilization
Memory
Detection time-to-alert
Recovery time
```

Most important for interviews:

### False Positive Rate

A system that constantly accuses legitimate candidates is unusable.

### Detection Delay

A perfect detector that alerts after the interview is not useful for live intervention.

---

# 33. Red-Team Evaluation

A mature VeyLance benchmark should include attacks designed specifically to defeat it.

Test:

1. Hand occlusion.
2. Glasses.
3. Masks.
4. Low light.
5. Side profile.
6. Camera movement.
7. Compression.
8. Face-swap tools.
9. AI avatars.
10. Voice cloning.
11. Screen replay.
12. Video conferencing re-encoding.
13. Novel generator not present during development.

The most important experiment is:

> **Train/develop on known attack methods and test on unseen attack methods.**

That measures generalization instead of memorization.

---

# 34. Threat Model for VeyLance Itself

VeyLance can be attacked.

### Adversarial strategy

```text
Attacker discovers:
S2 → optimize occlusion behavior
S4 → synthesize realistic blinking
S1 → improve face boundary
S5 → improve lip-sync
```

Therefore:

> The detector itself becomes an adversarial target.

Long-term architecture should support:

```text
Threat intelligence
        ↓
New attack samples
        ↓
Evaluation
        ↓
Model/signal update
        ↓
Regression tests
        ↓
Production release
```

---

# 35. Provenance Should Complement Detection

Detection asks:

> "Does this media look manipulated?"

Provenance asks:

> "Can we establish where this media came from and how it was changed?"

C2PA provides standards for content provenance and authenticity, including Content Credentials.

Source:

https://spec.c2pa.org/specifications/

Long-term VeyLance should therefore combine:

```text
Forensic detection
        +
Provenance
        +
Identity verification
        +
Session telemetry
```

This is much stronger than detection alone.

---

# 36. Future VeyLance Architecture

```text
                 INTERVIEW SESSION
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
      VIDEO            AUDIO          SESSION
        │               │                │
        ▼               ▼                ▼
 Visual Forensics   Voice Analysis   Device Risk
        │               │                │
        └───────────────┼────────────────┘
                        ▼
              CONTINUOUS IDENTITY
                   ENGINE
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
       Authenticity              Identity
           Risk                  Confidence
             │                     │
             └──────────┬──────────┘
                        ▼
                 POLICY ENGINE
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
        PASS          VERIFY        BLOCK
          │             │             │
          ▼             ▼             ▼
       Continue      Challenge      Escalate
```

---

# 37. Product Roadmap

## Phase 1 — Hackathon MVP

Current core:

- MediaPipe
- S1
- S2
- S4
- EWMA
- trust score
- local dashboard
- event log
- smoke tests
- evaluation harness

Priority:

> **Make the current pipeline measurable and demo-reliable.**

---

## Phase 2 — Interview Sentinel

Add:

- browser capture,
- WebRTC/getDisplayMedia,
- React dashboard,
- WebSocket transport,
- PiP HUD,
- challenge cards,
- S5 audio/video synchronization.

---

## Phase 3 — Continuous Identity

Add:

- face identity consistency,
- voice identity,
- session history,
- device risk,
- location consistency,
- virtual camera signals,
- identity verification.

---

## Phase 4 — Enterprise Security Platform

Add:

- HR/ATS integrations,
- Zoom/Teams/Meet integrations,
- SIEM/SOC integrations,
- policy engine,
- audit trails,
- threat intelligence,
- enterprise API,
- multi-tenant architecture.

---

# 38. Recommended Enterprise Architecture

Eventually:

```text
             Client / Browser
                    │
             Capture Gateway
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      Edge Engine         Cloud API
          │                   │
          ▼                   ▼
      Feature Store      Policy Engine
          │                   │
          └─────────┬─────────┘
                    ▼
               Risk Engine
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
      HR/ATS       SIEM       IAM
        │           │           │
        └───────────┼───────────┘
                    ▼
              Audit / SOC
```

The edge engine should process the sensitive media whenever feasible.

---

# 39. Business Value

The buyer is not really buying:

> "deepfake detection."

They are buying:

> **reduced identity risk before granting trust or access.**

Potential customers:

### Recruiting

Prevent fraudulent candidates.

### Cybersecurity

Reduce identity-based initial access.

### Finance

Prevent executive/video payment fraud.

### Government

Protect remote identity verification.

### BPO/contact centers

Detect synthetic callers.

### Remote onboarding

Continuously verify identity.

### High-value meetings

Protect executives and sensitive communications.

---

# 40. Key Product Principle

The system should never say:

> "This person is a fraud."

It should say:

> "The session exhibits elevated indicators of synthetic manipulation. Additional verification is recommended."

This distinction is important for:

- false positives,
- legal defensibility,
- candidate fairness,
- user trust,
- privacy,
- responsible AI.

---

# 41. What VeyLance Should NOT Claim

Avoid these claims unless independently demonstrated:

- "99% accurate."
- "Detects every deepfake."
- "Impossible to bypass."
- "Proves identity."
- "Eliminates hiring fraud."
- "Works against all AI generators."
- "No false positives."
- "A red alert means the candidate is fake."

Instead:

> "VeyLance detects suspicious video artifacts and produces an explainable risk signal for human verification."

That is technically defensible.

---

# 42. Strongest System-Level Differentiation

The strongest long-term positioning is:

> **From Deepfake Detection → Continuous Identity Assurance**

Traditional detector:

```text
Input media
    ↓
Fake / Real
```

VeyLance:

```text
Live interaction
       ↓
Continuous evidence
       ↓
Visual integrity
       +
Temporal liveness
       +
Audio/video consistency
       +
Identity consistency
       +
Session context
       ↓
Risk
       ↓
Human verification
       ↓
Policy decision
```

That is a substantially more powerful security architecture.

---

# 43. Final Problem Statement

## Problem

Remote interviews and other video-mediated interactions implicitly treat audio/video as evidence of human identity. Generative AI has weakened this assumption by enabling real-time face swaps, synthetic voices, AI avatars and other impersonation techniques.

Existing identity verification often operates at discrete points—document verification, selfie verification, background checks or onboarding—while the live interaction itself can remain insufficiently monitored.

This creates an identity assurance gap:

> **The system may know who a candidate claims to be, but not continuously know whether the person appearing in the live interaction is actually that person.**

This gap can enable fraudulent hiring, insider access, social engineering, financial fraud and other identity-based attacks.

---

# 44. Final Solution Statement

## Solution

VeyLance provides a real-time, edge-capable integrity layer that continuously analyzes live video for multiple independent indicators of synthetic manipulation.

It combines:

- facial-boundary forensics,
- occlusion/landmark behavior,
- temporal liveness signals,
- audio/video synchronization,
- identity consistency,
- session/device context,
- and eventually provenance.

These signals are fused into an explainable risk model rather than a single opaque binary classifier.

Interview Sentinel provides the operational interface:

```text
Detect
  ↓
Explain
  ↓
Alert
  ↓
Challenge
  ↓
Verify
  ↓
Escalate
```

---

# 45. The Core Thesis

> **Seeing a person on a screen is no longer sufficient proof that the person is present.**

VeyLance is designed to turn the video-call trust boundary into a measurable security control.

---

# 46. Sources

## Government / Standards

1. FBI — North Korean IT Worker Threats to U.S. Businesses  
https://www.fbi.gov/investigate/cyber/alerts/2025/north-korean-it-worker-threats-to-us-businesses

2. FBI — North Korean IT Workers Conducting Data Extortion  
https://www.fbi.gov/investigate/cyber/alerts/2025/north-korean-it-workers-conducting-data-extortion

3. NIST — Guardians of Forensic Evidence  
https://www.nist.gov/programs-projects/guardians-forensic-evidence

4. C2PA Specifications  
https://spec.c2pa.org/specifications/

5. EU AI Act transparency information  
https://digital-strategy.ec.europa.eu/en/factpages/quick-facts-transparency-rules-ai-systems

## Research / Benchmarks

6. DeepfakeBench  
https://github.com/SCLBD/DeepfakeBench

7. DeepfakeBench paper  
https://arxiv.org/abs/2307.01426

8. DFDC Dataset  
https://arxiv.org/abs/2006.07397

9. Li & Lyu — Eye-blink deepfake detection  
https://arxiv.org/abs/1806.02877

10. Microsoft Video Authenticator  
https://blogs.microsoft.com/on-the-issues/2020/09/01/disinformation-deepfakes-newsguard-video-authenticator/

11. Intel FakeCatcher  
https://www.intel.com/content/www/us/en/newsroom/news/intel-introduces-real-time-deepfake-detector.html

## Commercial Competitive Intelligence

12. Reality Defender  
https://www.realitydefender.com/

13. Reality Defender Technology  
https://www.realitydefender.com/platform/technology

14. Reality Defender Hiring/Workforce Protection  
https://www.realitydefender.com/solutions/hiring-workforce-protection

15. Pindrop Pulse  
https://www.pindrop.com/product/pindrop-pulse/

16. Pindrop Pulse for Meetings  
https://www.pindrop.com/product/pindrop-pulse/meetings/

17. Pindrop — Hiring Scheme Case Study  
https://www.pindrop.com/resources/article/deepfake-detection-revealed-coordinated-hiring-scheme

18. GetReal Security — Fake Job Candidates  
https://www.getrealsecurity.com/solutions/expose-fake-job-candidates

19. GetReal — Candidate Fraud Detection  
https://www.getrealsecurity.com/solutions/candidate-fraud-detection

20. GetReal — Staffing & Recruiting  
https://www.getrealsecurity.com/solutions/staffing-recruiting

21. Sumsub — Deepfake Detection  
https://sumsub.com/deepfake-detection/

22. Sumsub — Deepfake Detection in Video Identification  
https://sumsub.com/newsroom/sumsub-unveils-industry-first-deepfake-detection-in-video-identification/

23. Sumsub — Video Identification  
https://docs.sumsub.com/docs/video-identification

---

# 47. Final Strategic Recommendation

For the HackBIOS version:

### Do NOT build a giant enterprise platform.

Build the smallest system that proves the larger thesis.

```text
LIVE VIDEO
    ↓
S1 + S2 + S4
    ↓
FUSION
    ↓
TRUST SCORE
    ↓
EXPLAINABLE ALERT
    ↓
CHALLENGE
    ↓
VERIFY
```

Then demonstrate the path to:

```text
S1/S2/S4
   ↓
S5
   ↓
Identity consistency
   ↓
Device/session risk
   ↓
Browser meeting integration
   ↓
Continuous Identity Assurance Platform
```

The winning story is therefore not:

> "We built another deepfake detector."

It is:

> **"We are building a security control for the moment when organizations decide whether to trust a human they can only see through a screen."**
