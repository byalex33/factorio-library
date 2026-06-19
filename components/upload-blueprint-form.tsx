"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  blueprintCategories,
  makeBlueprintId,
  parseTags,
  saveStoredBlueprint,
  validateBlueprintString,
  type StoredBlueprint,
} from "@/lib/blueprints";

export function UploadBlueprintForm({ author }: { author: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(blueprintCategories[0]);
  const [gameVersion, setGameVersion] = useState("2.0.x");
  const [tags, setTags] = useState("");
  const [blueprintString, setBlueprintString] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const stringError = useMemo(() => validateBlueprintString(blueprintString), [blueprintString]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (cleanTitle.length < 3) {
      setError("Give your blueprint a title of at least 3 characters.");
      return;
    }

    const validationError = validateBlueprintString(blueprintString);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    const now = new Date().toISOString();
    const blueprint: StoredBlueprint = {
      id: makeBlueprintId(cleanTitle),
      title: cleanTitle,
      description: description.trim(),
      category,
      gameVersion: gameVersion.trim() || "Unknown",
      tags: parseTags(tags),
      blueprintString: blueprintString.trim(),
      author,
      createdAt: now,
      updatedAt: now,
    };

    try {
      saveStoredBlueprint(blueprint);
      router.push(`/blueprints/${blueprint.id}`);
    } catch (err) {
      console.error(err);
      setSaving(false);
      setError("Could not save this blueprint in your browser. The string may be too large for local storage.");
    }
  }

  return (
    <form className="upload-form" onSubmit={submit}>
      <div className="form-grid-two">
        <label>
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Compact green circuits" maxLength={90} required />
        </label>
        <label>
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {blueprintCategories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        <span>Description</span>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does this blueprint do?" rows={4} maxLength={700} />
      </label>

      <div className="form-grid-two">
        <label>
          <span>Game version</span>
          <input value={gameVersion} onChange={(event) => setGameVersion(event.target.value)} placeholder="2.0.x" maxLength={30} />
        </label>
        <label>
          <span>Tags</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="tileable, early game, belts" maxLength={180} />
        </label>
      </div>

      <label>
        <span>Blueprint string</span>
        <textarea
          className="blueprint-string-input"
          value={blueprintString}
          onChange={(event) => setBlueprintString(event.target.value)}
          placeholder="0eNq..."
          rows={8}
          spellCheck={false}
          required
        />
      </label>

      <div className="upload-form-footer">
        <p className={stringError && blueprintString ? "form-warning" : "form-note"}>
          {blueprintString ? stringError ?? `${blueprintString.trim().length.toLocaleString()} characters ready` : "Paste a single Factorio blueprint string. Blueprint books are not supported yet."}
        </p>
        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Add blueprint"}</button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
