import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

interface NoteFile {
  name: string;
  relative_path: string;
  absolute_path: string;
  size_bytes: number;
  modified_at: number | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function App() {
  const [vaultPath, setVaultPath] = useState("");
  const [files, setFiles] = useState<NoteFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  const selectFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Obsidian Vault",
    });
    if (selected && typeof selected === "string") {
      setVaultPath(selected);
    }
  };

  const scanVault = async () => {
    if (!vaultPath.trim()) {
      setError("Please enter or select a vault path");
      return;
    }
    setLoading(true);
    setError(null);
    setScanned(false);
    try {
      const result = await invoke<NoteFile[]>("list_vault_files", {
        vaultPath: vaultPath.trim(),
      });
      setFiles(result);
      setScanned(true);
    } catch (e) {
      setError(String(e));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white leading-none">
            Nabu
          </h1>
          <p className="text-xs text-gray-500 mt-1">Obsidian Vault Document Browser</p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-6 max-w-3xl w-full mx-auto">
        {/* Vault Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Vault Path
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={vaultPath}
              onChange={(e) => setVaultPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scanVault()}
              placeholder="/Users/yourname/Documents/MyVault"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            <button
              onClick={selectFolder}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors whitespace-nowrap"
            >
              Browse
            </button>
            <button
              onClick={scanVault}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors whitespace-nowrap"
            >
              {loading ? "Scanning…" : "Scan"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-950/50 border border-red-800/60 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {scanned && !error && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-300">Documents</h2>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                {files.length} {files.length === 1 ? "file" : "files"}
              </span>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm">
                No Markdown documents found
              </div>
            ) : (
              <div className="rounded-lg border border-gray-800 overflow-hidden">
                {files.map((file, index) => (
                  <div
                    key={file.absolute_path}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                      index !== files.length - 1 ? "border-b border-gray-800/70" : ""
                    } hover:bg-gray-900/60 transition-colors`}
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <span className="text-gray-200 font-mono text-xs block truncate">
                        {file.relative_path}
                      </span>
                    </div>
                    <span className="text-gray-600 text-xs shrink-0 tabular-nums">
                      {formatSize(file.size_bytes)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!scanned && !loading && (
          <div className="text-center py-20 text-gray-600 text-sm">
            Enter a vault path and click Scan
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
