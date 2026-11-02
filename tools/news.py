"""Builds the app's news from public RSS feeds. Runs on GitHub Actions (free, no Claude).

Output (all in news/):
  b-<time>.json  only the headlines added in one run (never changed afterwards)
  index.json     list of batches from the last 30 days (tiny; the app reads this first)
  market.json    latest Sensex / Nifty close, taken from market-report headlines
  status.json    how many items each feed gave in the last run
Each item: section, topic, title, source, url, ts, date, points (key sentences), price, img.
"""
import json, re, time, html, urllib.request, email.utils, os, glob
from xml.etree import ElementTree as ET

GN = "https://news.google.com/rss/search?hl=en-IN&gl=IN&ceid=IN:en&q="
FEEDS = [
    # section, source name, url, google-news?
    ("maritime", "Marine Insight", "https://www.marineinsight.com/feed/", False),
    ("maritime", "gCaptain", "https://gcaptain.com/feed/", False),
    ("maritime", "Splash247", "https://splash247.com/feed/", False),
    ("maritime", "Hellenic Shipping News", "https://www.hellenicshippingnews.com/feed/", False),
    ("maritime", "Google News", GN + "%22DG+Shipping%22+OR+%22Indian+seafarers%22+OR+%22Indian+seafarer%22+when:14d", True),
    ("maritime", "Google News", GN + "tanker+OR+%22LNG+carrier%22+OR+%22LPG+carrier%22+shipping+when:7d", True),
    ("maritime", "Google News", GN + "seafarers+OR+%22merchant+navy%22+OR+piracy+ship+when:7d", True),
    ("india", "The Hindu", "https://www.thehindu.com/news/national/feeder/default.rss", False),
    ("india", "India Today", "https://www.indiatoday.in/rss/1206514", False),
    ("india", "News18", "https://www.news18.com/commonfeeds/v1/eng/rss/india.xml", False),
    ("india", "Times of India", "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms", False),
    ("india", "NDTV", "https://feeds.feedburner.com/ndtvnews-india-news", False),
    ("india", "Hindustan Times", "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml", False),
    ("markets", "Moneycontrol", "https://www.moneycontrol.com/rss/marketreports.xml", False),
    ("markets", "Moneycontrol", "https://www.moneycontrol.com/rss/business.xml", False),
    ("markets", "Economic Times", "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", False),
    ("markets", "Mint", "https://www.livemint.com/rss/markets", False),
    ("markets", "Business Standard", "https://www.business-standard.com/rss/markets-106.rss", False),
    ("markets", "BusinessLine", "https://www.thehindubusinessline.com/markets/feeder/default.rss", False),
    ("tech", "Rushlane", "https://www.rushlane.com/feed", False),
    ("tech", "MotorBeam", "https://www.motorbeam.com/feed/", False),
    ("tech", "CarToq", "https://www.cartoq.com/feed/", False),
    ("tech", "GaadiWaadi", "https://gaadiwaadi.com/feed/", False),
    ("tech", "Gadgets 360", "https://feeds.feedburner.com/gadgets360-latest", False),
    ("tech", "Smartprix", "https://www.smartprix.com/bytes/feed/", False),
    ("tech", "Beebom", "https://beebom.com/feed/", False),
]
TOPIC_RULES = {
    "maritime": [
        ("India & Seafarers", r"\b(india|indian|dg shipping|dgs|dgma|directorate general of shipping|mumbai|jnpt|kandla|deendayal|chennai|kochi|cochin|vizag|paradip|mundra|seafarers?|crew change|crew welfare|merchant navy)\b"),
        ("Safety & Security", r"\b(pira(cy|tes?)|attack|houthi|hijack|collision|fire|explosion|sank|sink(ing|s)?|grounded|grounding|detain(ed|s)?|detention|spill|rescue|missing|casualt|seized|capsiz|accident|injur|killed|dead)"),
        ("LNG & Gas", r"\b(lng|lpg|gas carrier|ammonia carrier|vlgc)\b"),
        ("Tankers", r"\b(tankers?|vlcc|suezmax|aframax|lr2|mr tanker|crude|product tanker|chemical tanker|shadow fleet)\b"),
        ("Regulation", r"\b(imo|mepc|regulation|marpol|solas|stcw|mlc|eexi|cii|emission|sanction|flag state|port state|psc)\b"),
        ("Markets & Trade", r"\b(rates?|freight|market|demand|charter|earnings|price|orderbook|newbuild|trade|exports?|imports?)\b"),
    ],
    "india": [
        ("Politics", r"\b(bjp|congress|election|polls?|minister|parliament|lok sabha|rajya sabha|government|cm|chief minister|party|modi|rahul)\b"),
        ("Courts & Law", r"\b(court|sc|supreme court|high court|hc|judge|verdict|bail|petition|cbi|ed|police|arrest)"),
        ("Economy", r"\b(gdp|inflation|rbi|budget|tax|gst|economy|jobs|employment|trade)\b"),
        ("Weather & Disaster", r"\b(rain|monsoon|cyclone|flood|heatwave|earthquake|landslide|weather|imd)\b"),
    ],
    "markets": [
        ("IPO", r"\b(ipo|listing|subscription|gmp|anchor investors?)\b"),
        ("Mutual funds", r"\b(mutual funds?|sip|nfo|amc|nav)\b"),
        ("Commodities", r"\b(gold|silver|crude|oil prices?|commodit|metal)\b"),
        ("Economy", r"\b(rbi|repo|inflation|gdp|fii|fpi|rupee|bond|yield|fed)\b"),
        ("Stocks", r"\b(sensex|nifty|shares?|stocks?|target price|buy|sell|q[1-4]|results|profit|earnings|dividend)\b"),
    ],
    "tech": [
        ("Bikes", r"\b(bikes?|motorcycles?|scooters?|two-wheelers?|royal enfield|bajaj|tvs|hero motocorp|hero|ktm|yamaha|ather|ola electric|honda activa|suzuki access|harley|triumph|kawasaki|husqvarna|jawa|yezdi)\b"),
        ("Cars", r"\b(cars?|suvs?|sedans?|hatchbacks?|mpvs?|ev|electric car|maruti|tata motors|tata|mahindra|hyundai|kia|toyota|honda city|honda elevate|mg|skoda|volkswagen|vw|bmw|mercedes|audi|citroen|nissan|renault|jeep|byd|volvo|lexus|porsche)\b"),
        ("Phones & gadgets", r"\b(phones?|smartphones?|iphone|galaxy|oneplus|xiaomi|redmi|realme|vivo|oppo|iqoo|poco|nothing phone|pixel|motorola|laptops?|tablets?|ipad|earbuds|tws|smartwatch|watch|tv|gadgets?|processor|snapdragon|android|ios)\b"),
    ],
}
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
NS = {"content": "http://purl.org/rss/1.0/modules/content/", "media": "http://search.yahoo.com/mrss/"}
KEEP_DAYS, PER_FEED = 30, 40
BOILER = re.compile(r"(the post .*? appeared first on.*$|read more.*$|also read.*$|click here.*$|subscribe to.*$|follow us on.*$|download the app.*$|\(this story has not been edited.*$|disclaimer:.*$)", re.I)

def plain(s):
    s = re.sub(r"<(script|style|figure|figcaption)[^>]*>.*?</\1>", " ", s or "", flags=re.S | re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()

def topic(sec, t):
    for name, rx in TOPIC_RULES.get(sec, []):
        if re.search(rx, t, re.I):
            return name
    return "Gadgets" if sec == "tech" else "General"

ABBR = re.compile(r"\b(Rs|Mr|Mrs|Ms|Dr|No|Nos|vs|Ltd|Inc|Co|St|Jr|Sr|Govt|Dept|approx|est|e\.g|i\.e|U\.S|U\.K)\.\s?", re.I)

def sentences(text):
    text = BOILER.sub("", text)
    text = ABBR.sub(lambda m: m.group(1).replace(".", "\u2024") + "\u2024 " if m.group(1).lower() != "rs" else "Rs ", text)
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"“‘₹(])", text)
    return [p.strip().replace("\u2024", ".") for p in parts if 40 <= len(p.strip()) <= 320]

def key_points(title, text, n=4):
    """Pick the most informative sentences (facts: numbers, names, places), keep them in article order."""
    sents = sentences(text)[:14]
    if not sents:
        return []
    tw = {w for w in re.findall(r"[a-z]{4,}", title.lower())}
    scored = []
    for i, s in enumerate(sents):
        low = s.lower()
        if low[:60] in title.lower() or title.lower()[:60] in low:
            continue
        sc = 0.0
        sc += 2.0 if re.search(r"\d", s) else 0
        sc += 1.5 if re.search(r"₹|rs\.?\s?\d|\$\s?\d|%|lakh|crore|km|kmpl|bhp|ps\b|nm\b|kwh|mah|mp\b|gb\b", low) else 0
        sc += min(2.0, 0.4 * len(re.findall(r"(?<!^)(?<![.!?]\s)\b[A-Z][a-z]+", s)))
        sc += min(2.0, 0.5 * len(tw & set(re.findall(r"[a-z]{4,}", low))))
        sc += max(0.0, 1.6 - 0.25 * i)
        sc -= 1.5 if re.search(r"\b(i|we|you|our|my)\b", low) and i > 2 else 0
        scored.append((sc, i, s))
    best = sorted(sorted(scored, reverse=True)[:n], key=lambda x: x[1])
    return [s if len(s) <= 260 else s[:257].rsplit(" ", 1)[0] + "…" for _, _, s in best]

PRICE = re.compile(r"(?:₹|rs\.?|inr)\s?\d[\d,]*(?:\.\d+)?\s?(?:lakh|lakhs|crore|cr|k)?(?:\s?(?:-|–|to)\s?(?:₹|rs\.?|inr)?\s?\d[\d,]*(?:\.\d+)?\s?(?:lakh|lakhs|crore|cr|k)?)?(?:\s?\(?ex-showroom\)?)?", re.I)

NOT_PRICE = re.compile(r"^\W{0,3}(?:\w+\W+){0,3}?(discount|cashback|off\b|bank|emi|exchange|bonus|coupon|savings?|benefits?|per month|/month|subsidy|token|booking amount)", re.I)

def find_price(title, text):
    text = re.sub(r"(?i)\brs\.\s?", "Rs ", text[:2500])
    title = re.sub(r"(?i)\brs\.\s?", "Rs ", title)
    best, best_sc = "", -9
    for src, bonus in ((title, 2), (text, 0)):
        for m in PRICE.finditer(src):
            p = m.group(0)
            if len(re.sub(r"\D", "", p)) < 3:
                continue
            before, after = src[max(0, m.start() - 45): m.start()].lower(), src[m.end(): m.end() + 40]
            if NOT_PRICE.search(after) or re.search(r"(discount|cashback|off|save|saving|bank offer|emi)\W*$", before):
                continue
            sc = bonus + (3 if re.search(r"(priced|price|starts?|starting|launched|costs?|tag|ex-showroom|retail)", before + after[:20]) else 0) - m.start() / 2000
            if sc > best_sc:
                best, best_sc = p, sc
    return tidy_price(best) if best else ""

def tidy_price(p):
    p = re.sub(r"(?i)^(rs\.?|inr)\s?", "₹", p.strip())
    p = re.sub(r"(?i)(-|–|to)\s?(rs\.?|inr)\s?", r"\1 ₹", p)
    return re.sub(r"\s+", " ", p).strip(" ,.")

def image_of(it, content, desc):
    for tag in ("media:content", "media:thumbnail"):
        for el in it.findall(tag, NS):
            u = el.get("url", "")
            if u.startswith("http") and (el.get("medium") in (None, "image") or re.search(r"\.(jpe?g|png|webp)", u, re.I)):
                return u
    enc = it.find("enclosure")
    if enc is not None and (enc.get("type", "").startswith("image") or re.search(r"\.(jpe?g|png|webp)", enc.get("url", ""), re.I)):
        return enc.get("url", "")
    m = re.search(r"<img[^>]+src=[\"']([^\"']+)[\"']", (content or "") + (desc or ""), re.I)
    return m.group(1) if m and m.group(1).startswith("http") else ""

def read(sec, name, url, gn):
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
        if not title or not link.startswith("https://"):
            continue
        content = it.findtext("content:encoded", default="", namespaces=NS) or ""
        desc = it.findtext("description") or ""
        text = "" if gn else plain(content if len(plain(content)) > len(plain(desc)) else desc)
        pts = key_points(title, text) if text else []
        n = {"sec": sec, "title": title, "source": src, "url": link, "ts": ts,
             "date": time.strftime("%Y-%m-%d", time.gmtime(ts / 1000)) if ts else "",
             "topic": topic(sec, title + " " + text[:400]), "points": pts}
        if sec == "tech":
            p = find_price(title, text)
            if p:
                n["price"] = p
        img = "" if gn else image_of(it, content, desc)
        if img:
            n["img"] = img
        out.append(n)
    return out[:PER_FEED]

def key(n):
    return re.sub(r"[^a-z0-9]", "", n["title"].lower())[:70]

# ---------- market close line, from market-report headlines ----------
def num(s):
    try:
        return float(s.replace(",", ""))
    except Exception:
        return None

def index_move(name, text, lo, hi):
    m = re.search(name + r"\b(?:[^.;|]|\.(?=\d)){0,90}?\b(\d{2,3},\d{3}(?:\.\d+)?|\d{5,6}(?:\.\d+)?)", text, re.I)
    if not m:
        return None
    v = num(m.group(1))
    if v is None or not (lo <= v <= hi):
        return None
    seg = text[m.start(): m.end() + 80]
    nxt = re.search(r"\b(sensex|nifty|bank nifty|midcap|smallcap)\b", seg[len(name.split("(")[0]) + 1:], re.I)
    if nxt:
        seg = seg[: len(name.split("(")[0]) + 1 + nxt.start()]
    ch = re.search(r"(\d[\d,]*(?:\.\d+)?)\s*(?:pts|points)", seg, re.I)
    pc = re.search(r"(\d+(?:\.\d+)?)\s*(?:%|per ?cent)", seg, re.I)
    down = re.search(r"\b(down|lower|falls?|fell|slips?|slipped|declines?|declined|drops?|dropped|sheds?|lose[s]?|lost|tumbles?|crash|sinks?|sank|in red|snaps?)\b", seg, re.I)
    up = re.search(r"\b(up|higher|gains?|gained|rises?|rose|jumps?|jumped|climbs?|climbed|surges?|surged|rall(y|ies|ied)|adds?|added|in green|extends?)\b", seg, re.I)
    sign = -1 if down and (not up or down.start() < up.start()) else (1 if up else 0)
    approx = bool(re.search(r"\b(above|below|around|near|over|under)\s+$", text[max(0, m.start(1) - 12): m.start(1)], re.I))
    return {"v": v, "approx": approx, "ch": (num(ch.group(1)) * sign) if ch and sign else None, "pct": (num(pc.group(1)) * sign) if pc and sign else None}

def market_line(items):
    best = None
    for with_points in (False, True):
      for n in sorted(items, key=lambda x: x.get("ts") or 0, reverse=True):
        if n.get("sec") != "markets" or re.search(r"\b(outlook|prediction|preview|ahead of|what to expect|trade setup|pre-?market|gift nifty)\b", n["title"], re.I):
            continue
        t = n["title"] + (". " + " ".join(n.get("points", [])[:2]) if with_points else "")
        if not re.search(r"\b(close|closes|closed|closing|ends?|ended|settles?|settled|end of day|wrap)\b", t, re.I):
            continue
        sx, nf = index_move("sensex", t, 40000, 200000), index_move("nifty(?: 50)?", t, 10000, 60000)
        if sx or nf:
            cand = {"date": n.get("date"), "ts": n.get("ts"), "sensex": sx, "nifty": nf, "title": n["title"], "source": n["source"], "url": n["url"]}
            if not best or (sx and nf and not (best["sensex"] and best["nifty"])):
                best = cand
            if sx and nf:
                return best
      if best:
        return best
    return best

# ---------- main ----------
root_dir = os.path.join(os.path.dirname(__file__), "..")
ndir = os.path.join(root_dir, "news")
os.makedirs(ndir, exist_ok=True)
now = int(time.time() * 1000)
keep_from = now - KEEP_DAYS * 86400000
seen_k, seen_u, recent = set(), set(), []
for f in glob.glob(os.path.join(ndir, "b-*.json")):
    t = int(re.search(r"b-(\d+)\.json$", f).group(1))
    if t < keep_from:
        os.remove(f)
        continue
    try:
        for n in json.load(open(f)).get("items", []):
            seen_k.add(key(n)); seen_u.add(n.get("url"))
            recent.append(n)
    except Exception:
        pass
status, new_items = {}, []
for sec, name, url, gn in FEEDS:
    try:
        items = read(sec, name, url, gn)
        status[name + " (" + sec + ")"] = len(items)
    except Exception as e:
        status[name + " (" + sec + ")"] = "failed: " + str(e)[:80]
        continue
    for n in items:
        if (n.get("ts") or now) < keep_from:
            continue
        k = key(n)
        if k in seen_k or n["url"] in seen_u:
            continue
        n["addedAt"] = now
        seen_k.add(k); seen_u.add(n["url"])
        new_items.append(n)
ok = sum(1 for v in status.values() if isinstance(v, int))
if ok == 0:
    raise SystemExit("all feeds failed")
ipath = os.path.join(ndir, "index.json")
try:
    idx = json.load(open(ipath))
except Exception:
    idx = {"since": now, "batches": []}
if new_items:
    new_items.sort(key=lambda n: n.get("ts") or 0, reverse=True)
    json.dump({"t": now, "items": new_items}, open(os.path.join(ndir, f"b-{now}.json"), "w"), separators=(",", ":"), ensure_ascii=False)
    idx["batches"].append({"t": now, "n": len(new_items)})
idx["batches"] = [b for b in idx["batches"] if b["t"] >= keep_from and os.path.exists(os.path.join(ndir, f"b-{b['t']}.json"))]
idx["since"] = max(idx.get("since", now), keep_from) if idx.get("since", now) < keep_from else idx.get("since", now)
idx["updatedAt"] = now
idx["keepDays"] = KEEP_DAYS
idx["v"] = 2
json.dump(idx, open(ipath, "w"), separators=(",", ":"))
ml = market_line(new_items + recent)
if ml:
    json.dump(ml, open(os.path.join(ndir, "market.json"), "w"), separators=(",", ":"), ensure_ascii=False)
json.dump({"at": now, "feeds": status, "new": len(new_items),
           "bySection": {s: sum(1 for n in new_items if n["sec"] == s) for s in ("maritime", "india", "markets", "tech")},
           "withPoints": sum(1 for n in new_items if n.get("points")), "withImage": sum(1 for n in new_items if n.get("img")),
           "withPrice": sum(1 for n in new_items if n.get("price"))},
          open(os.path.join(ndir, "status.json"), "w"), indent=1, ensure_ascii=False)
print(f"{len(new_items)} new items from {ok}/{len(FEEDS)} feeds; index has {len(idx['batches'])} batches")
for k, v in status.items():
    print(f"  {k}: {v}")
