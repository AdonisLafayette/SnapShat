import time
import requests
import speech_recognition as sr
from pydub import AudioSegment
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

USERNAME = "your_snapchat_username"
EMAIL = "your_email@example.com"
PHONE = "+1 202 555 0192"
FRIEND = "your_friend_username"

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
driver.get("https://support.snapchat.com/submit/snapstreak")

wait = WebDriverWait(driver, 20)

# Fill out the form
wait.until(EC.presence_of_element_located((By.ID, "request_custom_fields_24281229"))).send_keys(USERNAME)
driver.find_element(By.ID, "request_custom_fields_24335325").send_keys(EMAIL)
driver.find_element(By.ID, "request_custom_fields_24369716").send_keys(PHONE)
driver.find_element(By.ID, "request_custom_fields_24369736").send_keys(FRIEND)

# Trigger CAPTCHA audio challenge
def solve_captcha():
    try:
        driver.switch_to.default_content()
        frames = driver.find_elements(By.TAG_NAME, "iframe")
        for frame in frames:
            driver.switch_to.frame(frame)
            if "recaptcha" in driver.page_source:
                break

        # Click checkbox
        checkbox = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, "recaptcha-checkbox-border")))
        checkbox.click()
        driver.switch_to.default_content()

        # Wait for challenge iframe
        time.sleep(2)
        frames = driver.find_elements(By.TAG_NAME, "iframe")
        for frame in frames:
            driver.switch_to.frame(frame)
            if "audio challenge" in driver.page_source or "recaptcha-audio-button" in driver.page_source:
                break

        # Click audio challenge button
        audio_btn = wait.until(EC.element_to_be_clickable((By.ID, "recaptcha-audio-button")))
        audio_btn.click()

        # Wait for audio download link
        time.sleep(2)
        audio_src = wait.until(EC.presence_of_element_located((By.ID, "audio-source"))).get_attribute("src")

        # Download and convert
        audio_data = requests.get(audio_src, timeout=10)
        with open("audio.mp3", "wb") as f:
            f.write(audio_data.content)
        sound = AudioSegment.from_mp3("audio.mp3")
        sound.export("audio.wav", format="wav")

        # Transcribe
        r = sr.Recognizer()
        with sr.AudioFile("audio.wav") as source:
            audio = r.record(source)
        text = r.recognize_google(audio)

        # Submit answer
        driver.find_element(By.ID, "audio-response").send_keys(text)
        driver.find_element(By.ID, "recaptcha-verify-button").click()

        time.sleep(2)
        driver.switch_to.default_content()

        print("[+] CAPTCHA solved and submitted")

        return True
    except Exception as e:
        print(f"[!] CAPTCHA solve failed: {e}")
        return False

if solve_captcha():
    time.sleep(2)
    driver.find_element(By.NAME, "commit").click()
    print("[+] Form submitted")
else:
    print("[!] Manual CAPTCHA intervention required — browser will remain open")
    while True:
        time.sleep(30)
