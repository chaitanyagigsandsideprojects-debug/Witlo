"""Tiny UI driver for the emulator smoke test: tap things by visible text / accessibility label / testID."""
import re, subprocess, sys, time, xml.etree.ElementTree as ET
PKG = "com.loganapps.witlo"

def sh(*a):
    return subprocess.run(["adb", "shell", *a], capture_output=True, text=True).stdout

def alive():
    return sh("pidof", PKG).strip() != ""

def dump():
    for _ in range(3):
        sh("uiautomator", "dump", "/sdcard/ui.xml")
        x = subprocess.run(["adb", "exec-out", "cat", "/sdcard/ui.xml"], capture_output=True, text=True).stdout
        if "<hierarchy" in x:
            return ET.fromstring(x[x.index("<hierarchy"):])
        time.sleep(1)
    return None

def center(n):
    a = list(map(int, re.findall(r"\d+", n.get("bounds"))))
    return (a[0] + a[2]) // 2, (a[1] + a[3]) // 2

def find(label, root=None):
    root = root if root is not None else dump()
    if root is None:
        return None
    for n in root.iter("node"):
        for key in ("content-desc", "text", "resource-id"):
            v = n.get(key) or ""
            if v == label or (key != "resource-id" and label in v):
                return n
    return None

def tap(label, wait=8, required=True):
    end = time.time() + wait
    while time.time() < end:
        n = find(label)
        if n is not None:
            x, y = center(n)
            sh("input", "tap", str(x), str(y))
            print(f"tapped {label!r}")
            time.sleep(1.2)
            return True
        time.sleep(1)
    print(f"{'::error title=UI step::' if required else ''}could not find {label!r}")
    if required:
        raise SystemExit(2)
    return False

def step(name):
    time.sleep(1.5)
    ok = alive()
    print(f"[{'ok' if ok else 'CRASHED'}] after: {name}")
    if not ok:
        print(f"::error title=Crash::App crashed after: {name}")
        raise SystemExit(3)

def main():
    step("launch")
    tap("I am 14 or older"); tap("Agree and continue"); step("terms")
    root = dump()
    edit = next((n for n in root.iter("node") if n.get("class") == "android.widget.EditText"), None)
    if edit is not None:
        x, y = center(edit); sh("input", "tap", str(x), str(y)); time.sleep(1)
        sh("input", "text", "tester_77"); time.sleep(1); sh("input", "keyevent", "111"); time.sleep(1)
    tap("Let's play"); step("setup")
    time.sleep(2)
    tap("Play Blitz"); step("start blitz")
    t0 = time.time(); answered = 0
    while time.time() - t0 < 85:
        root = dump()
        if root is None: break
        if find("Go home", root) is not None: break
        n = find("opt-0", root)
        if n is not None:
            x, y = center(n); sh("input", "tap", str(x), str(y)); answered += 1
        if not alive():
            print(f"::error title=Crash::App crashed during Blitz after {answered} answers"); raise SystemExit(3)
        time.sleep(0.8)
    print(f"answered {answered} questions"); step("blitz game")
    tap("Go home", wait=15, required=False); time.sleep(6); step("go home (maybe ad)")
    sh("input", "keyevent", "4"); time.sleep(2)  # close a test ad if one is open
    if not alive():
        sh("monkey", "-p", PKG, "-c", "android.intent.category.LAUNCHER", "1"); time.sleep(5)
    for t in ("Train", "Leaders", "Profile", "Home"):
        tap(t, required=False); step(f"tab {t}")
    tap("Daily 5", required=False); step("daily 5")
    print("::notice title=UI test::Full flow passed without a crash")

if __name__ == "__main__":
    main()
