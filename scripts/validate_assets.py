from pathlib import Path
from xml.etree import ElementTree


root = Path(__file__).resolve().parents[1]
ElementTree.parse(root / "mulesoft/src/main/mule/railway-proxy.xml")
openapi = (root / "contracts/openapi.yaml").read_text()
agent = (root / "agentforce/RailwayBooking.agent").read_text()
required = ["openapi: 3.1.0", "/v1/trips/search:", "/v1/bookings/lock:"]
if not all(item in openapi for item in required):
    raise SystemExit("OpenAPI contract is incomplete")
if "approval_required: true" not in agent or "fictional" not in agent.lower():
    raise SystemExit("Agent contract is missing safety declarations")
print("validated OpenAPI, Agentforce, and MuleSoft reference assets")

