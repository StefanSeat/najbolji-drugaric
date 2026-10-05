"""Pravi data.json iz izvoza claude.ai baze (folder sa events/*.json).

Upotreba: python3 tools/build_data.py <izvoz_folder>
Ispisuje "promenjeno" ili "isto".
"""
import glob, json, os, sys

src = sys.argv[1]
events = []
for f in sorted(glob.glob(os.path.join(src, "events", "*.json"))):
    d = json.load(open(f, encoding="utf-8"))
    d = d.get("data", d)
    e = {k: d[k] for k in ("who", "action", "label", "pts", "note", "date", "createdAt") if k in d}
    e["id"] = os.path.basename(f)[:-5]
    events.append(e)
events.sort(key=lambda e: (e.get("date", ""), e.get("createdAt", 0)))
out = json.dumps(events, ensure_ascii=False, indent=1) + "\n"
path = os.path.join(os.path.dirname(__file__), "..", "data.json")
old = open(path, encoding="utf-8").read() if os.path.exists(path) else ""
if old != out:
    open(path, "w", encoding="utf-8").write(out)
    print("promenjeno")
else:
    print("isto")
