# novel_02 組織新增條目

> 新增來源：`bible/organizations.yaml`
> 新增項目：空騎團、帝國第一聖殿騎士團、特別調查組（子單位）

---

## organizations

```yaml
  - id: sky-rider-corps
    name: 空騎團
    aliases:
      - 空騎
    category: autonomous_neutral_knighthood
    first_appearance: world-bible
    summary: >
      空騎團是現存騎士團中立場最為徹底的一支，不附屬於任何政治實體，
      以高機動偵查能力與微型魔導飛行器聞名於世。
      旗下設有特別調查組，負責處理敏感性高或跨地區的複雜任務。
      總部為一座位置不對外公開的自主漂浮高空堡壘，是空騎團行動自由與中立身分的物質保障。
    origin:
      founding_nature: 具體建立歷史未公開
      development: >
        空騎團的核心技術體系——微型魔導飛行器與漂浮高空堡壘——早於現有紀錄，
        其起源與創始者至今未有官方說法。
    governance:
      central_authority: 團長（具體職位結構未公開）
      headquarters:
        type: 自主漂浮高空堡壘
        location: 位置不對外公開
        access_restriction: >
          堡壘位於超出一般飛行器可達高度的空層，亦高於空騎團飛行器的已知高度上限，
          外界無法主動接觸；空騎團成員的往返方式不對外透露。
      internal_units:
        - id: sky-rider-special-investigation-unit
          name: 特別調查組
    political_position:
      stance: 完全中立
      recognized_by:
        - 艾瑟蘭帝國（承認但不控制）
        - 其他主要政治實體（普遍承認其中立資格）
      limitations:
        - 不代表任何政治實體行動。
        - 不承接具有明確政治傾向的委託。
        - 成員在任職期間個人政治立場不得影響公務行動。
      importance: >
        中立地位是空騎團得以跨越各方政治壁壘自由行動的核心保障；
        一旦中立性受到質疑，其存在價值與各方的容忍度均會受到根本性動搖。
    capabilities:
      primary_strengths:
        - 高機動偵查
        - 空中情報收集
        - 快速部署與撤離
      equipment:
        - name: 微型魔導飛行器
          description: >
            空騎團獨有技術，單人或雙人操控，機動性遠超一般載具；
            具體構造與推進原理不對外公開。
          known_limitation: 存在已知高度上限，無法接近日宮所在高層空域。
        - name: 自主漂浮高空堡壘
          description: >
            空騎團總部，位於不對外公開的空層，可自主維持漂浮與運行，
            不依賴地面基礎設施。
    membership:
      recruitment:
        - 對外設有公開招募考核，通過者方能成為正式騎士。
        - 考核標準嚴苛，年齡最小通過紀錄由艾拉·芙萊爾保持。
      species_restriction: 未公開明確限制，但成員組成以人類為主。
      known_members:
        - id: aella-flair
          role: 特別調查組副隊長
    related_systems:
      - id: knighthood-system
        relationship: >
          空騎團符合騎士團認定三條件之一——具有舉世公認的特殊功績——
          同時以中立立場運作，不依賴政治實體授予資格。
    related_entities:
      - first-continent-aethlan-empire
    narrative_functions:
      - 提供跨政治實體的中立偵查與情報力量，可在各方衝突中作為資訊來源或中間人。
      - 高空堡壘與飛行器是世界觀中少數能接近上層空域的存在，與日月神殿的謎題直接相關。
      - 特別調查組可承接敏感、跨境或政治上不方便由帝國直接出面的任務。
      - 艾拉·芙萊爾作為最年輕副隊長，其成長弧線可與組織內部張力產生互動。
    continuity_notes:
      - 高空堡壘位置嚴格保密，任何描寫不應透露其具體座標或接觸方式。
      - 空騎團飛行器有高度上限，日宮附近空域已超出其可達範圍，此為已建立的物理限制。
      - 空騎團中立性是核心設定，後續描寫若涉及其捲入政治事件，須處理此張力而非迴避。
      - 招募考核公開存在，但考核內容與錄取標準不對外公開。

  - id: first-imperial-temple-knights
    name: 帝國第一聖殿騎士團
    aliases:
      - 第一聖殿騎士團
      - 聖殿騎士團
    category: imperial_religious_holy_order
    first_appearance: world-bible
    summary: >
      帝國第一聖殿騎士團由人神親自認可，以消滅魔族為核心使命。
      對外形象為全員人類的純粹聖戰力量，然而現任團長實為半神族，
      團內亦存在極少數非人類成員，此事於外界幾乎完全不為人知。
      其宗教合法性建立在人神的認可之上，政治上與帝國深度綁定，
      但神學上的超然地位使其同時擁有獨立於世俗皇權的特殊立場。
    origin:
      founded_by: 人神（認可者）
      founding_nature: 神明直接認可的聖戰騎士團
      development: >
        由人神親自認可建立，以人族對抗魔族的聖戰使命為核心，
        在帝國內部積累深厚宗教威望與政治話語權。
        人神離去後，騎士團以繼承神明意志自居，其制度正統性延續至今。
    governance:
      central_authority: 團長（現任為半神族，對外身分保密）
      internal_hierarchy: 具體層級架構未公開
      succession_principle: 未公開
    political_position:
      stance: 名義上效忠帝國，實際上持有宗教獨立地位
      recognized_by:
        - 艾瑟蘭帝國（深度政治綁定）
        - 各人類聚居地（廣泛的民間宗教合法性）
      limitations:
        - 宗教使命優先於世俗皇權，兩者衝突時以神明意志詮釋為準。
        - 反魔族立場使其在涉及魔族的政治判斷上缺乏彈性。
      tensions:
        - 帝國皇室對騎士團宗教號召力的依賴與忌憚並存。
        - 人類平民院崛起可能強化騎士團在帝國內部的政治影響力。
        - 騎士團對非人類成員的內部管理與對外形象之間存在結構性矛盾。
    public_image:
      perceived_composition: 全員人類
      actual_composition: >
        以人類為絕對主體；現任團長為半神族，另有極少數非人類成員，
        外界幾乎完全不知情。
      image_management: >
        騎士團刻意維護全員人類的公開形象，此形象對其宗教合法性與民間動員力至關重要；
        非人類成員的存在屬於嚴格保密的內部事務。
    mission:
      primary: 消滅魔族
      theological_basis: >
        人神認可賦予騎士團對抗黑暗次元與魔族的神聖使命，
        成員普遍視此任務為對神明意志的直接繼承與履行。
      scope:
        - 主動追蹤並消滅魔族個體與聚落
        - 協助帝國處理魔族威脅
        - 在民間維護對抗魔族的宗教信念
    known_secrets:
      - 現任團長為半神族，對外身分嚴格保密。
      - 團內存在極少數非人類成員，與對外形象存在根本性落差。
      - 人神離去後，騎士團對「神明意志」的詮釋權實際上由騎士團自身掌握。
    related_systems:
      - id: knighthood-system
        relationship: >
          獲人神親自認可，同時具備帝國政治承認，
          是騎士團三種認定條件中最具宗教份量的一類。
      - id: human-god-faith
        relationship: >
          建立在人神認可之上，人神離去後以「繼承神明意志」維持神學正統性；
          詮釋權的歸屬是潛在的制度張力來源。
    related_entities:
      - first-continent-aethlan-empire
      - human-god
    narrative_functions:
      - 在反魔族敘事中作為正統宗教力量登場，可與其他陣營形成使命上的衝突或合作。
      - 現任團長為半神族一事，是可用於解構「純粹聖戰」形象的重要伏筆。
      - 對魔族的強硬立場使其在涉及魔族個體立場複雜化時成為製造張力的外部壓力源。
      - 騎士團的宗教號召力可作為帝國內部政治博弈的籌碼或戰場。
      - 神明離去後「意志詮釋權」歸屬的問題，可作為騎士團內部路線分歧的潛在引爆點。
    continuity_notes:
      - 團長為半神族屬於高度保密資訊，正文中除非到達對應劇情節點，否則不應從騎士團視角主動透露。
      - 外界描寫騎士團時應維持「全員人類」的認知基準，與實際情況的落差可作為後續揭露伏線。
      - 人神離去後的神學詮釋問題不應輕易解決，此張力應在騎士團相關劇情中持續存在。
      - 騎士團與帝國的關係是相互利用而非單純從屬，描寫時應體現雙方各自的盤算。
```

---

## organization_units

```yaml
  - id: sky-rider-special-investigation-unit
    name: 特別調查組
    parent_organization: sky-rider-corps
    category: specialized_operational_unit
    summary: >
      空騎團下設的精銳單位，負責處理敏感性高、涉及跨地區或情報複雜度超出一般任務的案件。
      成員編制較小，任務自由度高，在空騎團整體中立框架內享有較大的行動彈性。
    authority_scope: 由空騎團團長直接授權，不受地域限制
    known_members:
      - id: aella-flair
        role: 副隊長
        notes: >
          有記錄以來通過空騎團外部招募考核年齡最小的正式騎士，
          亦是特別調查組最年輕的副隊長。
    notes:
      - 特別調查組隊長身分未公開。
      - 成員確切人數不對外公開。
      - 任務性質通常不對外公告，完成情況亦不進入一般委託結算流程。
```
