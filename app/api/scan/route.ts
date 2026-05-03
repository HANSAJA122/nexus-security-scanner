import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

const vulnMap: Record<string, { advice: string; severity: "critical" | "warning" | "secure" | "info" }> = {
  "ftp": { severity: "critical", advice: "Unencrypted FTP. Version reveals OS details. Replace with SFTP." },
  "ssh": { severity: "info", advice: "SSH detected. Check if version is vulnerable to Terrapin attacks." },
  "telnet": { severity: "critical", advice: "Telnet is active. Credentials sent in CLEAR TEXT. Disable now." },
  "http": { severity: "warning", advice: "Web server is unencrypted. Banner may reveal server software." },
  "https": { severity: "secure", advice: "HTTPS active. Banner reveals SSL/TLS provider details." },
  "mysql": { severity: "critical", advice: "Database port exposed. Check banner for version-specific exploits." },
  "unknown": { severity: "info", advice: "Unknown service. Manual investigation required." }
};

export async function POST(req: Request) {
  try {
    const { target } = await req.json();
    const sanitized = target.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Execute Python Banner Grabber
    const { stdout } = await execPromise(`python3 scanner.py ${sanitized}`);
    const rawData = JSON.parse(stdout);
    
    const enrichedFindings = rawData.findings.map((f: any) => {
      const config = vulnMap[f.service] || vulnMap["unknown"];
      
      // LOGIC: If the banner mentions "Ubuntu" or "Debian", escalate info
      let customAdvice = config.advice;
      if (f.banner.toLowerCase().includes("ubuntu")) {
        customAdvice += " (System appears to be running Ubuntu Linux)";
      }

      return {
        ...f,
        severity: config.severity,
        advice: customAdvice
      };
    });

    return NextResponse.json({ target: rawData.target, findings: enrichedFindings });

  } catch (error) {
    return NextResponse.json({ error: "Service Analysis Engine Offline" }, { status: 500 });
  }
}