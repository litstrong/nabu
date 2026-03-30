use std::path::Path;
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;

#[derive(serde::Serialize)]
pub struct NoteFile {
    pub name: String,
    pub relative_path: String,
    pub absolute_path: String,
    pub size_bytes: u64,
    pub modified_at: Option<u64>,
}

#[tauri::command]
fn list_vault_files(vault_path: String) -> Result<Vec<NoteFile>, String> {
    let vault = Path::new(&vault_path);

    if !vault.exists() {
        return Err(format!("Path does not exist: {}", vault_path));
    }
    if !vault.is_dir() {
        return Err(format!("Path is not a directory: {}", vault_path));
    }

    let mut files = Vec::new();

    for entry in WalkDir::new(vault)
        .follow_links(false)
        .into_iter()
        // Skip hidden directories (e.g. .obsidian, .git, .trash)
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !name.starts_with('.')
        })
        .filter_map(|e| e.ok())
    {
        let path = entry.path();

        if !path.is_file() {
            continue;
        }

        let ext = match path.extension() {
            Some(e) => e.to_string_lossy().to_lowercase(),
            None => continue,
        };

        if ext != "md" {
            continue;
        }

        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let relative_path = path
            .strip_prefix(vault)
            .unwrap_or(path)
            .to_string_lossy()
            .to_string();

        let absolute_path = path.to_string_lossy().to_string();

        let metadata = path.metadata().ok();
        let size_bytes = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
        let modified_at = metadata
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs());

        files.push(NoteFile {
            name,
            relative_path,
            absolute_path,
            size_bytes,
            modified_at,
        });
    }

    files.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));

    Ok(files)
}

#[tauri::command]
async fn ask_ollama(model: String, prompt: String) -> Result<String, String> {
    let body = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "stream": false
    });
    let res = reqwest::Client::new()
        .post("http://localhost:11434/api/generate")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Ollama unreachable: {e}"))?;
    let json: serde_json::Value = res
        .json()
        .await
        .map_err(|e| format!("Parse error: {e}"))?;
    json["response"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| format!("Unexpected response: {json}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![list_vault_files, ask_ollama])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
