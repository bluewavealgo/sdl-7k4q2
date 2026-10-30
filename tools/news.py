"""Builds news.json from public shipping RSS feeds. Runs on GitHub Actions (free, no Claude)."""
import json, re, time, html, urllib.request, email.utils, os
from xml.etree import ElementTree as ET

FEEDS = [
    ("Marine Insight", "https://www.marineinsight.com/feed/", False),
    ("gCaptain", "https://gcaptain.com/feed/", False),
    ("Splash247", "https://splash247.com/feed/", False),
    ("SAFETY4SEA", "https://safety4sea.com/feed/", False),
    ("Hellenic Shipping News", "https://www.hellenicshippingnews.com/feed/", False),
    ("Google News", "https://news.google.com/rss/search?q=%22DG+Shipping%22+OR+%22Indian+seafarers%22+OR+%22Indian+seafarer%22+when:14d&hl=en-IN&gl=IN&ceid=IN:en", True),
    ("Google News", "https://news.google.com/rss/search?q=tanker+OR+%22LNG+carrier%22+OR+%22LPG+carrier%22+shipping+when:7d&hl=en-IN&gl=IN&ceid=IN:en", True),
    ("Google News", "https://news.google.com/rss/search?q=seafarers+OR+%22merchant+navy%22+OR+piracy+ship+when:7d&hl=en-IN&gl=IN&ceid=IN:en", True),
]
RULES = [
    ("India & Seafarers", r"\b(india|indian|dg shipping|dgs|dgma|directorate general of shipping|mumbai|jnpt|kandla|deendayal|chennai|kochi|cochin|vizag|paradip|mundra|seafarers?|crew change|crew welfare|merchant navy)\b"),
    ("Safety & Security", r"\b(pira(cy|tes?)|attack|houthi|hijack|collision|fire|explosion|sank|sink(ing|s)?|grounded|grounding|detain(ed|s)?|detention|spill|rescue|missing|casualt|seized|capsiz|accident|injur|killed|dead)"),
    ("LNG & Gas", r"\b(lng|lpg|gas carrier|ammonia carrier|vlgc)\b"),
    ("Tankers", r"\b(tankers?|vlcc|suezmax|aframax|lr2|mr tanker|crude|product tanker|chemical tanker|shadow fleet)\b"),
    ("Regulation", r"\b(imo|mepc|regulation|marpol|solas|stcw|mlc|eexi|cii|emission|sanction|flag state|port state|psc)\b"),
    ("Markets & Trade", r"\b(rates?|freight|market|demand|charter|earnings|price|orderbook|newbuild|trade|exports?|imports?)\b"),
]
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"

def plain(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    return re.sub(r"\s+", " ", html.unescape(s)).strip()

def words(t, n=28):
    w = t.split(" ")
    return " ".join(w[:n]) + "…" if len(w) > n else t

def topic(t):
    for name, rx in RULES:
        if re.search(rx, t, re.I):
            return name
    return "General"

def read(name, url, gn):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/xml, text/xml, */*"})
    raw = urllib.request.urlopen(req, timeout=25).read()
    root = ET.fromstring(raw)
    out = []
    for it in root.iter("item"):
        title = plain(it.findtext("title"))
        link = (it.findtext("link") or "").strip()
        src = name
        if gn:
            m = re.match(r"^(.*) - ([^-]{2,60})$", title)
            if m:
                title, src = m.group(1).strip(), m.group(2).strip()
            elif it.findtext("source"):
                src = it.findtext("source").strip()
        try:
            ts = int(email.utils.parsedate_to_datetime(it.findtext("pubDate")).timestamp() * 1000)
        except Exception:
            ts = 0
        desc = "" if gn else plain(it.findtext("description"))
        desc = re.sub(r"The post .*? appeared first on .*$", "", desc).strip()
        if not title or not link.startswith("https://"):
            continue
        out.append({"title": title, "source": src, "url": link, "ts": ts,
                    "date": time.strftime("%Y-%m-%d", time.gmtime(ts / 1000)) if ts else "",
                    "summary": words(desc), "topic": topic(title + " " + desc)})
    return out[:25]

def key(n):
    return re.sub(r"[^a-z0-9]", "", n["title"].lower())[:70]

path = os.path.join(os.path.dirname(__file__), "..", "news.json")
try:
    old = json.load(open(path))
except Exception:
    old = {"items": []}
now = int(time.time() * 1000)
have = {key(n): n for n in old.get("items", [])}
urls = {n.get("url") for n in old.get("items", [])}
ok = 0
for name, url, gn in FEEDS:
    try:
        items = read(name, url, gn)
        ok += 1
        print(f"{name}: {len(items)} items")
    except Exception as e:
        print(f"{name}: failed ({e})")
        continue
    for n in items:
        k = key(n)
        if k not in have and n["url"] not in urls:
            n["addedAt"] = now
            have[k] = n
            urls.add(n["url"])
cutoff = now - 14 * 86400000
items = [n for n in have.values() if (n.get("ts") or now) >= cutoff]
items.sort(key=lambda n: n.get("ts") or 0, reverse=True)
items = items[:80]
if ok == 0:
    raise SystemExit("all feeds failed")
json.dump({"updatedAt": now, "feedsOk": ok, "items": items}, open(path, "w"), indent=1, ensure_ascii=False)
print(f"news.json: {len(items)} items from {ok} feeds")
