import os
import sys
import time
import pickle
import tempfile
import shutil
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ─── CONFIG ─────────────────────────────────────────────────────────────────────
driver_dir       = r"E:\chromedriver-win64\chromedriver-win64"
chromedriver_exe = os.path.join(driver_dir, "chromedriver.exe")
cookie_file      = os.path.join(driver_dir, "snapchat_cookies.pkl")
friend_file      = os.path.join(driver_dir, "broken_streaks.txt")
ticket_url       = (
    "https://help.snapchat.com/hc/en-us/requests/new"
    "?co=true&ticket_form_id=149423"
)
USERNAME = "azal.daniel"
EMAIL    = "arabicphysicist@gmail.com"
PHONE    = "+92 306 407 8867"

# ─── SETUP BROWSER ───────────────────────────────────────────────────────────────
options = Options()
options.add_argument("--start-maximized")
driver = webdriver.Chrome(service=Service(chromedriver_exe), options=options)
wait   = WebDriverWait(driver, 20)

# ─── COOKIE HANDLERS (robust) ───────────────────────────────────────────────────
def save_cookies():
    dirpath = os.path.dirname(cookie_file) or "."
    fd, tmp_path = tempfile.mkstemp(dir=dirpath)
    os.close(fd)
    try:
        with open(tmp_path, "wb") as f:
            pickle.dump(driver.get_cookies(), f)
        shutil.move(tmp_path, cookie_file)
        print("💾 CAPTCHA cookies saved.")
    except Exception as e:
        try: os.remove(tmp_path)
        except: pass
        print(f"⚠️ Failed to save cookies: {e}")

from selenium.common.exceptions import WebDriverException
import socket

def load_cookies(retries=3, delay=2):
    """Try to open the ticket URL and load cookies. If network fails, return False (no crash)."""
    # if cookie file doesn't exist or is empty, bail early
    if not os.path.exists(cookie_file):
        return False
    try:
        if os.path.getsize(cookie_file) == 0:
            print("⚠️ Cookie file exists but is empty. Backing up and treating as first run.")
            try: os.rename(cookie_file, cookie_file + ".empty.bak")
            except: pass
            return False
    except Exception:
        return False

    # try to load page (with retries) before adding cookies
    last_exc = None
    for attempt in range(1, retries + 1):
        try:
            driver.get(ticket_url)
            break
        except WebDriverException as e:
            last_exc = e
            print(f"⚠️ Network/driver error on driver.get() (attempt {attempt}/{retries}): {e}")
            time.sleep(delay * attempt)
        except Exception as e:
            last_exc = e
            print(f"⚠️ Unexpected error on driver.get() (attempt {attempt}/{retries}): {e}")
            time.sleep(delay * attempt)
    else:
        # all attempts failed — give a helpful hint and treat as first run
        print("❌ Unable to open ticket URL after several attempts. Check internet/DNS/proxy. Proceeding without cookies.")
        # optional: write a small diagnostic about DNS resolution
        try:
            host = ticket_url.split("//", 1)[1].split("/", 1)[0]
            print("🔎 Quick DNS check:", host)
            try:
                ips = socket.gethostbyname_ex(host)[2]
                print("Resolved IPs:", ips)
            except Exception as dns_e:
                print("DNS lookup failed:", dns_e)
        except Exception:
            pass
        return False

    # If we got here, the page loaded; try to load cookies
    try:
        with open(cookie_file, "rb") as f:
            cookies = pickle.load(f)
    except Exception as e:
        print(f"⚠️ Cookie load problem: {e}. Will treat as first run.")
        try: os.rename(cookie_file, cookie_file + ".bad.bak")
        except: pass
        return False

    added = 0
    for ck in cookies:
        try:
            safe_ck = {k: v for k, v in ck.items() if k in ("name","value","path","domain","secure","httpOnly","expiry")}
            driver.add_cookie(safe_ck)
            added += 1
        except Exception:
            pass

    driver.refresh()
    print(f"🗝️ Cookies loaded; {added}/{len(cookies)} applied; attempting bypass.")
    return True


    driver.get(ticket_url)
    try:
        with open(cookie_file, "rb") as f:
            cookies = pickle.load(f)
    except Exception as e:
        print(f"⚠️ Cookie load problem: {e}. Will treat as first run.")
        try: os.rename(cookie_file, cookie_file + ".bad.bak")
        except: pass
        return False

    added = 0
    for ck in cookies:
        try:
            safe_ck = {k: v for k, v in ck.items() if k in ("name","value","path","domain","secure","httpOnly","expiry")}
            driver.add_cookie(safe_ck)
            added += 1
        except Exception:
            pass
    driver.refresh()
    print(f"🗝️ Cookies loaded; {added}/{len(cookies)} applied; attempting bypass.")
    return True

# ─── FRIEND LOADING / PICK ──────────────────────────────────────────────────────
def load_friends():
    if not os.path.exists(friend_file):
        print(f"❌ {friend_file} not found.")
        return []
    return [line.strip() for line in open(friend_file, encoding="utf-8") if line.strip()]

def pick(friends):
    print(f"📂 {len(friends)} friends loaded.")
    print("👥 Available:", ", ".join(friends))
    ans = input("Type usernames (comma-separated) or 'all': ").strip()
    if ans.lower() == "all":
        return friends
    given = [u.strip() for u in ans.split(",") if u.strip()]
    friends_lc = {f.lower(): f for f in friends}
    chosen = []
    for u in given:
        key = u.lower()
        if key in friends_lc:
            chosen.append(friends_lc[key])
        else:
            print(f"⚠️ '{u}' not in friend list; skipping.")
    return chosen

# ─── UTIL FIND/SET HELPERS ──────────────────────────────────────────────────────
def debug_list_inputs(scope_driver=None):
    d = scope_driver or driver
    items = []
    elems = d.find_elements(By.TAG_NAME, "input") + d.find_elements(By.TAG_NAME, "textarea")
    elems += [e for e in d.find_elements(By.CSS_SELECTOR, "[contenteditable='true']")]
    for e in elems:
        try:
            items.append({
                "tag": e.tag_name,
                "type": e.get_attribute("type"),
                "name": e.get_attribute("name"),
                "placeholder": e.get_attribute("placeholder"),
                "aria-label": e.get_attribute("aria-label"),
                "id": e.get_attribute("id"),
                "text": (e.text or "")[:120]
            })
        except:
            pass
    print("🔎 Page inputs:", items)

def js_set(el, value):
    try:
        driver.execute_script("""
            const el = arguments[0];
            const val = arguments[1] || '';
            if (el.getAttribute && el.getAttribute('contenteditable') === 'true') {
                el.focus();
                el.innerText = val;
            } else {
                el.focus();
                el.value = val;
            }
            el.dispatchEvent(new Event('input', {bubbles: true}));
            el.dispatchEvent(new Event('change', {bubbles: true}));
            el.dispatchEvent(new Event('blur', {bubbles: true}));
        """, el, value)
        return True
    except Exception as e:
        print(f"⚠️ js_set failed: {e}")
        return False

def safe_send(el, value):
    try:
        el.clear()
    except:
        pass
    try:
        el.send_keys(value)
    except Exception:
        pass
    return js_set(el, value)

def find_by_name_or_label(name_attr, label_text):
    # 1) try exact name attr (preferred)
    try:
        return driver.find_element(By.NAME, name_attr)
    except:
        pass
    # 2) try xpath using label-like text. Use contains(lowercase) to be robust.
    try:
        low = label_text.lower()
        xpath = ("//*[contains(translate(normalize-space(string(.)),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),"
                 " '%s')]/following::input[1] | "
                 "//*[contains(translate(normalize-space(string(.)),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),"
                 " '%s')]/following::textarea[1]" ) % (low, low)
        els = driver.find_elements(By.XPATH, xpath)
        if els:
            return els[0]
    except Exception:
        pass
    # 3) try to find by placeholder or aria-label matching label_text
    try:
        elems = driver.find_elements(By.CSS_SELECTOR, "input,textarea,[contenteditable='true']")
        for e in elems:
            attrs = " ".join(filter(None, [e.get_attribute("name") or "", e.get_attribute("placeholder") or "",
                                           e.get_attribute("aria-label") or "", e.get_attribute("id") or ""])).lower()
            if label_text.lower() in attrs:
                return e
    except:
        pass
    return None

def find_field_with_iframes(name_attr, label_text):
    el = find_by_name_or_label(name_attr, label_text)
    if el:
        return el, None
    # iterate iframes (best-effort)
    iframes = driver.find_elements(By.TAG_NAME, "iframe")
    for fr in iframes:
        try:
            driver.switch_to.frame(fr)
            el = find_by_name_or_label(name_attr, label_text)
            if el:
                return el, fr
        except Exception:
            pass
        finally:
            driver.switch_to.default_content()
    return None, None

# ─── HELPER TO WAIT FOR SUCCESS ─────────────────────────────────────────────────
def wait_for_success(timeout=90):
    success_h1 = "//h1[contains(@class,'success-page-title') and contains(translate(string(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), 'we got your request')]"
    wait_short = WebDriverWait(driver, timeout)
    wait_short.until(EC.visibility_of_element_located((By.XPATH, success_h1)))

# ─── MAIN ──────────────────────────────────────────────────────────────────────
friends = load_friends()
if not friends:
    driver.quit()
    sys.exit(1)

selected = pick(friends)
if not selected:
    print("No valid friends chosen; exiting.")
    driver.quit()
    sys.exit(1)

cookies_loaded = load_cookies()
first_iteration_done = False

# MAIN loop
for idx, friend in enumerate(selected, start=1):
    print(f"\n🔄 Processing {friend} ({idx}/{len(selected)})…")
    driver.get(ticket_url)
    time.sleep(1.2)  # let JS start

    # DEBUG: dump inputs and save page for inspection
    print(f"\n🔍 Debug input fields on page for friend {friend}:")
    debug_list_inputs()
    dump_path = os.path.join(driver_dir, f"page_dump_{idx}_{friend}.html")
    try:
        with open(dump_path, "w", encoding="utf-8") as fh:
            fh.write(driver.page_source)
        print(f"🔽 Full page HTML dumped to: {dump_path}")
    except Exception as e:
        print(f"⚠️ Could not write page dump: {e}")

    # fields to fill: (label text used for XPath fallback)
    fields = [
        ("request[custom_fields][24281229]", "Username", USERNAME),
        ("request[custom_fields][24335325]", "Email", EMAIL),
        ("request[custom_fields][24369716]", "Mobile Number", PHONE),
        ("request[custom_fields][24369736]", "Friend's Username", friend),
    ]

    # Fill fields using robust finders; try exact name first then label-based fallback
    for name_attr, label_text, val in fields:
        el, fr = find_field_with_iframes(name_attr, label_text)
        if not el:
            print(f"❗ Couldn't find field for '{label_text}' (name='{name_attr}'). Dumping inputs for debug:")
            debug_list_inputs()
            # last-resort: try simple JS filler by searching for label words
            # we'll skip that auto fallback here to avoid mismatches; continue
            continue

        # if element is inside an iframe, switch into it for interaction
        if fr is not None:
            try:
                driver.switch_to.frame(fr)
            except Exception:
                pass

        ok = safe_send(el, val)
        if ok:
            print(f"✓ Filled '{label_text}' with '{val}'.")
        else:
            print(f"⚠️ Tried to set '{label_text}' but uncertain it registered.")

        driver.switch_to.default_content()

    # Now attempt to click submit
    # If this is the very first iteration and cookies were not loaded, we fill first then click and wait for success,
    # allowing you to solve CAPTCHA in-browser when it appears.
    try:
        # Find submit button with multiple strategies
        btn = None
        for sel in ["input[type=submit]", "button[type=submit]", "button[class*='submit']", "button[data-testid='submit']"]:
            try:
                btn = driver.find_element(By.CSS_SELECTOR, sel)
                if btn and btn.is_displayed():
                    break
            except:
                btn = None
        if not btn:
            # fallback: visible button with submit/send/request text
            buttons = driver.find_elements(By.TAG_NAME, "button")
            for b in buttons:
                try:
                    txt = (b.text or "").strip().lower()
                    if any(k in txt for k in ("submit", "send", "request")) and b.is_displayed():
                        btn = b
                        break
                except:
                    pass

        if not btn:
            print("❌ Could not find a submit button. Dumping inputs for debug:")
            debug_list_inputs()
        else:
            driver.execute_script("arguments[0].scrollIntoView(true);", btn)
            driver.execute_script("arguments[0].click();", btn)
            print("⏳ Clicked Submit (if CAPTCHA present, solve it in the browser). Waiting for confirmation...")
    except Exception as e:
        print(f"❌ Submit-click failed: {e}")

    # Wait for success. If it times out, we still continue but we don't save cookies.
    saved_this_round = False
    try:
        wait_for_success(timeout=120)  # give user time to solve captcha if needed
        print("✅ Submission confirmed!")
        # Save cookies after a successful first submission (or any successful one)
        save_cookies()
        saved_this_round = True
    except Exception as e:
        print(f"❌ Didn't reach confirmation within timeout: {e}")
        # If this was the first iteration and cookies were not loaded, we should not prompt user earlier.
        # Continue to next friend (you may need to manually solve captcha if it blocked)
        pass

    # mark first iteration done once we attempted the first friend
    if not first_iteration_done:
        first_iteration_done = True

    # small delay before next form
    time.sleep(1.0)

driver.quit()
print("\n🎉 All done!")
