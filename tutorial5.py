from anticaptchaofficial.imagecaptcha import *
import requests
import base64


def find_between(s, start, end):
    return (s.split(start))[1].split(end)[0]


response = requests.get("https://anti-captcha.com/demo?page=image_captcha")
base64str = find_between(response.text, ";base64,", "\">")
c_str = find_between(response.text, " name=\"c\" value=\"", "\">")

print(f"base64: {base64str}")
print(f"c_str: {c_str}")

# save base64 image to a temporary file
with open("tmp.file", "wb") as file:
    file.write(base64.urlsafe_b64decode(base64str))


solver = imagecaptcha()
solver.set_verbose(1)
solver.set_key("API_KEY_HERE")
captcha_text = solver.solve_and_return_solution("tmp.file")
if captcha_text != 0:
    print("captcha text "+captcha_text)
    res = requests.post("https://anti-captcha.com/demo/submit_image.php", data={
        "login": "testlogin",
        "pass": "testpass",
        "c": c_str,
        "captcha": captcha_text
    })
    if "test passed" in res.text:
        print("Our test passed!")
    if "Captcha test not passed" in res.text:
        print("Test NOT passed!")
else:
    print("task finished with error "+solver.error_code)