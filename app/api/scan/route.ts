import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

const vulnMap: Record<number, { advice: string; severity: "critical" | "warning" | "secure" | "info" }> = {
  21: { severity: "critical", advice: "FTP (Unencrypted). Credentials can be sniffed. Use SFTP." },
  22: { severity: "info", advice: "SSH detected. Ensure strong key-based auth is enforced." },
  23: { severity: "critical", advice: "Telnet (Legacy). Highly insecure; migrate to SSH." },
  80: { severity: "warning", advice: "HTTP (Unencrypted). Traffic is visible; migrate to HTTPS." },
  443: { severity: "secure", advice: "HTTPS detected. SSL/TLS encryption is active." },
  3306: { severity: "critical", advice: "MySQL Database exposed. High-severity risk if public." },
  8080: { severity: "info", advice: "Alternative Web Port. Check for admin panels." }
};

export async function POST(req: Request) {
  try {
    const { target } = await req.json();
    if (!target) return NextResponse.json({ error: "No target" }, { status: 400 });

    const sanitized = target.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const { stdout } = await execPromise(`python3 scanner.py ${sanitized}`);

    // Parse the JSON from Python
    const rawData = JSON.parse(stdout);
    
    // Enrich the data with severity and advice
    const enrichedFindings = rawData.findings.map((f: any) => ({
      ...f,
      ...(vulnMap[f.port] || { severity: "info", advice: "Unknown service." })
    }));

    return NextResponse.json({ 
      target: rawData.target, 
      findings: enrichedFindings 
    });

  } catch (error) {
    return NextResponse.json({ error: "Scanner Engine Offline" }, { status: 500 });
  }
}