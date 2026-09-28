"""Smoke test for backend parser and auditor."""
import sys
sys.path.insert(0, ".")

from parser import parse_config
from auditor import run_audit
from reporter import generate_pdf

# ---- Test 1: Cisco ----
cisco_config = """hostname core-router-01
no ip http server
line vty 0 4
 transport input all"""

result1 = parse_config(cisco_config, "cisco")
audit1 = run_audit(result1["parsed"], result1["vendor"])
print("=== CISCO TEST ===")
print(f"Vendor: {audit1['vendor']}, Hostname: {audit1['hostname']}")
for r in audit1["results"][:2]:
    print(f"  {r['rule_id']} [{r['name']}]: {r['status']}")

# CIS-1.1: no ip http server → http_enabled=False → expected False → PASS
assert audit1["results"][0]["status"] == "PASS", "CIS-1.1 should PASS for Cisco (no http server)"
# CIS-1.2: transport input all → ssh_only=False → expected True → FAIL
assert audit1["results"][1]["status"] == "FAIL", "CIS-1.2 should FAIL for Cisco (transport input all)"

# ---- Test 2: Juniper ----
juniper_config = """set system host-name core-router-02
set system services web-management
set system services ssh
delete system services telnet"""

result2 = parse_config(juniper_config, "juniper")
audit2 = run_audit(result2["parsed"], result2["vendor"])
print("\n=== JUNIPER TEST ===")
print(f"Vendor: {audit2['vendor']}, Hostname: {audit2['hostname']}")
for r in audit2["results"][:2]:
    print(f"  {r['rule_id']} [{r['name']}]: {r['status']}")

# CIS-1.1: set system services web-management → http_enabled=True → expected False → FAIL
assert audit2["results"][0]["status"] == "FAIL", "CIS-1.1 should FAIL for Juniper (web-management set)"
# CIS-1.2: ssh set + telnet deleted → ssh_only=True → expected True → PASS
assert audit2["results"][1]["status"] == "PASS", "CIS-1.2 should PASS for Juniper"

# ---- Test 3: PDF generation ----
pdf_bytes = generate_pdf(audit1)
assert len(pdf_bytes) > 1000, "PDF should have content"
print("\n=== PDF TEST ===")
print(f"PDF generated: {len(pdf_bytes)} bytes")

print("\n✅ ALL SMOKE TESTS PASSED")
