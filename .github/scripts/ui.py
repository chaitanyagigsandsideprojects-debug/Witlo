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
    buf = io.BytesIO(); img.convert("L").save(buf, "PNG")
    out = subprocess.run(["tesseract", "stdin", "stdout", "--psm", "11", "tsv"], input=buf.getvalue(), capture_output=True).stdout.decode("utf8", "ignore")
    rows = []
    for r in csv.DictReader(io.StringIO(out), delimiter="\t", quoting=csv.QUOTE_NONE):
        t = (r.get("text") or "").strip()
        if t:
            rows.append((t, int(r["left"]), int(r["top"]), int(r["width"]), int(r["height"])))
    return rows

def find(word, img=None):
    img = img or grab()
    for t, l, tp, w, h in words(img):
        if word.lower() in t.lower():
            return l + w // 2, tp + h // 2
    return None

def tap_xy(x, y):
    sh("input", "tap", str(x), str(y))

def tap(word, wait=10, required=True, name=None):
    end = time.time() + wait
    while time.time() < end:
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
    tap("older"); tap("Agree"); step("terms-done")
    tap("chai_lover", required=False)
    sh("input", "text", "tester_77"); time.sleep(1); sh("input", "keyevent", "111"); time.sleep(1)
    step("name-typed")
    tap("play", name="after-letsplay"); step("home")
    time.sleep(2)
    tap("BLITZ"); step("matchmaking")
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
    for t in ("Train", "Leaders", "Profile"):
        tap(t, required=False); step(f"tab-{t}")
    print("::notice title=UI test::Full flow finished without a crash")

if __name__ == "__main__":
    main()
