use clap::Parser;
use serde::Serialize;
use std::collections::HashSet;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Parser, Debug)]
#[command(
    name = "pennywright-context",
    version,
    about = "Estimate always-on session context tokens"
)]
struct Cli {
    #[arg(long)]
    json: bool,
    #[arg(long, short)]
    quiet: bool,
}

#[derive(Debug, Clone, Serialize)]
struct ContextRow {
    tokens: usize,
    source: String,
    note: String,
}

#[derive(Debug, Clone, Serialize)]
struct ContextReport {
    #[serde(rename = "estimatedAlwaysOnTokens")]
    estimated_always_on_tokens: usize,
    #[serde(rename = "mcpServers")]
    mcp_servers: usize,
    rows: Vec<ContextRow>,
}

fn estimate_tokens(path: &Path) -> usize {
    fs::metadata(path)
        .map(|m| (m.len() as usize) / 4)
        .unwrap_or(0)
}

fn count_frontmatter(dirs: &[PathBuf], file_name: Option<&str>) -> (usize, usize) {
    let mut count = 0usize;
    let mut chars = 0usize;
    for dir in dirs {
        if !dir.exists() {
            continue;
        }
        for entry in WalkDir::new(dir)
            .into_iter()
            .filter_entry(|e| e.file_name() != "node_modules")
            .flatten()
        {
            if !entry.file_type().is_file() {
                continue;
            }
            let name = entry.file_name().to_string_lossy();
            let matched = match file_name {
                Some(exact) => name == exact,
                None => name.ends_with(".md"),
            };
            if !matched {
                continue;
            }
            if let Ok(content) = fs::read_to_string(entry.path()) {
                count += 1;
                let mut fences = 0;
                for line in content.lines() {
                    if line.trim() == "---" {
                        fences += 1;
                        continue;
                    }
                    if fences == 1 {
                        chars += line.len() + 1;
                    }
                }
            }
        }
    }
    (count, chars / 4)
}

fn count_mcp_servers(paths: &[PathBuf]) -> Vec<(String, String)> {
    let mut out = Vec::new();
    for p in paths {
        let Ok(raw) = fs::read_to_string(p) else {
            continue;
        };
        let Ok(val) = serde_json::from_str::<serde_json::Value>(&raw) else {
            continue;
        };
        if let Some(servers) = val.get("mcpServers").and_then(|v| v.as_object()) {
            for (k, v) in servers {
                let target = v
                    .get("command")
                    .or_else(|| v.get("url"))
                    .and_then(|s| s.as_str())
                    .unwrap_or("");
                out.push((k.clone(), target.to_string()));
            }
        }
    }
    out
}

fn build_report(cwd: &Path, home: &Path, claude_home: &Path) -> ContextReport {
    let mut rows = Vec::new();
    let mut total = 0usize;
    let mut add = |tokens: usize, source: String, note: String| {
        total += tokens;
        rows.push(ContextRow {
            tokens,
            source,
            note,
        });
    };

    let mut seen = HashSet::new();
    let mem_candidates = [
        claude_home.join("CLAUDE.md"),
        claude_home.join("claude.md"),
        cwd.join("CLAUDE.md"),
        cwd.join(".claude").join("CLAUDE.md"),
        cwd.join("AGENTS.md"),
        cwd.join(".cursorrules"),
    ];
    for p in mem_candidates {
        if !p.is_file() {
            continue;
        }
        let canon = fs::canonicalize(&p).unwrap_or_else(|_| p.clone());
        if !seen.insert(canon) {
            continue;
        }
        let tokens = estimate_tokens(&p);
        let lines = fs::read_to_string(&p)
            .map(|s| s.lines().count())
            .unwrap_or(0);
        let note = if lines > 200 {
            format!("{lines} lines — OVER the 200-line guideline; run /miser-compress")
        } else {
            format!("{lines} lines")
        };
        add(tokens, p.to_string_lossy().into_owned(), note);
    }

    for p in [
        claude_home.join("settings.json"),
        cwd.join(".claude").join("settings.json"),
        cwd.join(".claude").join("settings.local.json"),
    ] {
        if p.is_file() {
            add(
                estimate_tokens(&p),
                p.to_string_lossy().into_owned(),
                String::new(),
            );
        }
    }

    let (sk_n, sk_t) = count_frontmatter(
        &[
            claude_home.join("skills"),
            claude_home.join("plugins"),
            cwd.join(".claude").join("skills"),
        ],
        Some("SKILL.md"),
    );
    if sk_n > 0 {
        add(
            sk_t,
            format!("{sk_n} skills advertised"),
            format!("~{} tokens each", sk_t / sk_n),
        );
    }

    let (ag_n, ag_t) = count_frontmatter(
        &[
            claude_home.join("agents"),
            cwd.join(".claude").join("agents"),
        ],
        None,
    );
    if ag_n > 0 {
        add(
            ag_t,
            format!("{ag_n} subagent definitions"),
            "name + description listed every session".into(),
        );
    }

    let mcp = count_mcp_servers(&[home.join(".claude.json"), cwd.join(".mcp.json")]);
    ContextReport {
        estimated_always_on_tokens: total,
        mcp_servers: mcp.len(),
        rows,
    }
}

fn main() {
    let cli = Cli::parse();
    let cwd = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let home = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."));
    let claude_home = env::var("CLAUDE_CONFIG_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| home.join(".claude"));
    let report = build_report(&cwd, &home, &claude_home);

    if cli.json {
        println!(
            "{}",
            serde_json::to_string_pretty(&report).unwrap_or_default()
        );
        return;
    }
    if !cli.quiet {
        println!("=== always-on context (estimate, chars/4) ===");
        println!("{:>8}  {:<52} note", "tokens", "source");
        let mut sorted = report.rows.clone();
        sorted.sort_by_key(|a| std::cmp::Reverse(a.tokens));
        for r in sorted {
            println!("{:>8}  {:<52} {}", r.tokens, r.source, r.note);
        }
        println!("\nMCP servers: {}", report.mcp_servers);
    }
    println!(
        "{:>8}  ESTIMATED ALWAYS-ON TOKENS",
        report.estimated_always_on_tokens
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_context_report_for_temp_workspace() {
        let dir = env::temp_dir().join("pw-ctx-test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join(".claude/skills/demo")).unwrap();
        fs::write(dir.join("AGENTS.md"), "hello world\n").unwrap();
        fs::write(
            dir.join(".mcp.json"),
            r#"{"mcpServers":{"gh":{"command":"gh"}}}"#,
        )
        .unwrap();
        fs::write(
            dir.join(".claude/skills/demo/SKILL.md"),
            "---\nname: demo\ndescription: hi\n---\nbody\n",
        )
        .unwrap();

        let report = build_report(&dir, &dir, &dir.join(".claude"));
        assert_eq!(report.mcp_servers, 1);
        assert!(report.estimated_always_on_tokens > 0);
        let _ = fs::remove_dir_all(&dir);
    }
}
