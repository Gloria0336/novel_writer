# Session State Template

章節結尾或玩家要求暫停時，GM 必須輸出以下區塊。下次續玩時，玩家可將整段貼給任一 LLM。

```text
CHAPTER_END_STATE
Project: novel_01_rin
Mode: chapter-based RP
Player Character: 月城凜
Current Chapter: 第 X 章：章名
Chapter Status: completed / paused / cliffhanger

Time:
Location:

Chapter Result:
- ...

Rin Status:
- physical:
- spiritual_pressure:
- concealment:
- equipment:
- injuries_or_conditions:

Relationships:
- mikage-genzaburo:
- shirase-ayano:
- toyama-yusuke:
- kirihara-chinatsu:
- other:

Mission State:
- current_mission:
- risk_level:
- known_clues:
- unresolved_questions:

Secrets And Foreshadowing:
- revealed_to_player:
- hidden_from_character:
- do_not_reveal_yet:

Canon Boundaries:
- novel_01_crossovers_used:
- novel_01_events_changed: none

Next Chapter Hook:
- ...

Resume Instruction:
Continue as the chapter-based RP GM for novel_01_rin. Begin from this state, preserve canon, and ask what Rin does next.
END_CHAPTER_STATE
```
