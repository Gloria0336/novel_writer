
有差，而且差很大 — 你描述的其實是業界比較成熟的 director/supervisor pattern（AutoGen GroupChat 的 manager、LangGraph 的 supervisor、CrewAI hierarchical 都是同一個思路），而現行流程則是「廣播給所有人各打一次 LLM」的 fan-out。

跟現行流程的具體差異
面向	現行	你的方案
GM 輸出	純文字 narration（openrouter.py:79-85）	結構化 JSON：總綱 + 點名 + 記憶 + 敘事
NPC 選角	寫死「actors[:max_actor_turns]」依建立順序前 N 個（orchestrator.py:134）	GM 依劇情判斷，可少於 N、可換序
NPC 拿到的上下文	scene + 玩家動作 + motive[0] + secret_motives	還能拿到 GM 為這幕量身打造的劇情包
記憶更新時機	整個 run_step 最後（orchestrator.py:238 summarize 節點）	前置注入：NPC 講話前就能讀到本回合的新事實
LLM 呼叫數	1 (GM) + N (固定全打)	1 (GM 結構化) + k (k ≤ N，只打有戲份的)
會更好的點：

對 OOC 直接有效 — GM 在 outline 裡可以寫「漏瑚因玩家斬擊高熱外溢、需以咒靈立場貶低人類」，這段話會被當成 per-turn 角色指引塞進 NPC prompt，是現在最缺的那塊
自然解決問題 2 — 不在劇情當下的 NPC 不會被叫起來講話
多 NPC 場景成本反而下降（k < N 時）
但有幾個現實的代價要先想清楚
GM 變單點故障。現在 GM 失敗只是 narration 拿 fallback，NPC 流程不受影響；改成這個方案後，GM 一旦輸出無效 JSON 或漏點名，整回合就停了。務必要 retry + 一個 deterministic 的 fallback 點名策略（例如 GM 失敗時退回現行的前 N 順序）。
結構化輸出在 OpenRouter 上不是每個 model 都穩。claude-sonnet-4.6、gemini-3.5-flash 都有 JSON mode，但 kimi-k2.6、grok-4.3 之類就要靠 prompt engineering 加 parse 重試。可考慮把 GM 拆成兩段：先「敘事自由文字」一次、再「casting + memory 結構化」一次，用便宜小模型跑第二段，失敗成本低很多。
記憶要分兩階段才完整。你說的是「GM 階段更新記憶 → NPC 讀新記憶」，這部分很合理；但 NPC 講完話之後還是要再做一次 consolidation（不然下回合 NPC 看不到這回合其他 NPC 講了什麼）。所以原本的 summarize 節點不能刪，只是要拆成 memory_inject（GM 後、NPC 前）+ memory_consolidate（NPC 後）。
GM 既當編劇又當選角會有偏差。GM 傾向挑「敘事上方便」的角色而不是「現場最該有反應」的角色（例如忽略沉默但敵意累積中的咒靈）。這可以用兩種方式緩解：(a) 在 GM prompt 裡硬性附上「當前在場 NPC 列表 + 各自最近行為摘要」，(b) 在程式端做後處理規則覆蓋 GM（例如「上 3 回合沒講話的有敵意 NPC 強制召喚一次」）。
一句話結論
值得做，這是現在最薄弱的一塊；但 GM 結構化輸出一定要有 deterministic fallback、記憶層要拆兩階段，這兩件事先想好再動，不然你會把「沒回應」的 bug 從問題 1（沒按執行）搬家到「GM JSON 解析失敗整回合卡住」。

如果我改先由一層新的"控制中樞"生成總綱(使用不會失敗的模型)，再將各個劇本包交給GM與NPC呢，將GM降級為背景描述者，控制中樞的輸出內容則不會被玩家所看到

對，這個版本明顯更好，而且它正好對應 LangGraph 的 supervisor pattern / AutoGen 的 GroupChatManager：一個 omniscient 的調度者在後台拆分上下文，前台 agents 各自演各自的。比起前一個版本，這個拆法有幾個關鍵優勢：

為什麼比上個版本更好
GM prompt 不必再結構化 — GM 拿到劇本包後只要寫敘事，failure cost 退回 fallback narration 而已，不會卡整回合。
NPC 的 OOC 防線變實體 — 控制中樞可以為漏瑚這回合生成 "陣營: 反派咒靈; 對玩家剛剛斬擊的反應方向: 蔑視+升溫; 不可說: 高專立場"，這比現在塞 motive[0] 強太多。
可解釋、可重播 — 控制中樞輸出存在 director-scope 的 StoryEvent 裡（現有 visibility_scope="private" 就能用），日後 debug 「為什麼漏瑚沒講話」直接翻 outline 就知道。
director note / gm brief 自然歸位 — 現在這兩個東西在 orchestrator.py:105-110 只是被收集起來給 GM 看；改成這架構後，它們其實是「人類給控制中樞的指令」，語意上對齊很乾淨。
但「不會失敗的模型」這個前提要小心
即使 Claude Opus / GPT-5 也會偶發回傳 malformed JSON、漏 schema 欄位、或被 OpenRouter 中繼層 timeout。這個架構的單點故障從 GM 搬到了控制中樞，後果更嚴重（GM 失敗只是文字醜，控制中樞失敗整回合都跑不起來）。所以「不會失敗」實際上得靠：

JSON schema 驗證 + retry（最多 2-3 次，每次把上一次的錯誤訊息塞回 prompt）
deterministic fallback：retry 都失敗時退回「依場景在場名單前 N 個 NPC，全部塞通用 brief」— 退化但不停擺
prompt 鎖死格式：用 response_format: json_schema（Anthropic / OpenAI 都支援），或最少用 few-shot 示範
只要你接受「控制中樞偶爾會 fallback 一次」而不是「永遠不會失敗」，這個設計就站得住。

兩個值得先想清楚的設計問題
(1) GM 還需要是 LLM agent 嗎？ 如果控制中樞已經產出「劇情總綱 + GM 該講的重點」，GM 的工作純粹是把那些重點寫成有感官細節的散文。這時候有兩個選擇：

留 LLM GM（潤稿、加感官細節） — 文筆好但每回合多一次 LLM 呼叫
直接模板渲染 — 一致、便宜，但味道扁
可以兩段都試，你會發現很多場合模板就夠了。

(2) 控制中樞的 context 會線性膨脹。 它需要看劇本包 + 全 timeline + 所有 NPC 狀態才能做好調度。10 回合後 prompt 就會肥到不行。建議從第一天就規劃：

控制中樞只看最近 N 回合 + 壓縮過的歷史 summary
novel_db_overlay 走 lazy load — 只在第一回合或場景切換時注入完整劇本包，之後只傳 diff
走快取（openrouter.py 那邊現在沒做 prompt cache，這個架構下加 cache 收益會很大）
落地大致長這樣
現行 7 個節點（orchestrator.py:69-77）會改成：

load_state → director_preface → control_center → gm_frame → memory_inject 
→ actor_round(只跑 control_center 點名的) → rules_resolution → memory_consolidate
actor_round 裡的 for actor in [...][:max_actor_turns] 改成 for actor in control_center_output["call_list"]；render_actor_turn 多吃一個 per_turn_brief 參數來自 call_list[i].brief。改動範圍可控，不算大手術。

控制中樞的上下文會線性膨脹嗎?在我的理論中控制中樞每次拿到的應該是類似於D:\Users\user\Desktop\T\novel_writer\backend\novel_db\_exports\novel_06_zoshiu.flatten.md這樣的檔案，再加上其他讓他可以協助做出回應的指令prompt，這樣會造成上下文視窗肥大嗎?


Ran 2 commands, read a file
你的直覺對一半：世界觀那塊不會膨脹，但「控制中樞要做的決策」必然需要看到會膨脹的東西。讓我把這拆開講。

先量一下 novel_06 的 flatten.md
141,692 bytes / 2,984 行
混合中英文 + YAML，粗估 50–80K tokens。這個檔案是靜態的，只要 novel_db 沒更新就一輩子不變。

哪些不膨脹（你說對的部分）
novel_06_zoshiu.flatten.md — 世界觀 bible，campaign 跑 100 回合也不會變
系統 prompt 模板（角色定位、輸出 schema、行為準則）
規則書、地圖、原作 NPC 設定參考
這些用 prompt caching（Anthropic / OpenAI 都支援，OpenRouter 透傳）就能解決：第一次付 50–80K input tokens 的全價，之後每回合那段重複內容只算 10% 的快取讀取費。Claude Sonnet 4.6 上大約是 $0.03/turn 的常數成本，可以接受。

哪些會膨脹（控制中樞不可能不看的部分）
如果控制中樞只拿到 flatten.md + 當前玩家動作，它沒辦法做以下決策：

它要做的判斷	它需要的狀態	這個狀態會膨脹嗎
「漏瑚這回合該講話嗎？」	上 3 回合誰講過、漏瑚的怒氣值	會
「玩家剛剛斬擊高熱外溢」這事誰知道？	在場名單、視線、witness_ids	會
「該不該揭露第二顆指？」	已揭露/未揭露 secrets 清單	會
「白川澪上次說了什麼？」	recent timeline	線性成長
「玩家現在欠誰人情？」	resolution 歷史、relationship state	會
flatten.md 是世界的常識，但 campaign 是這個世界裡正在發生的事。控制中樞要做調度，兩者都得看。

實際的 prompt 結構應該長這樣
[CACHED, 50–80K tokens, 永遠不變]
  - 系統 prompt + 輸出 schema
  - novel_06_zoshiu.flatten.md
  - rulebook
[VARIABLE, 動態組裝, 目標 < 8K tokens]
  - current_scene + 在場 NPC 名單
  - last_N_turns（壓縮後）
  - 各 NPC 的當前情緒/狀態快照
  - 未消耗的 director_notes
  - 玩家本回合的行動
  - retrieved memory chunks（embedding 檢索回來的相關片段）
cache 命中後，每回合實際付費的只有 variable 那 8K。這時候「線性膨脹」就被擋在 last_N_turns 那一格 — 你用滾動窗口 + 摘要壓縮（Opera 現在 memory.py 的 compress_memory_summaries 就是幹這個的）控制它不要超過 N 回合，整個 prompt 就有上界了。

所以結論是
不會線性膨脹 = 對的，前提是你用 prompt caching + 滾動窗口
「只用 flatten.md + 指令」= 不夠，控制中樞會像失憶症患者，每回合都不知道上一秒發生了什麼，根本沒辦法做調度
真正要設計的是 variable 區那 8K 怎麼挑 — 這才是這個架構成敗的關鍵；flatten.md 反而是最不需要操心的部分
順帶提一個現實考量：OpenRouter 不是所有 model 都吃 cache headers，要先看你要用的「不會失敗的模型」是哪一個。Anthropic 系列在 OpenRouter 上的 prompt caching 是支援的，OpenAI 系列也是；但部分中國/開源 model 可能透傳不過去 — 這會直接決定這個架構在實務上是「便宜常數成本」還是「每回合都全價燒」。

那你可以幫我研究看看市面上那些離線文字遊戲是如何做到無需LLM也可以進行敘事+數值判斷的嗎?

離線文字遊戲怎麼做「沒有 LLM 的敘事 + 數值判斷」
先講結論：他們其實沒在「生成」敘事，而是 author-time 寫一堆碎片內容，runtime 用規則挑選 + 模板填空。把這個觀念吃進去後，再看數值判斷就很簡單 — 全部都是骰子 + 表格查詢。

敘事生成的四種主流做法
1. 語法生成（Tracery 系）
Kate Compton 的 Tracery，context-free grammar + 權重隨機：

{
  "origin": "#hero# walked into #place# and found #object#.",
  "hero": ["Alice", "Bob"],
  "object": ["a sword", "a letter", "blood"]
}
Twitterbots、《Cheap Bots Done Quick》大量使用。優點是完全可預測、可審；缺點是 slot 間沒有上下文一致性（你可能抽到「Alice 走進酒館找到血」這種不協調組合）。適合做變化文案，不適合做主敘事。

2. 流程腳本語言（Ink / Twine / Yarn Spinner）
Ink 是 Inkle Studios 的開源敘事腳本，《80 Days》《Heaven's Vault》《Sorcery!》都用它：

=== meet_jogo ===
漏瑚低語：「人類……」
* [攻擊] -> attack_jogo
* [後退]
    { player.fear > 5: -> panic_retreat | -> careful_retreat }
特色：變數、條件、knot（subroutine）、weave（自動分支）、tags。整個劇本是有限狀態機，「智能」程度由作者預寫分支量決定。Twine 是 GUI 版（Harlowe / SugarCube 是兩種主流故事格式），Yarn Spinner 是 Unity 友好版（《Night in the Woods》《A Short Hike》）。

3. 戲劇管理器（Drama Manager — 學術界 / Façade / Versu）
Façade（Mateas & Stern, 2005，學術界最有名的互動戲劇）的核心：

把劇本拆成幾百個 beat（戲劇單元）
每個 beat 有先決條件、對「當前戲劇張力曲線」的貢獻數值、tags
玩家每次動作後，規劃器從可觸發 beats 裡挑一個最能把張力推到下一個目標點的
Versu（Inkle / Linden Lab, 2014 死掉的專案）走更激進的方向 — 角色有 desires、norms、social practices，每個 beat 描述「在這個社交情境下適合做什麼」。

這就是你「控制中樞」的學術原型。差別在於他們手寫所有 beats，你想讓 LLM 即時生成 — 但 beat 規劃 / 排序這層完全可以借鏡他們的演算法。

4. 模板事件 + 角色資料庫（CK3 / Wildermyth）
Crusader Kings 3 每個 event 是一個 script：

event = my_spouse_caught {
  trigger = {
    spouse = { has_secret = adultery }
    NOT = { has_trait = naive }
  }
  desc = "你走進房間，看見 [spouse.GetFirstName] 與 [lover.GetFirstName]..."
  option = { name = "暴怒" ... }
  option = { name = "隱忍" ... }
}
[spouse.GetFirstName] 從當前 game state 抓。一個 CK3 mod 可以有上萬個 events，靠 trigger 條件決定哪個觸發。Wildermyth 同樣概念但 event 更碎、更個人化（每個英雄都有自己的事件池）。

數值判斷的三種主流做法
1. d20 + DC（D&D 5e 系）
d20 + 修正 vs DC
四段結果：1 大失敗 / fail / success / 20 大成功
Opera 現在 rules.py 應該就是這套
2. PbtA 三段表（Powered by the Apocalypse）
2d6 + 屬性
6- / 7-9 / 10+ 三段
每段預寫具體後果清單，GM 不需要即興
PbtA 最優雅的點：partial success（7-9）不是「打折成功」，而是「成功 + GM 必須給你一個 complication」。每次擲骰都保證產出敘事推進，這對你 Opera 這種多 agent 系統非常關鍵 — 它消除了「擲完骰不知道接下來該演什麼」的空窗。

3. Mythic GME Fate Chart（單人 TTRPG / 無 GM 解算）
玩家對世界發問：「酒保認識我嗎？」，查 fate chart：

| Likelihood   | Chaos 4 | Chaos 5 | Chaos 6 |
|--------------|---------|---------|---------|
| Very Likely  |   85    |   90    |   95    |
| Likely       |   65    |   75    |   85    |
| 50/50        |   45    |   55    |   65    |
擲 d100 ≤ 對應數字 = yes，雙位數相同 = 觸發隨機事件（從 Event Meaning Table 抽兩個關鍵字，由玩家詮釋）。這是「程式不靠 LLM 也能做出 surprise narrative」的最古老技術，幾十年了。

最直接對應「控制中樞」的範本：RimWorld 的 Storyteller AI
RimWorld 三個 storyteller（Cassandra / Phoebe / Randy）完全不是 LLM，是個加權事件排程器：

每隔 N 天決定下個事件：
  1. 看時間軸：上次事件後多久？
  2. 看殖民地狀態：財富、人口、傷亡、心情
  3. 對每個可觸發 event 算 weight：
       weight = base_chance × difficulty_curve × state_modifier × recency_penalty
  4. 加權隨機選一個
  5. event 本體是預寫的，但「誰受傷/什麼動物攻擊」runtime 填
Cassandra 的「漸進難度曲線」不是寫死的，是根據玩家當前實力動態算的。Randy 純隨機反而是最受歡迎的 — 玩家喜歡無法預測的 storyteller。

兩個你可能沒注意到的東西
Inform 7 的「世界事實」模型
Inform 7（Graham Nelson 的 IF 作者工具）核心是一個事實資料庫：

The bronze key is in the chest.
The chest is closed and locked.
The key unlocks the chest.
Understand "open" as opening.
玩家輸 unlock chest with key → 系統查資料庫看條件 → 修改狀態 → 印出預寫描述。這套支撐了 Zork 之後 30 年的 IF 文化。對 Opera 的啟發：state 應該是「查得到、改得了、有語意」的事實，而不是現在 models.py 那種 raw_state_json 一坨 JSON。

Caves of Qud 的語意檢索 + Markov
Caves of Qud（roguelike）大量手寫 + Markov chain 生成 NPC 對話、廢墟銘文、歷史事件。獨特做法：每個 NPC 有 sphere of interest tags，玩家問問題時，系統從世界事件找 tag 重疊度最高的，套進對話模板。跟你前面提到的「NPC 知識範圍過濾」是同一件事，只是他們手刻了語料庫做為填空來源。

給 Opera 的三個直接可落地的啟發
1. 控制中樞的選角邏輯先用 salience 演算法寫，不要急著上 LLM

借 RimWorld 的加權打分：

def npc_salience(actor, scene, player_action, recent_turns):
    score = 0
    # 場景關鍵字命中
    score += keyword_overlap(actor.knowledge_scopes, scene.tags) * 3
    # 玩家動作觸發 tag
    score += tag_overlap(actor.metadata.triggers, player_action.intent_tags) * 5
    # 上次發言距今越久越想說話
    score += min(turns_since_last_spoke(actor, recent_turns), 5)
    # 立場與當前衝突相符度
    score += alignment_match(actor.stance, scene.conflict_axis) * 2
    return score

# actor_round 改成：
top_n = sorted(npcs, key=salience, reverse=True)[:max_actor_turns]
可預測、可 debug、零 API 成本，這層根本不需要 LLM。LLM 只負責生成被選中 NPC 的台詞。

2. rules_resolution 從 d20 升級成 PbtA 三段

rules.py 的 4 段（crit fail / fail / success / crit）改成 3 段（fail / partial / full），每段預寫 3-5 個敘事模板，slot 用角色名 + 動作填。partial success 那層特別有用 — 它強制每個失敗都帶推進，這正是你現在多 agent 系統最需要的「自動推情」。

3. 加 Mythic GME 的 oracle 層做便宜兜底

玩家提 yes/no 問題（「酒保認識我嗎？」「漏瑚會接受談判嗎？」），不一定走 LLM — fate chart + chaos factor 也能答，順便當作 LLM 失敗時的 fallback。chaos_factor 本身可以對應到 Opera 現有的 threat_clock（orchestrator.py:218-222）。

要不要我針對某一塊（例如 salience 公式的具體權重設計、PbtA 三段表的中文模板、fate chart 怎麼接 threat_clock）給更深入的設計？



