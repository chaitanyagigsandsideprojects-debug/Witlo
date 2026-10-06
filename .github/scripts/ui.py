"""Emulator UI driver: finds on-screen text with OCR (tesseract) and taps it.
Saves a small JPEG of every step to shots/ so the run can be reviewed."""
import csv, io, os, subprocess, sys, time
from PIL import Image

PKG = "com.loganapps.witlo"
os.makedirs("shots", exist_ok=True)
N = [0]
W = H = 0

def sh(*a):
    return subprocess.run(["adb", "shell", *a], capture_output=True, text=True).stdout

def alive():
    return sh("pidof", PKG).strip() != ""

def grab(name=None):
    global W, H
    png = subprocess.run(["adb", "exec-out", "screencap", "-p"], capture_output=True).stdout
    img = Image.open(io.BytesIO(png)).convert("RGB")
    W, H = img.size
    if name:
        N[0] += 1
        small = img.resize((W * 360 // W, H * 360 // W))
        small.save(f"shots/{N[0]:02d}-{name}.jpg", quality=70)
    return img

def words(img):
    from PIL import ImageOps
    g = img.convert("L")
    rows = []
    for variant in (g, ImageOps.invert(g)):
        rows += _ocr(variant)
    return rows

def _ocr(g):
    buf = io.BytesIO(); g.save(buf, "PNG")
    out = subprocess.run(["tesseract", "stdin", "stdout", "--psm", "11", "tsv"], input=buf.getvalue(), capture_output=True).stdout.decode("utf8", "ignore")
    rows = []
    for r in csv.DictReader(io.StringIO(out), delimiter="\t", quoting=csv.QUOTE_NONE):
        t = (r.get("text") or "").strip()
        if t:
            rows.append((t, int(r["left"]), int(r["top"]), int(r["width"]), int(r["height"])))
    return rows

def find(word, img=None):
    """Exact, case-sensitive word match; the lowest match on screen wins (buttons sit below body text)."""
    img = img or grab()
    hits = [(tp, l + w // 2, tp + h // 2) for t, l, tp, w, h in words(img) if t.replace("\u2019", "'").strip(".,:!?'\"") == word]
    if not hits:
        return None
    hits.sort()
    return hits[-1][1], hits[-1][2]

def tap_xy(x, y):
    sh("input", "tap", str(x), str(y))

def swipe_up():
    sh("input", "swipe", str(W // 2), str(int(H * 0.75)), str(W // 2), str(int(H * 0.3)), "350"); time.sleep(1.2)

def tap(word, wait=10, required=True, name=None, scroll=False):
    end = time.time() + wait; tries = 0
    while time.time() < end:
        if scroll and tries: swipe_up()
        tries += 1
        p = find(word)
        if p:
            tap_xy(*p); print(f"tapped {word!r} at {p}"); time.sleep(1.5)
            if name: grab(name)
            return True
        time.sleep(1)
    grab(f"missing-{word.replace(' ', '_')}")
    print(f"{'::error title=UI step::' if required else ''}could not find {word!r} on screen")
    if required:
        raise SystemExit(2)
    return False

def step(name):
    time.sleep(1.5)
    if not alive():
        print(f"::error title=Crash::App crashed after: {name}")
        raise SystemExit(3)
    grab(name); print(f"[ok] {name}")

def main():
    step("launch")
    tap("older"); grab("ticked"); tap("Agree"); step("terms-done")
    p = find("USERNAME")
    if p:
        tap_xy(p[0] + int(W * 0.2), p[1] + int(H * 0.045)); time.sleep(1)
    sh("input", "text", "tester_77"); time.sleep(1); sh("input", "keyevent", "111"); time.sleep(1)
    step("name-typed")
    tap("play", name="after-letsplay", scroll=True, wait=20); step("home")
    time.sleep(2)
    tap("BLITZ", wait=15); step("matchmaking")
    time.sleep(5); step("game-start")
    t0 = time.time(); taps = 0
    pts = [(0.28, 0.66), (0.72, 0.66), (0.28, 0.78), (0.72, 0.78), (0.5, 0.86), (0.5, 0.72)]
    while time.time() - t0 < 80:
        x, y = pts[taps % len(pts)]
        tap_xy(int(W * x), int(H * y)); taps += 1
        time.sleep(0.9)
        if taps % 20 == 0:
            if not alive():
                print(f"::error title=Crash::App crashed during Blitz after {taps} taps"); raise SystemExit(3)
            grab(f"game-{taps}")
    step("result")
    tap("Home", wait=12, required=False); time.sleep(6); step("after-home")
    sh("input", "keyevent", "4"); time.sleep(2); step("after-back")
    for t in ("Train", "Leaders", "Profile", "Home"):
        tap(t, required=False); step(f"tab-{t}")
    print("::notice title=UI test::Full flow finished without a crash")

if __name__ == "__main__":
    main()
