import json, os, random, re, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
ENGINE = os.path.join(ROOT, "engine")

KEYWORDS_FILE = os.path.join(DATA, "keywords.json")
MEMORY_FILE = os.path.join(DATA, "memory.json")

DISPATCH_URL = "https://webmastereric.github.io/Chicago-jump-start-dispatch/"
WOO_URL = "https://store.webmastereric.com/product/chicago-mobile-jump-start/"

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")

def foundation_page(spokes):
    links = "\n".join(
        [f'<li><a href="{s}">{s.replace("-", " ").replace(".html","").title()}</a></li>' for s in spokes]
    )

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Chicago Jump Start & Dead Car Battery Help</title>
<meta name="description" content="Dead car battery in Chicago? Flat $75 mobile jump start. Same day service possible, sometimes within the hour. No towing, no repairs."/>
<meta name="robots" content="index,follow"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body>
<h1>Chicago Jump Start & Dead Car Battery Help</h1>

<p>If your car won’t start in Chicago, a dead battery is one of the most common causes—especially in cold weather and street parking.</p>

<h2>Same-Day Jump Start Service</h2>
<p>Same-day service is often possible and may be completed within the hour depending on availability.</p>

<h2>Flat-Fee Pricing</h2>
<p><strong>$75 flat</strong>. Jump start only. No towing. No repairs.</p>

<h2>Get Help Now</h2>
<ul>
<li><a href="{DISPATCH_URL}">Open Dispatch Console</a></li>
<li><a href="{WOO_URL}">Book $75 Jump Start</a></li>
</ul>

<h2>Related Jump Start Topics</h2>
<ul>
{links}
</ul>

<p><em>Last updated: {datetime.date.today()}</em></p>
</body>
</html>
"""

def spoke_page(keyword):
    title = f"{keyword.title()} — Chicago Jump Start ($75)"
    slug = slugify(keyword) + ".html"

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>{title}</title>
<meta name="description" content="Need {keyword}? Flat $75 mobile jump start in Chicago. Same day service possible. No towing, no repairs."/>
<meta name="robots" content="index,follow"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body>
<h1>{keyword.title()}</h1>

<p>If your vehicle won’t start in Chicago, a dead battery is often the cause—especially during winter or short trips.</p>

<h2>Fast, Local Option</h2>
<p>A mobile jump start can get you moving again the same day, sometimes within the hour depending on availability.</p>

<h2>Service Scope</h2>
<ul>
<li>Jump start / battery boost</li>
<li>No towing</li>
<li>No mechanical repairs</li>
</ul>

<h2>Next Steps</h2>
<ul>
<li><a href="{DISPATCH_URL}">Dispatch Console</a></li>
<li><a href="{WOO_URL}">Book $75 Jump Start</a></li>
<li><a href="index.html">Back to Chicago Jump Start Hub</a></li>
</ul>

<p><em>Updated: {datetime.date.today()}</em></p>
</body>
</html>
"""
    return slug, html

def main():
    kw = load_json(KEYWORDS_FILE)["keywords"]
    mem = load_json(MEMORY_FILE)

    unused = [k for k in kw if k not in mem["used"]]
    if not unused:
        mem["used"] = []
        unused = kw[:]

    keyword = random.choice(unused)
    slug, html = spoke_page(keyword)

    with open(os.path.join(ROOT, slug), "w", encoding="utf-8") as f:
        f.write(html)

    mem["used"].append(keyword)
    mem["total_pages"] += 1
    save_json(MEMORY_FILE, mem)

    spokes = sorted([f for f in os.listdir(ROOT) if f.endswith(".html") and f != "index.html"])
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as f:
        f.write(foundation_page(spokes))

    print(f"Generated: {slug}")

if __name__ == "__main__":
    main()