"""End-to-end API test using Python requests."""
import sys
import json

try:
    import requests
except ImportError:
    print("Installing requests...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "-q"])
    import requests

BASE = "http://localhost:8000"

def check(label, r):
    icon = "OK " if r.status_code == 200 else "ERR"
    print(f"{icon} [{r.status_code}] {label}")
    if r.status_code != 200:
        print(f"    -> {r.text[:200]}")
    return r.status_code == 200

# 1. Root
check("GET /", requests.get(f"{BASE}/"))

# 2. Stats
check("GET /api/stats", requests.get(f"{BASE}/api/stats"))

# 3. Unrecognized (before upload)
check("GET /api/train/unrecognized", requests.get(f"{BASE}/api/train/unrecognized"))

# 4. History (empty)
check("GET /api/history", requests.get(f"{BASE}/api/history"))

# 5. Upload Cisco config
cisco_config = b"""hostname core-router-01
no ip http server
line vty 0 4
 transport input all
"""
r = requests.post(
    f"{BASE}/api/upload",
    json={
        "filename": "cisco_test.txt",
        "content": cisco_config.decode(),
        "vendor": "auto",
    },
)
if check("POST /api/upload (Cisco)", r):
    d = r.json()
    print(f"     Vendor: {d['vendor']}, Hostname: {d['hostname']}")
    print(f"     Passed: {d['summary']['passed']}/{d['summary']['total']}, Failed: {d['summary']['failed']}")
    for res in d['results']:
        icon = "PASS" if res['status'] == 'PASS' else ("FAIL" if res['status'] == 'FAIL' else "SKIP")
        print(f"     [{icon}] {res['rule_id']} - {res['name']}")

# 6. Upload Juniper config
juniper_config = b"""set system host-name core-router-02
set system services web-management
set system services ssh
delete system services telnet
"""
r2 = requests.post(
    f"{BASE}/api/upload",
    json={
        "filename": "juniper_test.txt",
        "content": juniper_config.decode(),
        "vendor": "auto",
    },
)
if check("POST /api/upload (Juniper)", r2):
    d2 = r2.json()
    print(f"     Vendor: {d2['vendor']}, Hostname: {d2['hostname']}")
    print(f"     Passed: {d2['summary']['passed']}/{d2['summary']['total']}, Failed: {d2['summary']['failed']}")
    for res in d2['results']:
        icon = (
            "PASS"
            if res["status"] == "PASS"
            else "FAIL"
            if res["status"] == "FAIL"
            else "N/C"
        )
        print(
            f"     [{icon}] {res['rule_id']} - "
            f"{res['name']} "
            f"(actual={res['actual_value']}, expected={res['expected_value']})"
        )

# 7. Unrecognized after upload
r3 = requests.get(f"{BASE}/api/train/unrecognized")
check("GET /api/train/unrecognized (after upload)", r3)
if r3.status_code == 200:
    data = r3.json()
    print(f"     Vendor: {data['vendor']}, Unrecognized: {len(data['unrecognized'])} commands")

# 8. History after 2 uploads
r4 = requests.get(f"{BASE}/api/history")
check("GET /api/history (after 2 uploads)", r4)
if r4.status_code == 200:
    print(f"     Entries: {len(r4.json()['history'])}")

# 9. Train endpoint
r5 = requests.post(f"{BASE}/api/train", json={
    "vendor": "cisco",
    "raw_command": "ip http secure-server",
    "mapped_key": "https_enabled",
    "mapped_value": True
})
check("POST /api/train", r5)
if r5.status_code == 200:
    print(f"     {r5.json()['message']}")

# 10. PDF download
r6 = requests.get(f"{BASE}/api/report/download")
if check("GET /api/report/download", r6):
    print(f"     PDF size: {len(r6.content)} bytes, Content-Type: {r6.headers.get('Content-Type')}")

print("\nAll health checks complete.")
