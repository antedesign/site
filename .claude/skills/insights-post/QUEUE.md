# Topic queue

The routine reads this file. **Tick a box to approve a topic.** It publishes approved
topics only, one per run, top to bottom, so the order of the file is the priority.

How to use it
- Approve: change `- [ ]` to `- [x]` on the topic line (GitHub: open the file, pencil icon, edit, commit).
- Veto or park: leave it unticked, or delete the line.
- Reorder: move the line up or down.
- Edit freely: title, angle and the sources to verify. Keep ` | ` between the six fields.
- Add a topic: copy a line, give it a new id (T29, T30 ...), tick it.
- Starter picks (★) are the six topics we think show the method best. Nothing is approved yet.
- Published topics get ` | PUBLISHED <date> <url>` appended by the routine. Do not edit those lines.
- Only public sources and Anté's own reasoning belong here. No client, project or internal material.

Line format: `- [ ] ID | cluster | claim-style title | target search | angle | what the routine must open and verify`



## G. Design process and AI

- [ ] T01 | G Design process ★ | AI makes ideas better and more alike | ai brainstorming homogenization | Individual creativity rises while the collective range of ideas narrows. What a team does about the second half before it picks a direction | Doshi and Hauser 2024, Science Advances: open the paper and report what was actually measured
- [ ] T02 | G Design process | The ideation-execution gap: ideas that sound novel and fail when built | llm research ideas novelty execution gap | Reviewers rate AI ideas as more novel, and results after execution tell another story. Why concept screening needs a test, not a rating | Si et al 2025, arXiv 2506.20803: open the paper, quote the headline result with its sample size
- [ ] T03 | G Design process ★ | The brainstorm room produces fewer ideas than people working alone | brainstorming groups productivity loss | Decades of evidence on productivity loss in groups, then what remote and AI-assisted ideation change. Separate generation first, together second | Diehl and Stroebe 1987 JPSP; Brucks and Levav 2022 Nature: open both abstracts and the main figures
- [ ] T04 | G Design process | Think first, then prompt: how the first AI answer anchors you | anchoring bias ai first answer | Anchoring is old and well documented. The practical rule is to write your own answer before you look at the model's, and what that costs in time | Tversky and Kahneman 1974 Science; one recent study on anchoring with AI suggestions: find and open it
- [ ] T05 | G Design process | An AI panel can attack a design but it cannot make one | multi-agent llm critique panel | Where several AI reviewers help (reading a finished document and objecting) and where they do not (designing, or reviewing each other without a person in between) | Anthropic 2025 engineering post on its multi-agent research system; Karpathy llm-council repository: open both
- [ ] T06 | G Design process | What 85 percent means when AI simulates real people | generative agent simulations of 1000 people | Simulated respondents matched real ones on a test-retest benchmark. Why that does not make them a substitute for discovering what you did not think to ask | Park et al 2024, arXiv: open the paper, restate the 85 percent claim exactly and what it was measured against

## H. Evidence and research quality

- [ ] T07 | H Evidence ★ | Observed, reported, inferred: label every line of your evidence | stated vs revealed preference research | Three kinds of evidence, three levels of trust. A research file where each line carries its label changes what gets researched next | Standard references on stated versus revealed preference; one methods text on triangulation: open and cite
- [ ] T08 | H Evidence | Match every quote to the transcript before it reaches a slide | verify interview quotes ai summary | AI summaries invent or smooth quotes. An exact-text match against the transcript removes most of the risk in minutes. How to do it without code | Evidence of AI summarisation errors in interview analysis: find one peer-reviewed or primary-lab source and open it
- [ ] T09 | H Evidence ★ | A summary of a paper is not the paper | ai research report citations verify | AI research reports mix facts, claims, estimates and guesses. Open the source before you reuse a number, and what to do with the ones you cannot open | A documented case of an AI-written report with unverifiable or wrong claims: find a primary account and open it
- [ ] T10 | H Evidence | Fabricated citations: check any reference in two minutes | ai hallucinated citations check | What a fabricated reference looks like, the three checks that catch it and the habit that keeps it out of a deck | Studies measuring citation fabrication by language models: open at least two primary sources
- [ ] T11 | H Evidence | Ask for the artefact, not the opinion | self report vs behaviour user research | Self-report is weak evidence about behaviour. Ask people to show the last time they did the thing, and what that does to a concept test | Review literature on self-report limits in design and HCI research; a scoping review of AI in design education that notes the same weakness: open both
- [ ] T12 | H Evidence | Problem or symptom: two tools for finding the layer worth solving | causal layered analysis leverage points | Causal layered analysis and Meadows' leverage points as a way to test a problem statement before the first diamond closes | Inayatullah 1998 Futures; Meadows 1999 leverage points essay: open both
- [ ] T13 | H Evidence ★ | What AI cannot do for you: collect primary data | primary data vs desk research ai | AI is strongest on what is already documented. A concept needs data nobody has yet, which is why validation stays a field activity | Evidence that tasks resting on public documentation are most exposed to AI, and tasks needing primary data least: find a primary source on this, for example from assessment-design research

## I. Agents and systems

- [ ] T14 | I Agents and systems | Less context, better answers: why selecting beats stuffing | long context llm lost in the middle | Models use information at the start and end of a long input better than the middle. Give an agent the files a step needs and nothing else | Liu et al 2023 Lost in the Middle, arXiv or TACL: open the paper
- [ ] T15 | I Agents and systems | One job per step: why narrow AI tasks beat broad ones | break down tasks llm agents | A broad request to an agent produces a lot of text and little insight. Splitting it into steps with a check between each is the reliable fix | Anthropic 2024 or 2025 writing on building effective agents and on its multi-agent research system: open both
- [ ] T16 | I Agents and systems ★ | Self-review is not review | llm cannot self correct reasoning | A model checking its own work shares its blind spots. Why an independent check, a different model or a person, is the only one that counts | Huang et al 2023, Large Language Models Cannot Self-Correct Reasoning Yet: open the paper and state the finding precisely
- [ ] T17 | I Agents and systems | The handover is the design object | workflow handoff design ai agents | Between two steps something passes: a file, a table, a decision. Design that artefact first and the steps around it become obvious | Interpretable Context Methodology paper arXiv 2603.16021 on handovers; one systems-design source on interfaces: open both
- [ ] T18 | I Agents and systems | Where to keep an AI workspace: local, drive or repository | where to store ai workspace privacy | Three places, three privacy and sharing trade-offs, and the question to settle before any interview material goes in | Provider documentation on data use and retention for two or three common assistants: open the current pages

## J. Judgement and learning

- [ ] T19 | J Judgement | Amplifier or substitute: when AI helps thinking and when it replaces it | generative ai higher order thinking review | A systematic review finds AI helps when it sits inside a structured process and replaces thinking when it does not. The line that matters for teams | Alubthane 2026 systematic review, Frontiers in Psychology: open the paper and report its scope
- [ ] T20 | J Judgement | AI helps while you use it and can cost you afterwards | bastani generative ai can harm learning | A field experiment where unrestricted AI improved practice scores and lowered later performance, and a guarded version that did not. What that suggests for skill building in teams | Bastani et al 2025 PNAS: open the paper and report the effects exactly
- [ ] T21 | J Judgement | Productive struggle: why friction teaches | productive failure desirable difficulties | Removing friction removes some of the learning. Where struggle is worth keeping in a design process and where it is waste | Kapur on productive failure; Bjork on desirable difficulties: open one primary paper for each
- [ ] T22 | J Judgement | Help that fades: why support for beginners can slow experts | expertise reversal effect | Guidance that helps novices can hurt experienced people. Tools and templates should fade with skill | Kalyuga and colleagues on the expertise reversal effect; Sweller on cognitive load: open a primary paper
- [ ] T23 | J Judgement | AI detection does not work: design for verification instead | ai content detectors accuracy study | Detectors miss and mislabel. Move the check to the process: show the reasoning, defend the choice, keep a log | Weber-Wulff et al 2023; Scarfe et al 2024: open both and state the detection rates

## K. Practice and governance

- [ ] T24 | K Practice | Keep an AI-use log: the five things to record | ai usage log template | Tool, purpose, what you kept, what you rejected, how you checked. A small log that makes AI work reviewable | A published logging format from a university or research group that uses one: find and open it
- [ ] T25 | K Practice | Recording interviews with AI tools: consent, storage, training settings | record interviews ai transcription consent gdpr | What to tell participants, where audio and transcripts live and which settings decide whether a vendor can train on them | GDPR guidance from a data protection authority on recording and transcription; two vendors' current terms: open the primary pages
- [ ] T26 | K Practice | We use AI: six questions that show how | how companies use ai maturity | From occasional use to continuous use. Questions a buyer can ask a supplier to see which one they mean | A published AI-adoption maturity model from a primary source: find and open it
- [ ] T27 | K Practice | What the EU AI Act changes for a team using ChatGPT at work, and what it does not | eu ai act what it means for companies using chatgpt | Obligations fall mostly on providers and on deployers of defined high-risk systems. News-style piece: write it only if the dates and scope are confirmed in the primary text | The Official Journal text of Regulation (EU) 2024/1689 and the European Commission's current guidance on application dates: open both
- [ ] T28 | K Practice | Telling clients you used AI: what to say and when | disclose ai use to clients | A short disclosure that builds trust rather than doubt, what it should cover and the three things never to claim | Professional guidance on AI disclosure from a design, legal or research body: find and open one
