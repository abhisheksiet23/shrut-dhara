import importlib, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
CHAPTERS = [
 (1, "शस्त्रपरिज्ञा", "ch01", None),
 (2, "लोकविजय", "ch02", None),
 (3, "शीतोष्णीय", "ch03", None),
 (4, "सम्यक्त्व", "ch04", None),
 (5, "लोकसार", "ch05", None),
 (6, "धूत", "ch06", None),
 (7, "महापरिज्ञा", None, "This chapter has not survived, so it has no sutras."),
 (8, "विमोक्ष", "ch08", None),
 (9, "उपधानश्रुत", "ch09", None),
]
def build(out):
    chapters = []
    for number, title, mod, note in CHAPTERS:
        entry = {"number": number, "title": title, "sections": []}
        if note: entry["note"] = note
        if mod and os.path.exists(os.path.join(os.path.dirname(__file__), mod + ".py")):
            m = importlib.import_module(mod)
            pr = getattr(m, "PRAKRIT", {})
            for si, (stitle, units) in enumerate(m.LESSONS, start=1):
                us = []
                for ui, text in enumerate(units, start=1):
                    u = {"n": ui, "meaning": text, "status": "draft"}
                    p = pr.get((si, ui))
                    if p: u["prakrit"] = p
                    us.append(u)
                entry["sections"].append({"number": si, "title": stitle, "units": us})
        elif not note:
            continue
        chapters.append(entry)
    doc = {
        "id": "acharanga:1:jacobi1884",
        "revision": "hindi-meaning-r2",
        "title": "आचारांग सूत्र · प्रथम श्रुतस्कन्ध",
        "source": {
            "label": "Hermann Jacobi, Jaina Sutras Part I, 1884 (Sacred Books of the East, vol. 22)",
            "url": "https://en.wikisource.org/wiki/Sacred_Books_of_the_East/Volume_22/%C3%82k%C3%A2r%C3%A2%E1%B9%85ga_S%C3%BBtra",
            "note": "Units follow the numbering of Jacobi’s English translation. The Hindi meanings are written for each unit; Prakrit, where shown, is from the Āgamodaya Samiti edition of 1916.",
        },
        "chapters": chapters,
    }
    os.makedirs(os.path.dirname(out), exist_ok=True)
    json.dump(doc, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    n = sum(len(s["units"]) for c in chapters for s in c["sections"])
    print("units", n, "chapters", len(chapters))
if __name__ == "__main__":
    build(sys.argv[1])
